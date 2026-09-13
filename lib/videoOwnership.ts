// lib/videoOwnership.ts
// Vérifie qu'un videoId appartient bien à un compte que l'utilisateur Kinde a
// lui-même lié, avant de lui exposer des statistiques (page Stats).
import "server-only";
import { hasAccountLink, getAccountLink } from "@/lib/accountLinks";
import { ensureFreshToken } from "@/lib/tiktok/auth.server";
import { getTikTokToken, saveTikTokToken } from "@/lib/tiktok/store";
import { fetchInstagramMedia } from "@/lib/meta/media.server";

type Platform = "youtube" | "tiktok" | "instagram";

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
  platform: Platform,
  videoId: string
): Promise<boolean> {
  try {
    if (platform === "youtube") {
      // Chaîne unique configurée pour toute l'app (YT_CHANNEL_ID) : seul le
      // lien de compte fait foi tant qu'il n'y a qu'une chaîne par déploiement.
      return await hasAccountLink(userId, "google-youtube");
    }

    if (platform === "tiktok") {
      const linked = await hasAccountLink(userId, "tiktok");
      if (!linked) return false;
      const access = await ensureFreshToken(getTikTokToken, saveTikTokToken);
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
