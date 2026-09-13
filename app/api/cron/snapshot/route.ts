// app/api/cron/snapshot/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60; // Vercel Hobby autorise jusqu'à 60s

import { prisma } from "@/lib/prisma";
import { fetchYouTubeLatest } from "@/lib/fetchVideos";
import { getFreshTikTokAccessToken } from "@/lib/tiktok/perUser";
import { dec, enc } from "@/lib/accountLinks";
import { fetchInstagramMedia } from "@/lib/meta/media.server";
import { refreshLongLivedToken } from "@/lib/meta/auth.server";
import type { VideoItem } from "@/lib/types";
import { jsonNoStore, timingSafeEqualStr } from "@/lib/security";

async function fetchTikTokIdsForMetrics(access: string): Promise<VideoItem[]> {
  const fields = [
    "id", "title", "video_description", "create_time",
    "like_count", "comment_count", "share_count", "view_count",
  ].join(",");
  const out: VideoItem[] = [];
  let cursor: number | undefined;
  while (out.length < 100) {
    const body: Record<string, unknown> = { max_count: 20 };
    if (cursor != null) body.cursor = cursor;
    const r = await fetch(
      `https://open.tiktokapis.com/v2/video/list/?fields=${encodeURIComponent(fields)}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${access}`,
          "Content-Type": "application/json",
          Accept: "application/json",
          "User-Agent": "social-hub/1.0",
        },
        body: JSON.stringify(body),
        cache: "no-store",
      }
    );
    if (!r.ok) break;
    const data = (await r.json()) as {
      data?: { videos?: any[]; has_more?: boolean; cursor?: number };
    };
    const list = data?.data?.videos ?? [];
    for (const v of list) {
      out.push({
        id: String(v.id),
        platform: "tiktok",
        title: v.title || v.video_description || "",
        url: "",
        thumbnail: "",
        publishedAt: v.create_time ? new Date(v.create_time * 1000).toISOString() : new Date().toISOString(),
        viewCount: typeof v.view_count === "number" ? v.view_count : undefined,
        likeCount: typeof v.like_count === "number" ? v.like_count : undefined,
        commentCount: typeof v.comment_count === "number" ? v.comment_count : undefined,
        shareCount: typeof v.share_count === "number" ? v.share_count : undefined,
      });
    }
    if (!data?.data?.has_more || data?.data?.cursor == null) break;
    cursor = data.data.cursor;
  }
  return out;
}

function floorToHourUTC(d = new Date()): Date {
  const t = new Date(d);
  t.setUTCMinutes(0, 0, 0);
  return t;
}

// Durée de conservation de l'historique de métriques (annoncée dans /privacy).
const METRICS_RETENTION_MONTHS = 25;

function retentionCutoff(now = new Date()): Date {
  const t = new Date(now);
  t.setUTCMonth(t.getUTCMonth() - METRICS_RETENTION_MONTHS);
  return t;
}

