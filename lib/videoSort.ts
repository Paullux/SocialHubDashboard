// lib/videoSort.ts
// Tri des cartes vidéo, partagé par /dashboard et /demo.
// Vivait en double dans app/dashboard/page.tsx avant que /demo en ait besoin.
import type { VideoItem } from "@/lib/types";

export type SortKey = "date" | "views" | "likes" | "comments" | "shares";
export type SortDir = "desc" | "asc";

function metricOf(v: VideoItem, key: SortKey): number {
  switch (key) {
    case "date":
      return v.publishedAt ? Date.parse(v.publishedAt) : Number.NaN;
    case "views":
      return v.viewCount ?? Number.NaN;
    case "likes":
      return v.likeCount ?? Number.NaN;
    case "comments":
      return v.commentCount ?? Number.NaN;
    case "shares":
      return v.shareCount ?? Number.NaN; // TikTok only
  }
}

/** Tri stable-ish : les valeurs manquantes (NaN) finissent toujours en queue,
 *  quel que soit le sens, pour qu'une vidéo sans compteur ne prenne jamais la
 *  tête d'un classement croissant. */
export function sortVideos(
  videos: VideoItem[],
  key: SortKey,
  dir: SortDir
): VideoItem[] {
  const arr = [...videos];
  const sign = dir === "desc" ? -1 : 1;
  arr.sort((a, b) => {
    const A = metricOf(a, key);
    const B = metricOf(b, key);
    const aNaN = Number.isNaN(A);
    const bNaN = Number.isNaN(B);
    if (aNaN && bNaN) return 0;
    if (aNaN) return 1;
    if (bNaN) return -1;
    if (A === B) return 0;
    return A > B ? sign : -sign;
  });
  return arr;
}
