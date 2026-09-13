// lib/tiktok/perUser.ts
// Jeton TikTok par utilisateur Kinde, via AccountLink (comme Instagram) —
// remplace l'ancien singleton partagé (lib/tiktok/store.ts, userId "me").
import "server-only";
import { getAccountLink, upsertAccountLink } from "@/lib/accountLinks";
import { ensureFreshToken } from "@/lib/tiktok/auth.server";

export async function getFreshTikTokAccessToken(userId: string): Promise<string | null> {
  const link = await getAccountLink(userId, "tiktok");
  if (!link || !link.refreshToken) return null;

  const getToken = async () => ({
    accessToken: link.accessToken,
    refreshToken: link.refreshToken as string,
    expiresAt: link.expiresAt ? new Date(link.expiresAt).getTime() : 0,
  });

  const saveToken = async (t: {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
  }) => {
    await upsertAccountLink({
      userId,
      provider: "tiktok",
      externalUserId: link.externalUserId,
      username: link.username,
      accessToken: t.accessToken,
      refreshToken: t.refreshToken,
      scope: link.scope,
      expiresAtSec: Math.max(0, Math.round((t.expiresAt - Date.now()) / 1000)),
      meta: link.meta,
    });
  };

  try {
    return await ensureFreshToken(getToken, saveToken);
  } catch {
    return null;
  }
}
