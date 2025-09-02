// lib/tiktok/official.server.ts
import "server-only";
import type { VideoItem } from "@/lib/types";

export async function fetchTikTokOfficial(accessToken: string, limit = 12): Promise<VideoItem[]> {
  if (!accessToken) return [];
  // TODO: remplace par l'endpoint exact de ton kit (Login/Content Posting/Display…)
  const url = `https://open.tiktokapis.com/v2/user/video/list?max_count=${limit}`;
  const r = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!r.ok) return [];
  const data = await r.json();

  // TODO: adapte le mapping selon la réponse réelle
  const items: VideoItem[] = (data?.data?.videos ?? []).map((v: any) => ({
    id: String(v.id),
    platform: "tiktok",
    title: v.title ?? "",
    url: v.share_url ?? `https://www.tiktok.com/@${v.author?.unique_id}/video/${v.id}`,
    thumbnail: v.cover_url ?? "",
    publishedAt: v.create_time ? new Date(v.create_time * 1000).toISOString() : new Date().toISOString(),
    viewCount: v.stats?.play_count,
    likeCount: v.stats?.digg_count,
    commentCount: v.stats?.comment_count,
  }));
  return items;
}