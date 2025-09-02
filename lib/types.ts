// lib/types.ts
export type VideoItem = {
  id: string;
  platform: "youtube" | "tiktok";
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
