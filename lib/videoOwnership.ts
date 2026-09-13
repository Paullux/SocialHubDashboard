// lib/videoOwnership.ts
// Vérifie qu'un videoId appartient bien à un compte que l'utilisateur Kinde a
// lui-même lié, avant de lui exposer des statistiques (page Stats).
import "server-only";
import { getAccountLink } from "@/lib/accountLinks";
import { getFreshTikTokAccessToken } from "@/lib/tiktok/perUser";
import { fetchInstagramMedia } from "@/lib/meta/media.server";

type Platform = "youtube" | "tiktok" | "instagram";

async function youtubeVideoChannelId(videoId: string): Promise<string | null> {
  const key = process.env.YT_API_KEY || "";
  if (!key) return null;
  const url = new URL("https://www.googleapis.com/youtube/v3/videos");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("id", videoId);
  url.searchParams.set("key", key);
  const r = await fetch(url.toString(), { cache: "no-store" });
  if (!r.ok) return null;
  const json = (await r.json()) as { items?: Array<{ snippet?: { channelId?: string } }> };
  return json?.items?.[0]?.snippet?.channelId ?? null;
}

async function tiktokHasVideo(access: string, videoId: string): Promise<boolean> {
  const r = await fetch(
    "https://open.tiktokapis.com/v2/video/query/?fields=id",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "social-hub/1.0",
      },
      body: JSON.stringify({ filters: { video_ids: [videoId] } }),
      cache: "no-store",
    }
  );
  if (!r.ok) return false;
  const json = (await r.json()) as { data?: { videos?: Array<{ id?: string }> } };
  return (json?.data?.videos ?? []).some((v) => String(v?.id) === videoId);
}

export async function userOwnsVideo(
  userId: string,
  _userEmail: string | null | undefined,
  platform: Platform,
  videoId: string
): Promise<boolean> {
  try {
    if (platform === "youtube") {
      // Chaque utilisateur a sa propre chaîne (résolue à la connexion via
      // channels?mine=true, stockée dans AccountLink.meta.channelId) : on
      // vérifie que la vidéo demandée appartient bien à CETTE chaîne.
      const link = await getAccountLink(userId, "google-youtube");
      const channelId = (link?.meta as { channelId?: string } | null)?.channelId;
      if (!channelId) return false;
      const videoChannelId = await youtubeVideoChannelId(videoId);
      return !!videoChannelId && videoChannelId === channelId;
    }

    if (platform === "tiktok") {
      // Jeton propre à l'utilisateur (AccountLink), comme Instagram.
      const access = await getFreshTikTokAccessToken(userId);
      if (!access) return false;
      return await tiktokHasVideo(access, videoId);
    }

    if (platform === "instagram") {
      const link = await getAccountLink(userId, "instagram");
      if (!link?.accessToken) return false;
      const items = await fetchInstagramMedia(link.accessToken, 200);
      return items.some((v) => v.id === videoId);
    }

    return false;
  } catch {
    // best-effort : en cas d'erreur réseau/API, on refuse plutôt que d'exposer.
    return false;
  }
}
