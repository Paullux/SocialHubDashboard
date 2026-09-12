// lib/types.ts
export type Platform = "youtube" | "tiktok" | "instagram";

export type VideoItem = {
  id: string;
  platform: Platform;
  title: string;
  /** Description / légende complète (affichée au survol de la carte). */
  description?: string;
  url: string;
  thumbnail: string;
  /** Dimensions de `thumbnail` en pixels, quand connues (permet de distinguer
   *  une miniature verticale d'une horizontale/carrée côté affichage). */
  thumbnailWidth?: number;
  thumbnailHeight?: number;
  publishedAt: string;

  // KPI optionnels TikTok
  viewCount?: number;
  likeCount?: number;
  commentCount?: number;
  shareCount?: number;

  // Display API optionnels
  embedHtml?: string;
  embedLink?: string;
};
