// app/api/videos/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import type { VideoItem } from "@/lib/types";
import { fetchYouTubeLatest } from "@/lib/fetchVideos";
import { getTikTokToken, saveTikTokToken } from "@/lib/tiktok/store";
import { ensureFreshToken } from "@/lib/tiktok/auth.server";
import { ipFromHeaders, isRateLimitedKey } from "@/lib/security";

/* ================== Types ================== */
type Notes = Record<string, unknown>;

interface TikTokVideo {
  id: string;
  title?: string;
  video_description?: string;
  duration?: number;
  cover_image_url?: string;
  share_url?: string;
  embed_link?: string;
  create_time?: number;
  like_count?: number;
  comment_count?: number;
  share_count?: number;
  view_count?: number;
}

interface TikTokResponse {
  data?: {
    has_more?: boolean;
    cursor?: number;
    videos?: TikTokVideo[];
  };
}

/* ================== Helper TikTok paginé ================== */
async function fetchTikTokPaged(
  access: string,
  target: number,
  debug: boolean,
  notes: Notes
): Promise<VideoItem[]> {
  const items: VideoItem[] = [];
  let cursor: number | undefined;
  const fields = [
    "id","title","video_description","duration","cover_image_url","share_url","embed_link",
    "create_time","like_count","comment_count","share_count","view_count",
  ].join(",");

  const dbg = {
    pages: 0,
    cursors: [] as Array<number | null>,
    last_status: 0,
    total_received: 0,
  };

  while (items.length < target) {
    const body: Record<string, unknown> = {
      max_count: Math.min(20, Math.max(0, target - items.length)),
    };
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

    dbg.pages += 1;
    dbg.last_status = r.status;

    if (!r.ok) {
      if (debug) {
        try { (notes as any).tiktok_error_body = await r.json(); } catch {}
      }
      break;
    }

    const data: TikTokResponse = await r.json();
    const list: TikTokVideo[] = data?.data?.videos ?? [];
    dbg.total_received += list.length;

    for (const v of list) {
      items.push({
        id: String(v.id),
        platform: "tiktok",
        title: v.title || v.video_description || "",
        url: v.share_url || "",
        thumbnail: v.cover_image_url || "",
        publishedAt: v.create_time ? new Date(v.create_time * 1000).toISOString() : new Date().toISOString(),
        viewCount: typeof v.view_count === "number" ? v.view_count : undefined,
        likeCount: typeof v.like_count === "number" ? v.like_count : undefined,
        commentCount: typeof v.comment_count === "number" ? v.comment_count : undefined,
        shareCount: typeof v.share_count === "number" ? v.share_count : undefined,
        embedLink: v.embed_link,
      });
      if (items.length >= target) break;
    }

    const hasMore: boolean = Boolean(data?.data?.has_more);
    cursor = data?.data?.cursor;
    dbg.cursors.push(cursor ?? null);
    if (!hasMore || cursor == null) break;
  }

  if (debug) (notes as any).tiktok_debug = dbg;
  return items;
}

/* ================== Route ================== */
export async function GET(req: Request) {
  const ip = ipFromHeaders(req);
  if (isRateLimitedKey(`videos:${ip}`)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Cache-Control": "no-store" } });
  }

  const url = new URL(req.url);
  const debug = url.searchParams.get("debug") === "1";
  const notes: Notes = {};

  try {
    const limitParam = url.searchParams.get("limit");
    const ytParam = url.searchParams.get("yt");
    const ttParam = url.searchParams.get("tt");
    const TOTAL_LIMIT = Math.min(Math.max(Number(limitParam ?? 60), 1), 200); // borne à 200

    // YouTube
    const ytKey = process.env.YT_API_KEY || "";
    const ytChan = process.env.YT_CHANNEL_ID || "";

    // TikTok OAuth
    let tiktokAccess: string | null = null;
    try {
      tiktokAccess = await ensureFreshToken(getTikTokToken, saveTikTokToken);
    } catch (e: unknown) {
      (notes as any).tiktok_token_error = String(e);
    }

    let ytTarget: number;
    let ttTarget: number;
    if (ytParam !== null || ttParam !== null) {
      ytTarget = Math.max(Number(ytParam ?? 0) || 0, 0);
      ttTarget = Math.max(Number(ttParam ?? 0) || 0, 0);
      if (ytTarget + ttTarget > TOTAL_LIMIT) {
        const scale = TOTAL_LIMIT / Math.max(1, ytTarget + ttTarget);
        ytTarget = Math.floor(ytTarget * scale);
        ttTarget = TOTAL_LIMIT - ytTarget;
      }
    } else {
      if (tiktokAccess) {
        ytTarget = Math.ceil(TOTAL_LIMIT / 2);
        ttTarget = TOTAL_LIMIT - ytTarget;
      } else {
        ytTarget = TOTAL_LIMIT;
        ttTarget = 0;
      }
    }

    // Collecte YouTube
    let yt: VideoItem[] = [];
    if (ytKey && ytChan && ytTarget > 0) {
      try {
        yt = await fetchYouTubeLatest(ytKey, ytChan, ytTarget);
      } catch (e: unknown) {
        (notes as any).youtube_error = String(e);
      }
    } else if (!ytKey || !ytChan) {
      (notes as any).youtube = "missing key/channel";
    }

    // Collecte TikTok
    let tt: VideoItem[] = [];
    if (tiktokAccess && ttTarget > 0) {
      try {
        tt = await fetchTikTokPaged(tiktokAccess, ttTarget, debug, notes);
      } catch (e: unknown) {
        (notes as any).tiktok_error = String(e);
      }
    }

    if (debug) {
      (notes as any).yt_count = yt.length;
      (notes as any).tt_count = tt.length;
    }

    const seen = new Set<string>();
    const videos = [...yt, ...tt]
      .filter((v) => {
        const key = `${v.platform}:${v.id}`;
        if (!v.id || seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt));

    const res = NextResponse.json(debug ? { videos, count: videos.length, notes } : { videos });
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (e: unknown) {
    return NextResponse.json(
      debug ? { videos: [], error: String(e), notes } : { error: "Failed to fetch videos" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
