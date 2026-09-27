// lib/metrics.ts
import { prisma } from "@/lib/prisma";

// Convertir bigint -> number en sécurité (si > 2^53, on tombe en string)
function toNum(v: bigint | null | undefined): number | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isSafeInteger(n) ? n : null;
}

// Détail horaire conservé et affiché : au-delà, le cron ne garde qu'un point
// par jour (cf. downsampleHourlyMetrics) — la courbe « par jour » suffit.
export const HOURLY_WINDOW_DAYS = 7;

export async function getHourlyMetrics(platform: "youtube" | "tiktok" | "instagram", videoId: string) {
  const since = new Date(Date.now() - HOURLY_WINDOW_DAYS * 86_400_000);
  const rows = await prisma.videoMetric.findMany({
    where: { platform, videoId, snapshotAt: { gte: since } },
    orderBy: { snapshotAt: "asc" },
    select: { snapshotAt: true, views: true, likes: true, comments: true, shares: true },
  });

  return rows.map((r) => ({
    at: r.snapshotAt.toISOString(),
    views: toNum(r.views),
    likes: toNum(r.likes),
    comments: toNum(r.comments),
    shares: toNum(r.shares ?? null),
  }));
}

export async function getDailyMetrics(platform: "youtube" | "tiktok" | "instagram", videoId: string) {
  // Agrégation par jour via SQL (date_trunc)
  const rows = await prisma.$queryRaw<
    { day: Date; views: bigint; likes: bigint; comments: bigint; shares: bigint | null }[]
  >`
    SELECT
      date_trunc('day', "snapshotAt") AS day,
      max(views)    AS views,
      max(likes)    AS likes,
      max(comments) AS comments,
      max(shares)   AS shares
    FROM "VideoMetric"
    WHERE platform = ${platform} AND "videoId" = ${videoId}
    GROUP BY day
    ORDER BY day ASC;
  `;

  // Un point n'est écrit que les jours où un compteur a changé
  // (recordCatalogDailyPoints) : un jour absent veut dire « inchangé ». On
  // recopie donc la dernière valeur jusqu'à aujourd'hui, sinon le graphique
  // tracerait une pente entre deux points espacés au lieu d'un palier.
  const out: {
    day: string;
    views: number | null;
    likes: number | null;
    comments: number | null;
    shares: number | null;
  }[] = [];
  const today = Date.UTC(
    new Date().getUTCFullYear(),
    new Date().getUTCMonth(),
    new Date().getUTCDate()
  );
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const point = {
      views: toNum(r.views),
      likes: toNum(r.likes),
      comments: toNum(r.comments),
      shares: toNum(r.shares),
    };
    const start = new Date(r.day).getTime();
    const end = i + 1 < rows.length ? new Date(rows[i + 1].day).getTime() : today + 86_400_000;
    for (let t = start; t < end; t += 86_400_000) {
      out.push({ day: new Date(t).toISOString(), ...point });
    }
  }
  return out;
}

/**
 * Point quotidien pour toutes les vidéos des catalogues (VideoCatalog), à
 * partir des compteurs qu'ils contiennent déjà : aucun appel API.
 *
 * Le relevé horaire ne suit que les dernières vidéos de chaque compte ; les
 * autres n'avaient aucun historique, d'où des graphiques vides dès qu'un tri
 * les faisait remonter. Pour ne pas faire exploser la base, on n'écrit que :
 * - le tout premier point d'une vidéo ;
 * - un point quand un compteur a changé depuis le dernier (≈ 5 à 30 % des
 *   jours selon l'âge de la vidéo, mesuré le 2026-09-27) ;
 * et au plus un par jour (horodaté à minuit UTC, mis à jour dans la journée).
 * Les vidéos déjà relevées dans les 2 dernières heures sont ignorées (suivies
 * à l'heure), comme les catalogues plus anciens que le dernier point (un
 * compteur périmé ferait redescendre la courbe). getDailyMetrics recopie la
 * dernière valeur sur les jours sans point.
 *
 * Une seule requête pour tous les catalogues ; une vidéo présente dans deux
 * catalogues (même chaîne liée par deux utilisateurs) est prise dans le plus
 * récent. Renvoie le nombre de points écrits.
 */
