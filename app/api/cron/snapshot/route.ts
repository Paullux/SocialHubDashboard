// app/api/cron/snapshot/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60; // Vercel Hobby autorise jusqu'à 60s

import { prisma } from "@/lib/prisma";
import { fetchYouTubeLatest } from "@/lib/fetchVideos";
import { ensureFreshToken } from "@/lib/tiktok/auth.server";
import { getTikTokToken, saveTikTokToken } from "@/lib/tiktok/store";
import { dec, enc } from "@/lib/accountLinks";
import { fetchInstagramMedia } from "@/lib/meta/media.server";
import { refreshLongLivedToken } from "@/lib/meta/auth.server";
import type { VideoItem } from "@/lib/types";
import { jsonNoStore, timingSafeEqualStr } from "@/lib/security";

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

  // 1) YouTube — écrit immédiatement (indépendant du reste)
  try {
    const ytKey = process.env.YT_API_KEY || "";
    const ytChan = process.env.YT_CHANNEL_ID || "";
    if (ytKey && ytChan) {
      const yt = await fetchYouTubeLatest(ytKey, ytChan, 100);
      counts.youtube = await writeMetrics(yt, nowHour);
    }
  } catch (e: any) {
    errors.youtube = String(e?.message ?? e);
  }

  // 2) TikTok
  try {
    const access = await ensureFreshToken(getTikTokToken, saveTikTokToken);
    if (access) {
      const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
      // `/api/videos` exige une session Kinde ; le cron s'authentifie via ?key.
      const r = await fetch(
        `${base}/api/videos?yt=0&tt=100&key=${encodeURIComponent(process.env.CRON_SECRET ?? "")}`,
        { cache: "no-store" }
      );
      if (r.ok) {
        const data = await r.json();
        const tt = (data?.videos ?? []).filter((v: VideoItem) => v.platform === "tiktok");
        counts.tiktok = await writeMetrics(tt, nowHour);
      }
    }
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
