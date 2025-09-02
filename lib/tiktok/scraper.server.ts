// lib/tiktok/scraper.server.ts
import "server-only";
import type { VideoItem } from "@/lib/types";
import { normalizeUrl } from "@/lib/utils.server";

export async function fetchTikTokScraped(username: string, limit = 12): Promise<VideoItem[]> {
  if (!username) return [];
  const res = await fetch(`https://www.tiktok.com/@${username}`, {
    headers: {
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
      "accept-language": "fr-FR,fr;q=0.9,en;q=0.8",
      referer: "https://www.tiktok.com/",
    },
    cache: "no-store",
    redirect: "follow",
  });
  if (!res.ok) return [];
  const html = await res.text();
  const m = html.match(/<script id="SIGI_STATE"[^>]*>(.*?)<\/script>/s);
  if (!m) return [];

  const state = JSON.parse(m[1]);
  const ids: string[] = state?.ItemList?.video?.list ?? [];
  const mod = state?.ItemModule ?? {};

  return ids.slice(0, limit).map((id) => {
    const it = mod[id] || {};
    const thumb =
      normalizeUrl(it?.video?.originCover) ||
      normalizeUrl(it?.video?.dynamicCover) ||
      normalizeUrl(it?.video?.cover) || "";
    return {
      id,
      platform: "tiktok",
      title: it?.desc ?? "",
      url: `https://www.tiktok.com/@${state?.UserModule?.users?.[it?.author]?.uniqueId || ""}/video/${id}`,
      thumbnail: thumb,
      publishedAt: it?.createTime ? new Date(it.createTime * 1000).toISOString() : new Date().toISOString(),
      // KPIs publics souvent absents en anonyme
    } as VideoItem;
  });
}
