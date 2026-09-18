// lib/meta/media.server.ts
import "server-only";
import type { VideoItem } from "@/lib/types";
import { IG_LOGIN_GRAPH } from "./config";

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
 * Médias du compte Instagram (Instagram API with Instagram Login — Creator ou
 * Business, sans Page Facebook requise). Les vues ne sont pas dans /media : on
 * les récupère via /{media-id}/insights (borné, best-effort).
 */
export async function fetchInstagramMedia(
  accessToken: string,
  limit = 30
): Promise<VideoItem[]> {
  if (!accessToken) return [];
  const at = encodeURIComponent(accessToken);

  const items: VideoItem[] = [];
  let next: string | null =
    `${IG_LOGIN_GRAPH}/me/media?fields=${MEDIA_FIELDS}` +
    `&limit=${Math.min(Math.max(limit, 1), 50)}&access_token=${at}`;

  while (next && items.length < limit) {
    const r: Response = await fetch(next, { cache: "no-store" });
    if (!r.ok) break;
    const data: any = await r.json();

    for (const m of data?.data ?? []) {
      items.push({
        id: String(m.id),
        platform: "instagram",
        title: m.caption ?? "",
        description: m.caption ?? "",
        url: m.permalink ?? "",
        thumbnail: m.thumbnail_url || m.media_url || "",
        publishedAt: m.timestamp ?? new Date().toISOString(),
        likeCount:
          typeof m.like_count === "number" ? m.like_count : undefined,
        commentCount:
          typeof m.comments_count === "number" ? m.comments_count : undefined,
        // viewCount rempli plus bas
      } as VideoItem);
      if (items.length >= limit) break;
    }

    next = data?.paging?.next ?? null;
  }

  // Vues : /insights par média, borné à 25 appels, best-effort.
  // Pas de filtre sur le type de média : depuis l'API v22, `views` est servi
  // pour tout (REELS, VIDEO, IMAGE, CAROUSEL_ALBUM). Ne demander les insights
  // que pour les vidéos laissait les carrousels et les photos à « — ».
  await Promise.all(
    items.slice(0, 25).map(async (v) => {
      try {
        const r = await fetch(
          `${IG_LOGIN_GRAPH}/${v.id}/insights?metric=views&access_token=${at}`,
          { cache: "no-store" }
        );
        if (!r.ok) return;
        const j = await r.json();
        const val =
          j?.data?.[0]?.values?.[0]?.value ?? j?.data?.[0]?.total_value?.value;
        if (typeof val === "number") v.viewCount = val;
      } catch {
        /* best-effort */
      }
    })
  );

  return items;
}
