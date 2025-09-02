// lib/types.ts
export type Platform = "youtube" | "tiktok";

// lib/types.ts
export type VideoItem = {
  id: string;
  platform: "youtube" | "tiktok";
  title: string;
  url: string;
  thumbnail: string;
  publishedAt: string;

  // KPI optionnels
  viewCount?: number;
  likeCount?: number;
  commentCount?: number;
  shareCount?: number;

  // TikTok Display API optionnels
  embedHtml?: string;
  embedLink?: string;
};

