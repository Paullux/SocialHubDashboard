// app/api/videos/route.ts
// TODO: gérer le cas où YouTube API renvoie une erreur de quota (429)
// TODO: améliorer le scraping TikTok (fallback si SIGI_STATE absent)
// TODO: ajouter un cache Redis pour éviter les appels trop fréquents
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { fetchYouTubeLatest, type VideoItem } from "@/lib/fetchVideos";

const ENABLE_TIKTOK = (process.env.ENABLE_TIKTOK ?? "").toString() === "1";

/** Fetch TikTok (optionnel) — ne tourne qu’en runtime Node */
async function fetchTikTokLatest(username?: string, limit = 12): Promise<VideoItem[]> {
  if (!ENABLE_TIKTOK || !username) return [];

  const profileUrl = `https://www.tiktok.com/@${username}`;
  try {
    const res = await fetch(profileUrl, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "accept-language": "fr-FR,fr;q=0.9,en;q=0.8",
        referer: "https://www.tiktok.com/",
      },
      cache: "no-store",
      redirect: "follow",
    });

    if (!res.ok) {
      console.warn("[TT] fetch profile failed:", res.status, res.statusText);
      return [];
    }

    const html = await res.text();
    // JSON embarqué côté client
    const m = html.match(/<script id="SIGI_STATE"[^>]*>(.*?)<\/script>/s);
    if (!m) {
      console.warn("[TT] SIGI_STATE not found");
      return [];
    }
    const state = JSON.parse(m[1]);

    const ids: string[] = state?.ItemList?.video?.list ?? [];
    const itemsObj = state?.ItemModule ?? {};
    const items: VideoItem[] = [];

    for (const id of ids.slice(0, limit)) {
      const it = itemsObj[id];
      if (!it) continue;

      const created = it.createTime
        ? new Date(Number(it.createTime) * 1000).toISOString()
        : new Date().toISOString();

      const thumb =
        it?.video?.originCover ||
        it?.video?.dynamicCover ||
        it?.video?.cover ||
        "";

      items.push({
        id,
        platform: "tiktok",
        title: it?.desc || "Sans titre",
        thumbnail: thumb,
        url: `https://www.tiktok.com/@${username}/video/${id}`,
        publishedAt: created,
      });
    }

    return items;
  } catch (e) {
    console.warn("[TT] scrape error:", e);
    return [];
  }
}

export async function GET() {
  const yt = await fetchYouTubeLatest(
    process.env.YT_API_KEY,
    process.env.YT_CHANNEL_ID,
    12
  );
  const tt = await fetchTikTokLatest(process.env.TIKTOK_USERNAME, 12);

  // Fusion + dédup + tri par date DESC
  const seen = new Set<string>();
  const videos = [...yt, ...tt]
    .filter((v) => {
      const key = `${v.platform}:${v.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

  return NextResponse.json({ videos });
}
