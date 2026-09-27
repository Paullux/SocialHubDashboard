// lib/tiktok/videos.server.ts
// Liste paginée des vidéos TikTok d'un compte (Display API v2, video/list),
// de la plus récente à la plus ancienne : l'API ne propose aucun autre ordre.
// Partagée par /api/videos et le catalogue des tris (lib/catalog.server.ts).
import "server-only";
import type { VideoItem } from "@/lib/types";

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
export async function fetchTikTokPaged(
  access: string,
  target: number,
  debug = false,
  notes: Notes = {}
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
        description: v.video_description || "",
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
