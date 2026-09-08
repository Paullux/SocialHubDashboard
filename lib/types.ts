// lib/types.ts
export type Platform = "youtube" | "tiktok" | "instagram" | "facebook";

export type VideoItem = {
  id: string;
  platform: Platform;
  title: string;
  url: string;
  thumbnail: string;
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