export async function recordCatalogDailyPoints(): Promise<number> {
  return prisma.$executeRaw`
    WITH now_utc AS (SELECT (now() AT TIME ZONE 'UTC') AS t),
    src AS (
      SELECT DISTINCT ON (c.platform, e->>'id')
             c.platform, e->>'id' AS id, c."refreshedAt", e AS item
      FROM "VideoCatalog" c, jsonb_array_elements(c.items) e
      WHERE e->>'id' IS NOT NULL
      ORDER BY c.platform, e->>'id', c."refreshedAt" DESC
    )
    INSERT INTO "VideoMetric" (platform, "videoId", "snapshotAt", views, likes, comments, shares)
    SELECT src.platform,
           src.id,
           date_trunc('day', now_utc.t),
           COALESCE((src.item->>'viewCount')::bigint, 0),
           COALESCE((src.item->>'likeCount')::bigint, 0),
           COALESCE((src.item->>'commentCount')::bigint, 0),
           CASE WHEN src.platform = 'tiktok'
                THEN COALESCE((src.item->>'shareCount')::bigint, 0) END
    FROM src
    CROSS JOIN now_utc
    LEFT JOIN LATERAL (
      SELECT m.views, m.likes, m.comments, m.shares, m."snapshotAt"
      FROM "VideoMetric" m
      WHERE m.platform = src.platform AND m."videoId" = src.id
      ORDER BY m."snapshotAt" DESC
      LIMIT 1
    ) last ON true
    WHERE last."snapshotAt" IS NULL
       OR (
         last."snapshotAt" < now_utc.t - interval '2 hours'
         AND src."refreshedAt" > last."snapshotAt"
         AND (
           COALESCE((src.item->>'viewCount')::bigint, 0),
           COALESCE((src.item->>'likeCount')::bigint, 0),
           COALESCE((src.item->>'commentCount')::bigint, 0),
           CASE WHEN src.platform = 'tiktok'
                THEN COALESCE((src.item->>'shareCount')::bigint, 0) END
         ) IS DISTINCT FROM (last.views, last.likes, last.comments, last.shares)
       )
    ON CONFLICT (platform, "videoId", "snapshotAt") DO UPDATE SET
      views = EXCLUDED.views,
      likes = EXCLUDED.likes,
      comments = EXCLUDED.comments,
      shares = EXCLUDED.shares
  `;
}

/**
 * Au-delà de HOURLY_WINDOW_DAYS, ne garde qu'un point par vidéo et par jour
 * (le dernier de la journée) : le détail horaire n'est plus affiché, et il
 * représentait l'essentiel du volume de la base (~24 lignes par vidéo et par
 * jour). Appelée à chaque passage du cron, elle ne traite que les `spanDays`
 * jours qui viennent de sortir de la fenêtre, pour rester légère ; le script
 * de rattrapage passe un intervalle plus large. Renvoie le nombre de lignes
 * supprimées.
 */
export async function downsampleHourlyMetrics(spanDays = 2): Promise<number> {
  return prisma.$executeRaw`
    WITH bounds AS (
      SELECT date_trunc('day', (now() AT TIME ZONE 'UTC')) - make_interval(days => ${HOURLY_WINDOW_DAYS}::int) AS hi
    ),
    b AS (SELECT hi - make_interval(days => ${spanDays}::int) AS lo, hi FROM bounds),
    keep AS (
      SELECT m.platform, m."videoId", date_trunc('day', m."snapshotAt") AS d,
             max(m."snapshotAt") AS kept
      FROM "VideoMetric" m, b
      WHERE m."snapshotAt" >= b.lo AND m."snapshotAt" < b.hi
      GROUP BY 1, 2, 3
    )
    DELETE FROM "VideoMetric" m
    USING keep, b
    WHERE m.platform = keep.platform
      AND m."videoId" = keep."videoId"
      AND m."snapshotAt" >= keep.d
      AND m."snapshotAt" < keep.d + interval '1 day'
      AND m."snapshotAt" <> keep.kept
      AND m."snapshotAt" >= b.lo
      AND m."snapshotAt" < b.hi
  `;
}
