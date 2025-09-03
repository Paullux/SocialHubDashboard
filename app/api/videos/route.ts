export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import type { VideoItem } from "@/lib/types";
import { fetchYouTubeLatest } from "@/lib/fetchVideos";
import { getTikTokToken, saveTikTokToken } from "@/lib/tiktok/store";
import { ensureFreshToken } from "@/lib/tiktok/auth.server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const debug = url.searchParams.get("debug") === "1";
  const notes: Record<string, any> = {};

  try {
    // --- YouTube ---
    const ytKey = process.env.YT_API_KEY || "";
    const ytChan = process.env.YT_CHANNEL_ID || "";
    const yt = ytKey && ytChan ? await fetchYouTubeLatest(ytKey, ytChan, 12) : [];
    if (!ytKey || !ytChan) notes.youtube = "missing key/channel";

    // --- TikTok via OAuth (video.list) ---
    let tt: VideoItem[] = [];
    try {
      const access = await ensureFreshToken(getTikTokToken, saveTikTokToken);
      const r = await fetch("https://open.tiktokapis.com/v2/video/list/?count=12", {
        headers: { Authorization: `Bearer ${access}` },
        cache: "no-store",
      });

      if (!r.ok) {
        notes.tiktok_status = r.status;
      } else {
        const data = await r.json();
        notes.tiktok_raw = debug ? data : undefined;

        const items = data?.data?.videos ?? [];
        tt = items.map((v: any) => ({
          id: String(v.id),
          platform: "tiktok",
          title: v.title || v.video_description || "",
          url: v.share_url,
          thumbnail: v.cover_image_url,
          publishedAt: v.create_time
            ? new Date(v.create_time * 1000).toISOString()
            : new Date().toISOString(),
          viewCount: v.view_count,
          likeCount: v.like_count,
          commentCount: v.comment_count,
          shareCount: v.share_count,
          embedLink: v.embed_link,
          embedHtml: v.embed_html,
        }));
      }
    } catch (e: any) {
      notes.tiktok_error = String(e);
    }

    // --- Fusion + dédup + tri ---
    const seen = new Set<string>();
    const videos = [...yt, ...tt]
      .filter((v) => {
        const key = `${v.platform}:${v.id}`;
        if (!v.id || seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt));

    return NextResponse.json(debug ? { videos, count: videos.length, notes } : { videos });
  } catch (e: any) {
    return NextResponse.json(
      debug ? { videos: [], error: String(e), notes } : { error: "Failed to fetch videos" },
      { status: 500 }
    );
  }
}
