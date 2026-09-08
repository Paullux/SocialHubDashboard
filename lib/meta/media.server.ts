// lib/meta/media.server.ts
import "server-only";
import type { VideoItem } from "@/lib/types";
import { META_GRAPH } from "./config";
import { getPageAccessToken } from "./auth.server";

const MEDIA_FIELDS = [
  "id",
  "caption",
  "media_type",
  "media_product_type",
  "media_url",
  "thumbnail_url",
  "permalink",
  "timestamp",
  "like_count",
  "comments_count",
].join(",");

/**
 * Médias du compte Instagram Business/Creator lié.
 * Le token utilisateur (Facebook Login for Business, scope instagram_basic +
 * instagram_manage_insights) suffit. Les vues ne sont pas dans /media : on les
 * récupère via /{media-id}/insights (borné, best-effort).
 */
export async function fetchInstagramMedia(
  accessToken: string,
  igUserId: string,
  limit = 30
): Promise<VideoItem[]> {
  if (!accessToken || !igUserId) return [];
  const at = encodeURIComponent(accessToken);

  const items: VideoItem[] = [];
  let next: string | null =
    `${META_GRAPH}/${igUserId}/media?fields=${MEDIA_FIELDS}` +
    `&limit=${Math.min(Math.max(limit, 1), 50)}&access_token=${at}`;

  while (next && items.length < limit) {
    const r: Response = await fetch(next, { cache: "no-store" });
    if (!r.ok) break;
    const data: any = await r.json();

    for (const m of data?.data ?? []) {
      const isVideo =
        m.media_type === "VIDEO" || m.media_product_type === "REELS";
      items.push({
        id: String(m.id),
        platform: "instagram",
        title: m.caption ?? "",
        url: m.permalink ?? "",
        thumbnail: m.thumbnail_url || m.media_url || "",
        publishedAt: m.timestamp ?? new Date().toISOString(),
        likeCount:
          typeof m.like_count === "number" ? m.like_count : undefined,
        commentCount:
          typeof m.comments_count === "number" ? m.comments_count : undefined,
        // viewCount rempli plus bas pour les vidéos
        _isVideo: isVideo,
      } as VideoItem & { _isVideo?: boolean });
      if (items.length >= limit) break;
    }

    next = data?.paging?.next ?? null;
  }

  // Vues : /insights par média vidéo, borné à 25 appels, best-effort.
  const videos = items
    .filter((v) => (v as any)._isVideo)
    .slice(0, 25);
  await Promise.all(
    videos.map(async (v) => {
      try {
        const r = await fetch(
          `${META_GRAPH}/${v.id}/insights?metric=views&access_token=${at}`,
          { cache: "no-store" }
        );
        if (!r.ok) return;
        const j = await r.json();
        const val = j?.data?.[0]?.values?.[0]?.value ?? j?.data?.[0]?.total_value?.value;
        if (typeof val === "number") v.viewCount = val;
      } catch {
        /* best-effort */
      }
    })
  );

  for (const v of items) delete (v as any)._isVideo;
  return items;
}

/**
 * Vidéos publiées sur la Page Facebook liée. Best-effort : renvoie [] si la Page
 * n'a pas de vidéo ou si le token de Page n'est pas dérivable.
 */
export async function fetchFacebookVideos(
  userToken: string,
  pageId: string,
  limit = 30
): Promise<VideoItem[]> {
  if (!userToken || !pageId) return [];
  const pageToken = await getPageAccessToken(userToken, pageId);
  if (!pageToken) return [];
  const at = encodeURIComponent(pageToken);

  const fields = [
    "id",
    "title",
    "description",
    "created_time",
    "permalink_url",
    "picture",
    "likes.summary(true).limit(0)",
    "comments.summary(true).limit(0)",
    "views",
  ].join(",");

  const items: VideoItem[] = [];
  let next: string | null =
    `${META_GRAPH}/${pageId}/videos?fields=${fields}` +
    `&limit=${Math.min(Math.max(limit, 1), 50)}&access_token=${at}`;

  while (next && items.length < limit) {
    const r: Response = await fetch(next, { cache: "no-store" });
    if (!r.ok) break;
    const data: any = await r.json();
    for (const v of data?.data ?? []) {
      items.push({
        id: String(v.id),
        platform: "facebook",
        title: v.title || v.description || "",
        url: v.permalink_url
          ? v.permalink_url.startsWith("http")
            ? v.permalink_url
            : `https://www.facebook.com${v.permalink_url}`
          : "",
        thumbnail: v.picture || "",
        publishedAt: v.created_time ?? new Date().toISOString(),
        viewCount: typeof v.views === "number" ? v.views : undefined,
        likeCount:
          typeof v.likes?.summary?.total_count === "number"
            ? v.likes.summary.total_count
            : undefined,
        commentCount:
          typeof v.comments?.summary?.total_count === "number"
            ? v.comments.summary.total_count
            : undefined,
      });
      if (items.length >= limit) break;
    }
    next = data?.paging?.next ?? null;
  }
  return items;
}
