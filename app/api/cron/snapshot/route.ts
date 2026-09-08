// app/api/cron/snapshot/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchYouTubeLatest } from "@/lib/fetchVideos";
import { ensureFreshToken } from "@/lib/tiktok/auth.server";
import { getTikTokToken, saveTikTokToken } from "@/lib/tiktok/store";
import { dec, enc } from "@/lib/accountLinks";
import { fetchInstagramMedia, fetchFacebookVideos } from "@/lib/meta/media.server";
import { exchangeForLongLivedToken } from "@/lib/meta/auth.server";
import type { VideoItem } from "@/lib/types";
import { jsonNoStore, timingSafeEqualStr } from "@/lib/security";

function floorToHourUTC(d = new Date()): Date {
  const t = new Date(d);
  t.setUTCMinutes(0, 0, 0);
  return t;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const key = url.searchParams.get("key") || "";

  if (!process.env.CRON_SECRET || !(await timingSafeEqualStr(key, process.env.CRON_SECRET))) {
    return new Response("Unauthorized", { status: 401, headers: { "Cache-Control": "no-store" } });
  }

  try {
    const nowHour = floorToHourUTC(new Date());

    // 1) YouTube
    const ytKey = process.env.YT_API_KEY || "";
    const ytChan = process.env.YT_CHANNEL_ID || "";
    let yt: VideoItem[] = [];
    if (ytKey && ytChan) {
      yt = await fetchYouTubeLatest(ytKey, ytChan, 100);
    }

    // 2) TikTok
    let tiktok: VideoItem[] = [];
    try {
      const access = await ensureFreshToken(getTikTokToken, saveTikTokToken);
      if (access) {
        const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
        const r = await fetch(`${base}/api/videos?yt=0&tt=100`, { cache: "no-store" });
        if (r.ok) {
          const data = await r.json();
          tiktok = (data?.videos ?? []).filter((v: VideoItem) => v.platform === "tiktok");
        }
      }
    } catch { /* ignore */ }

    // 3) Meta : Instagram + vidéos Page, pour tous les comptes liés
    //    (le cron n'a pas de session Kinde) + refresh proactif du token long.
    let instagram: VideoItem[] = [];
    let facebook: VideoItem[] = [];
    try {
      const links = await prisma.accountLink.findMany({ where: { provider: "instagram" } });
      for (const link of links) {
        try {
          const token = dec(link.accessTokenEnc);
          const meta = (link.meta ?? {}) as Record<string, any>;
          const igId = String(meta.igUserId || link.externalUserId || "");
          const pageId = String(meta.pageId || "");
          if (token && igId) {
            instagram.push(...(await fetchInstagramMedia(token, igId, 100)));
          }
          if (token && pageId) {
            facebook.push(...(await fetchFacebookVideos(token, pageId, 100)));
          }

          // refresh si le token long expire dans < 10 jours
          const daysLeft = link.expiresAt
            ? (link.expiresAt.getTime() - Date.now()) / 86_400_000
            : 999;
          if (token && daysLeft < 10) {
            const fresh = await exchangeForLongLivedToken(token);
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
        } catch { /* saute ce compte */ }
      }
    } catch { /* ignore */ }

    const seen = new Set<string>();
    const all = [...yt, ...tiktok, ...instagram, ...facebook].filter((v) => {
      const k = `${v.platform}:${v.id}`;
      if (!v.id || seen.has(k)) return false;
      seen.add(k);
      return true;
    });

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

    return jsonNoStore({ ok: true, count: all.length, hour: nowHour.toISOString() });
  } catch (e: any) {
    return jsonNoStore({ ok: false, error: String(e?.message ?? e) }, { status: 500 });
  }
}

