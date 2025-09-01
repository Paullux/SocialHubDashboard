// lib/fetchVideos.ts
import "server-only";

export type VideoItem = {
  id: string;
  platform: "youtube" | "tiktok";
  title: string;
  thumbnail: string;
  url: string;
  publishedAt: string;
};

export async function fetchYouTubeLatest(
  apiKey?: string,
  channelId?: string,
  limit = 12,
): Promise<VideoItem[]> {
  if (!apiKey || !channelId) return [];

  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("channelId", channelId);
  url.searchParams.set("maxResults", String(Math.max(1, Math.min(50, limit))));
  url.searchParams.set("order", "date");
  url.searchParams.set("type", "video");
  url.searchParams.set("key", apiKey);

  const res = await fetch(url.toString(), { next: { revalidate: 300 } });
  if (!res.ok) return [];

  const data = await res.json();

  return (data.items ?? []).map((it: any) => {
    const vid = (it?.id?.videoId ?? "") as string;
    const sn = it?.snippet ?? {};
    const snThumb = sn?.thumbnails ?? {};

    const thumb =
      snThumb?.maxres?.url ||
      snThumb?.high?.url ||
      (vid ? `https://i.ytimg.com/vi/${vid}/hqdefault.jpg` : ""); // ← host correct

    return {
      id: vid,
      platform: "youtube",
      title: sn?.title ?? "Sans titre",
      thumbnail: thumb ?? "",
      url: vid ? `https://www.youtube.com/watch?v=${vid}` : "",
      publishedAt: sn?.publishedAt ?? new Date().toISOString(),
    } as VideoItem;
  });
}
