// lib/catalog.server.ts
// Catalogue vidéo complet d'un utilisateur, par plateforme, en cache dans
// VideoCatalog.
//
// Pourquoi : /api/videos ne lit que les N dernières vidéos publiées. Trier ce lot
// par vues donnait « les plus vues parmi les 60 dernières », pas le vrai top du
// compte. On garde donc toute la liste (compteurs compris) en base, et les tris
// par métrique ne sont plus qu'un tri + slice sur ce cache.
//
// Coût d'une reconstruction, pour 1 000 vidéos :
// - YouTube : playlistItems + videos.list avec la clé API, ~40 unités de quota.
//   Pas l'API Analytics : un seul parcours donne vues, likes et commentaires à
//   jour, sans son retard de ~2 jours.
// - TikTok : video/list par pages de 20 (aucun tri côté API), ~50 appels.
//   Donne aussi les partages, d'où le tri « Partages » sur tout le compte.
// - Instagram : /me/media par pages de 50 (~20 appels) pour likes et
//   commentaires ; les vues exigent un appel /insights PAR média, cf.
//   buildInstagram.
import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { fetchYouTubeLatest } from "@/lib/fetchVideos";
import { fetchTikTokPaged } from "@/lib/tiktok/videos.server";
import { attachInstagramViews, listInstagramMedia } from "@/lib/meta/media.server";
import type { Platform, VideoItem } from "@/lib/types";

const MAX_VIDEOS = 1000; // borne le temps de reconstruction et la taille du JSON
// Sans nouvelle vidéo, les compteurs évoluent quand même : on reconstruit
// au-delà de cet âge pour que les classements ne se figent pas.
const MAX_AGE_MS = 6 * 3_600_000;
// Miniatures TikTok / Instagram : URL signées qui expirent. Un cache qui sert
// des miniatures mortes est reconstruit ; le cron s'y prend plus tôt pour que
// l'utilisateur n'attende presque jamais.
const READ_EXPIRY_MARGIN_MS = 3_600_000;
const CRON_EXPIRY_MARGIN_MS = 2 * 3_600_000;

// Instagram : vues à (re)demander par reconstruction. Les plus récentes bougent
// vite ; les autres se remplissent au fil des passages du cron, les vues déjà
// connues étant reprises de l'ancien cache.
const IG_RECENT_VIEWS = 25;
const IG_MISSING_VIEWS = 100;

/** Où et comment construire le catalogue d'une plateforme. */
export type CatalogSource =
  | { platform: "youtube"; sourceId: string /* channelId */; apiKey: string }
  | { platform: "tiktok"; sourceId: string /* open_id */; accessToken: string }
  | { platform: "instagram"; sourceId: string /* IG user id */; accessToken: string };

async function buildInstagram(accessToken: string, previous: VideoItem[]): Promise<VideoItem[]> {
  const items = await listInstagramMedia(accessToken, MAX_VIDEOS);
  const known = new Map(previous.map((v) => [v.id, v.viewCount]));
  for (const v of items) v.viewCount = known.get(v.id) ?? undefined;
  const missing = items
    .slice(IG_RECENT_VIEWS)
    .filter((v) => v.viewCount == null)
    .slice(0, IG_MISSING_VIEWS);
  await attachInstagramViews(accessToken, [...items.slice(0, IG_RECENT_VIEWS), ...missing]);
  return items;
}

async function build(src: CatalogSource, previous: VideoItem[]): Promise<VideoItem[]> {
  switch (src.platform) {
    case "youtube":
      return fetchYouTubeLatest(src.apiKey, src.sourceId, MAX_VIDEOS);
    case "tiktok":
      return fetchTikTokPaged(src.accessToken, MAX_VIDEOS);
    case "instagram":
      return buildInstagram(src.accessToken, previous);
  }
}

/** Expiration d'une URL signée : `x-expires` (TikTok, secondes) ou `oe` (CDN Meta, hexa). */
function urlExpiry(u: string): number | null {
  try {
    const p = new URL(u).searchParams;
    const x = p.get("x-expires");
    if (x && /^\d+$/.test(x)) return Number(x) * 1000;
    const oe = p.get("oe");
    if (oe && /^[0-9a-f]+$/i.test(oe)) return parseInt(oe, 16) * 1000;
  } catch {
    /* URL vide ou invalide */
  }
  return null;
}

