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

const FIELDS = [
  "id","title","video_description","duration","cover_image_url","share_url","embed_link",
  "create_time","like_count","comment_count","share_count","view_count",
].join(",");

export type TikTokPage = {
  items: VideoItem[];
  /** À repasser pour la page suivante (null : plus rien après). */
  cursor: number | null;
  hasMore: boolean;
};

/** Échec HTTP d'une page : distinct de « fin de liste », pour qu'une
 *  construction du catalogue ne prenne pas une erreur pour la dernière page. */
export class TikTokPageError extends Error {
  constructor(public status: number, public body: unknown) {
    super(`TikTok video/list failed: ${status}`);
  }
}

/** Une page de video/list (20 vidéos au plus), de la plus récente à la plus ancienne. */
export async function fetchTikTokPage(
  access: string,
  cursor: number | null,
  maxCount = 20
): Promise<TikTokPage> {
  const body: Record<string, unknown> = { max_count: Math.min(20, Math.max(1, maxCount)) };
  if (cursor != null) body.cursor = cursor;

  const r = await fetch(
    `https://open.tiktokapis.com/v2/video/list/?fields=${encodeURIComponent(FIELDS)}`,
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
  if (!r.ok) throw new TikTokPageError(r.status, await r.json().catch(() => null));

  const data: TikTokResponse = await r.json();
  const items = (data?.data?.videos ?? []).map(
    (v): VideoItem => ({
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
    })
  );
  const next = data?.data?.cursor ?? null;
  return { items, cursor: next, hasMore: Boolean(data?.data?.has_more) && next != null };
}

/* ================== Helper TikTok paginé ================== */
/** Les `target` vidéos les plus récentes. Best-effort : une page en échec
 *  arrête la liste là (détail dans `notes` en mode debug). */
export async function fetchTikTokPaged(
  access: string,
  target: number,
  debug = false,
  notes: Notes = {}
): Promise<VideoItem[]> {
  const items: VideoItem[] = [];
  let cursor: number | null = null;
  const dbg = {
    pages: 0,
    cursors: [] as Array<number | null>,
    last_status: 0,
    total_received: 0,
  };

  while (items.length < target) {
    dbg.pages += 1;
    let page: TikTokPage;
    try {
      page = await fetchTikTokPage(access, cursor, target - items.length);
    } catch (e) {
      if (e instanceof TikTokPageError) {
        dbg.last_status = e.status;
        if (debug) (notes as any).tiktok_error_body = e.body;
      }
      break;
    }
    dbg.last_status = 200;
    dbg.total_received += page.items.length;
    items.push(...page.items.slice(0, target - items.length));
    cursor = page.cursor;
    dbg.cursors.push(cursor);
    if (!page.hasMore) break;
  }

  if (debug) (notes as any).tiktok_debug = dbg;
  return items;
}
