// lib/catalog.server.ts
// Catalogue vidéo complet d'un utilisateur, par plateforme, en cache dans
// VideoCatalog.
//
// Pourquoi : /api/videos ne lit que les N dernières vidéos publiées. Trier ce lot
// par vues donnait « les plus vues parmi les 60 dernières », pas le vrai top du
// compte. On garde donc toute la liste (compteurs compris) en base, et les tris
// par métrique ne sont plus qu'un tri + slice sur ce cache.
//
// Coût d'une reconstruction :
// - YouTube (≤ 1 000) : playlistItems + videos.list avec la clé API, ~40 unités
//   de quota. Pas l'API Analytics : un seul parcours donne vues, likes et
//   commentaires à jour, sans son retard de ~2 jours.
// - TikTok (≤ 3 000) : video/list par pages de 20 (aucun tri côté API), jusqu'à
//   ~150 appels — trop pour un seul passage du cron, d'où la construction par
//   étapes (advanceTikTok). Donne aussi les partages.
// - Instagram (≤ 1 000) : /me/media par pages de 50 (~20 appels) pour likes et
//   commentaires ; les vues exigent un appel /insights PAR média, cf.
//   buildInstagram.
import "server-only";
import { Prisma, type VideoCatalog } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { fetchYouTubeLatest } from "@/lib/fetchVideos";
import { fetchTikTokPage } from "@/lib/tiktok/videos.server";
import { attachInstagramViews, listInstagramMedia } from "@/lib/meta/media.server";
import type { Platform, VideoItem } from "@/lib/types";

// Borne le temps de reconstruction et la taille du JSON.
const MAX_VIDEOS: Record<Platform, number> = { youtube: 1000, tiktok: 3000, instagram: 1000 };
// Sans nouvelle vidéo, les compteurs évoluent quand même : on reconstruit
// au-delà de cet âge pour que les classements ne se figent pas.
const MAX_AGE_MS = 6 * 3_600_000;
// Miniatures TikTok / Instagram : URL signées qui expirent (~24 h côté TikTok,
// ~4 j côté Meta, mesuré le 2026-09-27). Un cache qui sert des miniatures
// mortes est reconstruit ; le cron s'y prend plus tôt pour que l'utilisateur
// n'attende presque jamais.
const READ_EXPIRY_MARGIN_MS = 3_600_000;
const CRON_EXPIRY_MARGIN_MS = 2 * 3_600_000;
// Construction TikTok lancée depuis une requête utilisateur (catalogue absent
// ou miniatures expirées) : on lit ce qu'on peut dans ce délai (~1 000 vidéos),
// le cron termine.
const READ_TIKTOK_STEP_MS = 15_000;

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
type TikTokSource = Extract<CatalogSource, { platform: "tiktok" }>;

