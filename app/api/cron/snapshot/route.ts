// app/api/cron/snapshot/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchYouTubeLatest } from "@/lib/fetchVideos";
import { ensureFreshToken } from "@/lib/tiktok/auth.server";
import { getTikTokToken, saveTikTokToken } from "@/lib/tiktok/store";
import type { VideoItem } from "@/lib/types";

// Arrondir à l'heure UTC (ex: 14:37 -> 14:00)
function floorToHourUTC(d = new Date()): Date {
  const t = new Date(d);
  t.setUTCMinutes(0, 0, 0);
  return t;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const key = url.searchParams.get("key");
  if (!process.env.CRON_SECRET || key !== process.env.CRON_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }
  try {
    const nowHour = floorToHourUTC(new Date());

    // 1) YouTube
    const ytKey = process.env.YT_API_KEY || "";
    const ytChan = process.env.YT_CHANNEL_ID || "";
    let yt: VideoItem[] = [];
    if (ytKey && ytChan) {
      // prends un lot assez large pour suivre tes vidéos actives (ajuste à 100/200)
      yt = await fetchYouTubeLatest(ytKey, ytChan, 100);
    }

    // 2) TikTok
    let tiktok: VideoItem[] = [];
    try {
      const access = await ensureFreshToken(getTikTokToken, saveTikTokToken);
      if (access) {
        // on peut réutiliser ton /api/videos côté serveur, ou un fetch direct TikTok
        const r = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/api/videos?yt=0&tt=100`, { cache: "no-store" });
        if (r.ok) {
          const data = await r.json();
          tiktok = (data?.videos ?? []).filter((v: VideoItem) => v.platform === "tiktok");
        }
      }
    } catch {
      // pas de token TikTok valide : on ignore proprement
    }

    const all = [...yt, ...tiktok];

    // 3) Upsert par vidéo
    // - On n’écrase pas les anciens points, on en ajoute un par heure
    // - Le unique(platform, videoId, snapshotAt) évite les doublons
    const ops = all.map((v) =>
      prisma.videoMetric.upsert({
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
    );

    await Promise.all(ops);

    return NextResponse.json({ ok: true, count: all.length, hour: nowHour.toISOString() });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message ?? e) }, { status: 500 });
  }
}
