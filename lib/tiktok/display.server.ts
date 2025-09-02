// lib/tiktok/display.server.ts
import "server-only";
import type { VideoItem } from "@/lib/types";

type DisplayApiVideo = {
  id: string;
  create_time: number; // epoch seconds
  cover_image_url: string;
  share_url: string;
  video_description?: string;
  duration?: number;
  height?: number;
  width?: number;
  title?: string;
  embed_html?: string;
  embed_link?: string;
  like_count?: number;
  comment_count?: number;
  share_count?: number;
  view_count?: number;
};

// Petit cache en mémoire (remplace par Redis/KV si besoin)
const mem = new Map<string, { data: VideoItem; exp: number }>();
const TTL_MS = 5.9 * 60 * 60 * 1000; // ~5h54

function normalizeUrl(u?: string) {
  if (!u) return "";
  return u.startsWith("//") ? `https:${u}` : u;
}

export async function fetchTikTokDisplayByUrl(videoUrl: string): Promise<VideoItem | null> {
  if (!videoUrl) return null;

  const key = `tt:display:${videoUrl}`;
  const now = Date.now();
  const cached = mem.get(key);
  if (cached && cached.exp > now) return cached.data;

  // TODO: si la Display API requiert un token, ajoute-le via Authorization: Bearer ...
  // La doc publique d'oEmbed n'en demande pas ; la Display API avec KPIs peut nécessiter auth.
  // Remplace l'URL ci-dessous par l'endpoint exact de la Display API que tu utilises :
  const endpoint = `https://www.tiktok.com/oembed?url=${encodeURIComponent(videoUrl)}`;

  const r = await fetch(endpoint, { cache: "no-store" });
  if (!r.ok) return null;

  // NOTE: si tu utilises un endpoint officiel "Display API" qui renvoie exactement
  // les champs listés dans ton message, parse ici ce schéma (DisplayApiVideo).
  const data: any = await r.json();

  // Exemple avec un schéma de Display API riche (adapter si besoin):
  const v: DisplayApiVideo = data;

  const item: VideoItem = {
    id: v.id,
    platform: "tiktok",
    title: v.title || v.video_description || "",
    url: v.share_url,
    thumbnail: v.cover_image_url,
    publishedAt: new Date(v.create_time * 1000).toISOString(),
    viewCount: v.view_count,
    likeCount: v.like_count,
    commentCount: v.comment_count,
    shareCount: v.share_count,
    embedHtml: v.embed_html,   // 👈
    embedLink: v.embed_link,   // 👈
  };

  mem.set(key, { data: item, exp: now + TTL_MS });
  return item;
}