/** Écrit un lot de métriques pour l'heure donnée. Best-effort, ne throw pas. */
async function writeMetrics(items: VideoItem[], nowHour: Date): Promise<number> {
  const seen = new Set<string>();
  const uniq = items.filter((v) => {
    const k = `${v.platform}:${v.id}`;
    if (!v.id || seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  await Promise.all(
    uniq.map((v) =>
      prisma.videoMetric
        .upsert({
          where: {
            platform_videoId_snapshotAt: {
              platform: v.platform,
              videoId: v.id,
              snapshotAt: nowHour,
            },
          },
          update: {
            views: BigInt(v.viewCount ?? 0),
            likes: BigInt(v.likeCount ?? 0),
            comments: BigInt(v.commentCount ?? 0),
            shares: v.platform === "tiktok" ? BigInt(v.shareCount ?? 0) : null,
          },
          create: {
            platform: v.platform,
            videoId: v.id,
            snapshotAt: nowHour,
            views: BigInt(v.viewCount ?? 0),
            likes: BigInt(v.likeCount ?? 0),
            comments: BigInt(v.commentCount ?? 0),
            shares: v.platform === "tiktok" ? BigInt(v.shareCount ?? 0) : null,
          },
        })
        .catch(() => null)
    )
  );
  return uniq.length;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const key = url.searchParams.get("key") || "";

  if (!process.env.CRON_SECRET || !(await timingSafeEqualStr(key, process.env.CRON_SECRET))) {
    return new Response("Unauthorized", { status: 401, headers: { "Cache-Control": "no-store" } });
  }

  const nowHour = floorToHourUTC(new Date());
  const counts: Record<string, number> = {};
  const errors: Record<string, string> = {};

  // 1) YouTube — un snapshot par compte lié (chacun sa propre chaîne).
  try {
    const ytKey = process.env.YT_API_KEY || "";
    const links = ytKey
      ? await prisma.accountLink.findMany({ where: { provider: "google-youtube" } })
      : [];
    let total = 0;
    for (const link of links) {
      try {
        const channelId = (link.meta as { channelId?: string } | null)?.channelId;
        if (!channelId) continue;
        const yt = await fetchYouTubeLatest(ytKey, channelId, 100);
        total += await writeMetrics(yt, nowHour);
      } catch (e: any) {
        errors[`youtube:${link.id}`] = String(e?.message ?? e);
      }
    }
    counts.youtube = total;
  } catch (e: any) {
    errors.youtube = String(e?.message ?? e);
  }

  // 2) TikTok — un snapshot par compte lié (jeton propre à chacun).
  try {
    const links = await prisma.accountLink.findMany({ where: { provider: "tiktok" } });
    let total = 0;
    for (const link of links) {
      try {
        const access = await getFreshTikTokAccessToken(link.userId);
        if (!access) continue;
        const tt = await fetchTikTokIdsForMetrics(access);
        total += await writeMetrics(tt, nowHour);
      } catch (e: any) {
        errors[`tiktok:${link.id}`] = String(e?.message ?? e);
      }
    }
    counts.tiktok = total;
  } catch (e: any) {
    errors.tiktok = String(e?.message ?? e);
  }

  // 3) Instagram, par compte lié + refresh proactif du token long
  try {
    const links = await prisma.accountLink.findMany({ where: { provider: "instagram" } });
    for (const link of links) {
      try {
        const token = dec(link.accessTokenEnc);
        const batch: VideoItem[] = token ? await fetchInstagramMedia(token, 50) : [];
        counts[`meta:${link.id}`] = await writeMetrics(batch, nowHour);

        const daysLeft = link.expiresAt
          ? (link.expiresAt.getTime() - Date.now()) / 86_400_000
          : 999;
        // ig_refresh_token exige un token âgé d'au moins 24h : sans risque ici,
        // vu qu'on ne rafraîchit qu'à moins de 10 jours de l'expiration (~60j).
        if (token && daysLeft < 10) {
          const fresh = await refreshLongLivedToken(token);
          if (fresh?.access_token) {
            await prisma.accountLink.update({
              where: { id: link.id },
              data: {
                accessTokenEnc: enc(fresh.access_token),
                expiresAt: fresh.expires_in
                  ? new Date(Date.now() + fresh.expires_in * 1000)
                  : link.expiresAt,
              },
            });
          }
        }
      } catch (e: any) {
        errors[`meta:${link.id}`] = String(e?.message ?? e);
      }
    }
  } catch (e: any) {
    errors.meta = String(e?.message ?? e);
  }

  // 4) Purge de l'historique au-delà de la durée de conservation (25 mois).
  let purged = 0;
  try {
    const cutoff = retentionCutoff();
    const res = await prisma.videoMetric.deleteMany({
      where: { snapshotAt: { lt: cutoff } },
    });
    purged = res.count;
  } catch (e: any) {
    errors.purge = String(e?.message ?? e);
  }

  const ok = Object.keys(errors).length === 0;
  return jsonNoStore(
    { ok, hour: nowHour.toISOString(), counts, purged, errors },
    { status: ok ? 200 : 207 }
  );
}