async function buildInstagram(accessToken: string, previous: VideoItem[]): Promise<VideoItem[]> {
  const items = await listInstagramMedia(accessToken, MAX_VIDEOS.instagram);
  const known = new Map(previous.map((v) => [v.id, v.viewCount]));
  for (const v of items) v.viewCount = known.get(v.id) ?? undefined;
  const missing = items
    .slice(IG_RECENT_VIEWS)
    .filter((v) => v.viewCount == null)
    .slice(0, IG_MISSING_VIEWS);
  await attachInstagramViews(accessToken, [...items.slice(0, IG_RECENT_VIEWS), ...missing]);
  return items;
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

function asItems(json: Prisma.JsonValue | undefined | null): VideoItem[] {
  return Array.isArray(json) ? (json as unknown as VideoItem[]) : [];
}

const json = (items: VideoItem[]) => items as unknown as Prisma.InputJsonValue;

async function findRow(userId: string, platform: Platform): Promise<VideoCatalog | null> {
  return prisma.videoCatalog.findUnique({
    where: { userId_platform: { userId, platform } },
  });
}

async function saveRow(
  userId: string,
  platform: Platform,
  data: Omit<Prisma.VideoCatalogUncheckedCreateInput, "userId" | "platform">
): Promise<void> {
  await prisma.videoCatalog.upsert({
    where: { userId_platform: { userId, platform } },
    update: data,
    create: { userId, platform, ...data },
  });
}

/** YouTube et Instagram : reconstruction complète en un seul appel. */
async function rebuildAtOnce(
  userId: string,
  src: Exclude<CatalogSource, TikTokSource>,
  previous: VideoItem[]
): Promise<VideoItem[]> {
  // Les API listent de la plus récente à la plus ancienne : items[0] est la
  // dernière vidéo publiée.
  const items =
    src.platform === "youtube"
      ? await fetchYouTubeLatest(src.apiKey, src.sourceId, MAX_VIDEOS.youtube)
      : await buildInstagram(src.accessToken, previous);
  await saveRow(userId, src.platform, {
    sourceId: src.sourceId,
    latestVideoId: items[0]?.id ?? null,
    items: json(items),
    refreshedAt: new Date(),
    pendingItems: Prisma.DbNull,
    pendingCursor: null,
  });
  return items;
}

/**
 * TikTok, par étapes. Les pages lues s'accumulent dans pendingItems avec le
 * curseur de reprise ; le catalogue servi (items) reste l'ancien, complet,
 * jusqu'à ce que la nouvelle liste le soit à son tour, puis on bascule.
 *
 * Tant que la liste en cours est au moins aussi longue que celle servie, c'est
 * elle qu'on sert : c'est le cas d'une toute première construction (rien à
 * servir, ou seulement la partie lue par un passage précédent) — sans cette
 * règle, deux passages qui se chevauchent figeaient à l'écran la partie lue
 * par le premier (318 vidéos affichées pour 924 lues, constaté le 2026-09-27).
 * Pour une reconstruction d'un catalogue complet, la liste en cours reste plus
 * courte jusqu'à la fin : l'ancien catalogue reste affiché.
 *
 * Avance jusqu'à `deadline` (au moins une page) et renvoie le catalogue à
 * servir, ainsi que la liste en cours pour le cas des miniatures expirées.
 */
async function advanceTikTok(
  userId: string,
  src: TikTokSource,
  row: VideoCatalog | null,
  deadline: number,
  restart: boolean
): Promise<{ items: VideoItem[]; pending: VideoItem[] }> {
  const sameSource = row?.sourceId === src.sourceId;
  const served = sameSource ? asItems(row?.items) : [];
  const resume = sameSource && !restart && row?.pendingItems != null;
  const pending = resume ? asItems(row?.pendingItems) : [];
  let cursor = resume && row?.pendingCursor ? Number(row.pendingCursor) : null;

  const seen = new Set(pending.map((v) => v.id));
  let done = false;
  const showPending = () => pending.length >= served.length;
  const savePending = async () => {
    const partial = showPending();
    await saveRow(userId, "tiktok", {
      sourceId: src.sourceId,
      items: json(partial ? pending : served),
      latestVideoId: partial ? (pending[0]?.id ?? null) : (row?.latestVideoId ?? null),
      refreshedAt: partial || !row ? new Date() : row.refreshedAt,
      pendingItems: json(pending),
      pendingCursor: cursor != null ? String(cursor) : null,
    });
  };

  try {
    do {
      const page = await fetchTikTokPage(src.accessToken, cursor);
      for (const v of page.items) {
        if (!seen.has(v.id)) {
          seen.add(v.id);
          pending.push(v);
        }
      }
      cursor = page.cursor;
      if (!page.hasMore || pending.length >= MAX_VIDEOS.tiktok) done = true;
    } while (!done && Date.now() < deadline);
  } catch (e) {
    // Garder les pages déjà lues : le prochain passage reprendra d'ici.
    if (pending.length > 0) await savePending().catch(() => {});
    throw e;
  }

  if (!done) {
    await savePending();
    return { items: showPending() ? pending : served, pending };
  }

  const items = pending.slice(0, MAX_VIDEOS.tiktok);
  await saveRow(userId, "tiktok", {
    sourceId: src.sourceId,
    latestVideoId: items[0]?.id ?? null,
    items: json(items),
    refreshedAt: new Date(),
    pendingItems: Prisma.DbNull,
    pendingCursor: null,
  });
  return { items, pending: [] };
}

/**
 * Lecture pour /api/videos. Sert le cache tel quel ; ne le (re)calcule que
 * s'il n'existe pas encore (compte lié depuis le dernier cron), s'il appartient
 * à un autre compte (re-liaison) ou si ses miniatures ont expiré.
 */
export async function getCatalog(userId: string, src: CatalogSource): Promise<VideoItem[]> {
  const row = await findRow(userId, src.platform);
  const items = asItems(row?.items);
  const fresh = !thumbnailsExpire(items, READ_EXPIRY_MARGIN_MS);
  if (row && row.sourceId === src.sourceId && items.length > 0 && fresh) return items;

  if (src.platform !== "tiktok") {
    return rebuildAtOnce(userId, src, row?.sourceId === src.sourceId ? items : []);
  }
  // TikTok : impossible de tout relire pendant la requête. On avance la
  // construction ; si l'ancien catalogue a des miniatures mortes, les vidéos
  // déjà relues (miniatures neuves) passent devant le reste.
  const r = await advanceTikTok(userId, src, row, Date.now() + READ_TIKTOK_STEP_MS, false);
  if (!thumbnailsExpire(r.items, READ_EXPIRY_MARGIN_MS) || r.pending.length === 0) return r.items;
  const renewed = new Set(r.pending.map((v) => v.id));
  return [...r.pending, ...r.items.filter((v) => !renewed.has(v.id))];
}

/**
 * Appelée par le cron horaire, qui connaît déjà la vidéo la plus récente (il
 * vient de lister les dernières pour le snapshot). Reconstruit seulement si la
 * vidéo en tête a changé, si le compte a changé, si le cache a dépassé
 * MAX_AGE_MS ou si ses miniatures vont expirer ; pour TikTok, poursuit aussi
 * une construction en cours, jusqu'à `deadline`. Renvoie true s'il y a eu du
 * travail.
 */
export async function syncCatalog(
  userId: string,
  src: CatalogSource,
  latestVideoId: string | null,
  deadline: number
): Promise<boolean> {
  const row = await findRow(userId, src.platform);
  const upToDate =
    row !== null &&
    row.sourceId === src.sourceId &&
    row.latestVideoId === latestVideoId &&
    Date.now() - row.refreshedAt.getTime() < MAX_AGE_MS &&
    !thumbnailsExpire(asItems(row.items), CRON_EXPIRY_MARGIN_MS);

  if (src.platform === "tiktok") {
    const building = row?.pendingItems != null && row.sourceId === src.sourceId;
    if (upToDate && !building) return false;
    // Une construction en cours se poursuit ; sinon on en démarre une neuve.
    await advanceTikTok(userId, src, row, deadline, !building);
    return true;
  }

  if (upToDate) return false;
  await rebuildAtOnce(userId, src, row?.sourceId === src.sourceId ? asItems(row.items) : []);
  return true;
}

/** Nombre de vidéos de chaque catalogue en cache, compté en SQL pour ne pas
 *  rapatrier le JSON complet (jusqu'à 3 000 vidéos par plateforme). */
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

/**
 * Une vidéo du catalogue de l'utilisateur, cherchée en SQL (sans rapatrier les
 * milliers d'autres). `sourceId` restreint au compte actuellement lié : un
 * catalogue d'un ancien compte (re-liaison pas encore reconstruite) ne compte
 * pas. null si absente.
 */
export async function findCatalogVideo(
  userId: string,
  platform: Platform,
  videoId: string,
  sourceId?: string
): Promise<VideoItem | null> {
  const rows = await prisma.$queryRaw<{ item: VideoItem }[]>`
    SELECT e AS item
    FROM "VideoCatalog", jsonb_array_elements(items) e
    WHERE "userId" = ${userId}
      AND platform = ${platform}
      AND (${sourceId ?? null}::text IS NULL OR "sourceId" = ${sourceId ?? null})
      AND e->>'id' = ${videoId}
    LIMIT 1
  `;
  return rows[0]?.item ?? null;
}

/** Déconnexion / effacement : le catalogue est rattaché à l'utilisateur. */
export async function deleteCatalog(userId: string, platform?: Platform): Promise<void> {
  await prisma.videoCatalog.deleteMany({ where: { userId, ...(platform ? { platform } : {}) } });
}
