// lib/youtube/analytics.server.ts
// Historique YouTube via l'API YouTube Analytics (scope yt-analytics.readonly).
//
// Pourquoi : le snapshot horaire de Social Hub ne connaît le passé que depuis le
// jour où il a été lancé. L'API Analytics, elle, renvoie l'historique depuis la
// publication de la vidéo — un créateur qui connecte son compte voit donc ses
// courbes immédiatement, au lieu d'attendre que le cron accumule des points.
import "server-only";
import { prisma } from "@/lib/prisma";
import { getFreshGoogleAccessToken } from "@/lib/google/perUser";

const ANALYTICS = "https://youtubeanalytics.googleapis.com/v2/reports";
const DATA = "https://www.googleapis.com/youtube/v3";

const MAX_VIDEOS = 50;      // vidéos les plus récentes prises en compte
const MAX_DAYS = 365;       // profondeur d'historique demandée
const ID_CHUNK = 5;        // requetes Analytics en parallele (1 par video)

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Ids des vidéos les plus récentes de la chaîne, via la playlist "uploads". */
export async function listRecentVideoIds(
  accessToken: string,
  uploadsPlaylistId: string,
  max = MAX_VIDEOS
): Promise<string[]> {
  const ids: string[] = [];
  let pageToken = "";

  while (ids.length < max) {
    const url =
      `${DATA}/playlistItems?part=contentDetails&maxResults=50` +
      `&playlistId=${encodeURIComponent(uploadsPlaylistId)}` +
      (pageToken ? `&pageToken=${pageToken}` : "");
    const r = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    if (!r.ok) break;
    const j = (await r.json()) as {
      items?: { contentDetails?: { videoId?: string } }[];
      nextPageToken?: string;
    };
    for (const it of j.items ?? []) {
      const id = it.contentDetails?.videoId;
      if (id) ids.push(id);
    }
    if (!j.nextPageToken) break;
    pageToken = j.nextPageToken;
  }
  return ids.slice(0, max);
}

type DailyRow = { day: string; videoId: string; views: number; likes: number; comments: number };

/**
 * Rapport journalier d'UNE vidéo. Les valeurs sont des totaux DU JOUR, pas cumulés.
 *
 * ⚠️ L'API n'accepte pas `dimensions=day,video` avec un filtre multi-vidéos : elle
 * répond 500 « An internal error has occurred » (vérifié le 2026-09-16). Le seul
 * couple fiable pour une série temporelle par vidéo est `dimensions=day` +
 * `filters=video==<un seul id>`. On interroge donc vidéo par vidéo.
 *
 * Ces 500 arrivent aussi de façon intermittente sur des requêtes valides, d'où
 * une seconde tentative.
 */
async function fetchDailyRowsForVideo(
  accessToken: string,
  videoId: string,
  startDate: string,
  endDate: string
): Promise<DailyRow[]> {
  const params = new URLSearchParams({
    ids: "channel==MINE",
    startDate,
    endDate,
    metrics: "views,likes,comments",
    dimensions: "day",
    filters: `video==${videoId}`,
    sort: "day",
    maxResults: "400",
  });

  for (let attempt = 0; attempt < 2; attempt++) {
    const r = await fetch(`${ANALYTICS}?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    if (r.ok) {
      const j = (await r.json()) as { rows?: (string | number)[][] };
      // Les jours sans activité ne renvoient aucune ligne : c'est normal.
      return (j.rows ?? []).map((row) => ({
        day: String(row[0]),
        videoId,
        views: Number(row[1]) || 0,
        likes: Number(row[2]) || 0,
        comments: Number(row[3]) || 0,
      }));
    }
    if (r.status !== 500) return []; // 403/404 : inutile de réessayer
  }
  return [];
}

/** Séries journalières de toutes les vidéos, par petits lots parallèles. */
async function fetchDailyRows(
  accessToken: string,
  videoIds: string[],
  startDate: string,
  endDate: string
): Promise<DailyRow[]> {
  const out: DailyRow[] = [];
  for (let i = 0; i < videoIds.length; i += ID_CHUNK) {
    const lot = videoIds.slice(i, i + ID_CHUNK);
    const res = await Promise.all(
      lot.map((id) => fetchDailyRowsForVideo(accessToken, id, startDate, endDate))
    );
    for (const rows of res) out.push(...rows);
  }
  return out;
}

/**
 * Récupère l'historique et l'écrit dans VideoMetric.
 *
 * ⚠️ Conversion importante : Analytics renvoie l'activité DU JOUR alors que
 * VideoMetric stocke l'état du compteur (cumulé). On cumule donc par vidéo, dans
 * l'ordre chronologique, sinon les courbes afficheraient des variations
 * quotidiennes là où le reste de l'app affiche des totaux.
 *
 * Les lignes existantes ne sont jamais écrasées (skipDuplicates) : un point déjà
 * collecté par le snapshot horaire fait foi, il est plus fiable qu'un cumul
 * reconstitué.
 */
export async function backfillYouTubeHistory(
  userId: string,
  uploadsPlaylistId: string
): Promise<{ videos: number; points: number } | null> {
  const accessToken = await getFreshGoogleAccessToken(userId);
  if (!accessToken) return null;

  const videoIds = await listRecentVideoIds(accessToken, uploadsPlaylistId);
  if (videoIds.length === 0) return { videos: 0, points: 0 };

  const end = new Date();
  const start = new Date(end.getTime() - MAX_DAYS * 86_400_000);
  const rows = await fetchDailyRows(accessToken, videoIds, ymd(start), ymd(end));
  if (rows.length === 0) return { videos: videoIds.length, points: 0 };

  // cumul par vidéo, dans l'ordre des jours
  rows.sort((a, b) => (a.videoId === b.videoId ? a.day.localeCompare(b.day) : a.videoId.localeCompare(b.videoId)));
  const running = new Map<string, { views: number; likes: number; comments: number }>();
  const data = rows.map((r) => {
    const acc = running.get(r.videoId) ?? { views: 0, likes: 0, comments: 0 };
    acc.views += r.views;
    acc.likes += r.likes;
    acc.comments += r.comments;
    running.set(r.videoId, acc);
    return {
      platform: "youtube",
      videoId: r.videoId,
      snapshotAt: new Date(`${r.day}T00:00:00.000Z`),
      views: BigInt(acc.views),
      likes: BigInt(acc.likes),
      comments: BigInt(acc.comments),
      shares: null,
    };
  });

  const res = await prisma.videoMetric.createMany({ data, skipDuplicates: true });
  return { videos: videoIds.length, points: res.count };
}