function thumbnailsExpire(items: VideoItem[], marginMs: number): boolean {
  const limit = Date.now() + marginMs;
  return items.some((v) => {
    const exp = urlExpiry(v.thumbnail);
    return exp !== null && exp < limit;
  });
}

function asItems(json: Prisma.JsonValue | undefined): VideoItem[] {
  return Array.isArray(json) ? (json as unknown as VideoItem[]) : [];
}

async function rebuild(userId: string, src: CatalogSource, previous: VideoItem[]): Promise<VideoItem[]> {
  // Les trois API listent de la plus récente à la plus ancienne : items[0]
  // est la dernière vidéo publiée.
  const items = await build(src, previous);
  const data = {
    sourceId: src.sourceId,
    latestVideoId: items[0]?.id ?? null,
    items: items as unknown as Prisma.InputJsonValue,
    refreshedAt: new Date(),
  };
  await prisma.videoCatalog.upsert({
    where: { userId_platform: { userId, platform: src.platform } },
    update: data,
    create: { userId, platform: src.platform, ...data },
  });
  return items;
}

/**
 * Lecture pour /api/videos. Sert le cache tel quel ; ne le calcule à la volée
 * que s'il n'existe pas encore (compte lié depuis le dernier cron), s'il
 * appartient à un autre compte (re-liaison) ou si ses miniatures ont expiré.
 */
export async function getCatalog(userId: string, src: CatalogSource): Promise<VideoItem[]> {
  const row = await prisma.videoCatalog.findUnique({
    where: { userId_platform: { userId, platform: src.platform } },
    select: { sourceId: true, items: true },
  });
  const items = asItems(row?.items);
  if (row && row.sourceId === src.sourceId && !thumbnailsExpire(items, READ_EXPIRY_MARGIN_MS)) {
    return items;
  }
  return rebuild(userId, src, row?.sourceId === src.sourceId ? items : []);
}

/**
 * Appelée par le cron horaire, qui connaît déjà la vidéo la plus récente (il
 * vient de lister les dernières pour le snapshot). Reconstruit seulement si la
 * vidéo en tête a changé, si le compte a changé, si le cache a dépassé
 * MAX_AGE_MS ou si ses miniatures vont expirer. Renvoie true si reconstruit.
 */
export async function syncCatalog(
  userId: string,
  src: CatalogSource,
  latestVideoId: string | null
): Promise<boolean> {
  const row = await prisma.videoCatalog.findUnique({
    where: { userId_platform: { userId, platform: src.platform } },
  });
  const items = asItems(row?.items);
  const upToDate =
    row !== null &&
    row.sourceId === src.sourceId &&
    row.latestVideoId === latestVideoId &&
    Date.now() - row.refreshedAt.getTime() < MAX_AGE_MS &&
    !thumbnailsExpire(items, CRON_EXPIRY_MARGIN_MS);
  if (upToDate) return false;
  await rebuild(userId, src, row?.sourceId === src.sourceId ? items : []);
  return true;
}

/** Nombre de vidéos de chaque catalogue en cache, compté en SQL pour ne pas
 *  rapatrier le JSON complet (jusqu'à 1 000 vidéos par plateforme). */
export async function getCatalogTotals(userId: string): Promise<Partial<Record<Platform, number>>> {
  const rows = await prisma.$queryRaw<{ platform: string; n: number }[]>`
    SELECT platform, jsonb_array_length(items)::int AS n
    FROM "VideoCatalog"
    WHERE "userId" = ${userId}
  `;
  const totals: Partial<Record<Platform, number>> = {};
  for (const r of rows) totals[r.platform as Platform] = r.n;
  return totals;
}

/** Déconnexion / effacement : le catalogue est rattaché à l'utilisateur. */
export async function deleteCatalog(userId: string, platform?: Platform): Promise<void> {
  await prisma.videoCatalog.deleteMany({ where: { userId, ...(platform ? { platform } : {}) } });
}
