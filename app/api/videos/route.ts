// app/api/videos/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import type { VideoItem } from "@/lib/types";
import { fetchYouTubeLatest } from "@/lib/fetchVideos";
import { fetchTikTokDisplayByUrl } from "@/lib/tiktok/display.server";
import { fetchTikTokScraped } from "@/lib/tiktok/scraper.server"; // si tu veux un fallback

const ENABLE_TIKTOK_SCRAPER = process.env.ENABLE_TIKTOK_SCRAPER === "1";
const TIKTOK_USERNAME = process.env.TIKTOK_USERNAME || ""; // pour le fallback scraper
const TIKTOK_VIDEO_URLS = (process.env.TIKTOK_VIDEO_URLS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
// ↑ Option simple : tu listes 1..N URLs de tes vidéos pour Display API.
//   Sinon, tu peux d’abord obtenir la liste via Login Kit (user.video.list), puis appeler Display API par item.

export async function GET(req: Request) {
  const url = new URL(req.url);
  const debug = url.searchParams.get("debug") === "1";
  const notes: any = {};

  try {
    // YouTube
    const ytKey = process.env.YT_API_KEY || "";
    const ytChan = process.env.YT_CHANNEL_ID || "";
    const yt = ytKey && ytChan ? await fetchYouTubeLatest(ytKey, ytChan, 12) : [];
    if (!ytKey || !ytChan) notes.youtube = "missing key/channel";

    // TikTok OFFICIEL (Display API) — à partir d'une liste d'URLs (ex: les plus récentes)
    const ttOfficial: VideoItem[] = [];
    for (const videoUrl of TIKTOK_VIDEO_URLS) {
      const item = await fetchTikTokDisplayByUrl(videoUrl).catch(() => null);
      if (item) ttOfficial.push(item);
    }
    if (!ttOfficial.length) notes.tiktok_display = "empty or failed";

    // TikTok FALLBACK (scraper) si besoin
    let tt: VideoItem[] = ttOfficial;
    if (!ttOfficial.length && ENABLE_TIKTOK_SCRAPER && TIKTOK_USERNAME) {
      try {
        tt = await fetchTikTokScraped(TIKTOK_USERNAME, 12);
      } catch (e) {
        notes.tiktok_scraper_error = String(e);
      }
    }

    // Fusion + dédup + tri
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
