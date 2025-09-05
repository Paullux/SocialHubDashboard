// lib/metrics.ts
import { prisma } from "@/lib/prisma";

// Convertir bigint -> number en sécurité (si > 2^53, on tombe en string)
function toNum(v: bigint | null | undefined): number | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isSafeInteger(n) ? n : null;
}

export async function getHourlyMetrics(platform: "youtube" | "tiktok", videoId: string) {
  const rows = await prisma.videoMetric.findMany({
    where: { platform, videoId },
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

export async function getDailyMetrics(platform: "youtube" | "tiktok", videoId: string) {
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

  return rows.map((r) => ({
    day: new Date(r.day).toISOString(),
    views: toNum(r.views),
    likes: toNum(r.likes),
    comments: toNum(r.comments),
    shares: toNum(r.shares),
  }));
}
