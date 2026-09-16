// lib/google/perUser.ts
// Jeton Google/YouTube par utilisateur Kinde, avec rafraîchissement automatique.
// Pendant longtemps le refresh_token était stocké mais jamais consommé : le jeton
// d'accès expirait au bout d'une heure et rien ne le renouvelait.
import "server-only";
import { getAccountLink, upsertAccountLink } from "@/lib/accountLinks";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SKEW_MS = 60_000; // marge avant expiration

/**
 * Renvoie un access_token Google valide pour cet utilisateur, en le rafraîchissant
 * si nécessaire. Renvoie null si le compte n'est pas lié, si le refresh_token
 * manque (consentement obtenu sans access_type=offline) ou si Google refuse.
 */
export async function getFreshGoogleAccessToken(userId: string): Promise<string | null> {
  const link = await getAccountLink(userId, "google-youtube");
  if (!link) return null;

  const expiresAt = link.expiresAt ? new Date(link.expiresAt).getTime() : 0;
  if (link.accessToken && Date.now() < expiresAt - SKEW_MS) {
    return link.accessToken;
  }
  if (!link.refreshToken) return null;

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: link.refreshToken,
      grant_type: "refresh_token",
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    // 400 invalid_grant = consentement révoqué ou refresh_token périmé :
    // l'utilisateur doit reconnecter son compte.
    return null;
  }

  const tok = (await res.json()) as {
    access_token?: string;
    expires_in?: number;
    refresh_token?: string;
  };
  if (!tok.access_token) return null;

  await upsertAccountLink({
    userId,
    provider: "google-youtube",
    externalUserId: link.externalUserId,
    username: link.username,
    accessToken: tok.access_token,
    // Google ne renvoie un nouveau refresh_token que rarement : on garde l'ancien.
    refreshToken: tok.refresh_token ?? link.refreshToken,
    scope: link.scope,
    expiresAtSec: tok.expires_in ?? 3600,
    meta: link.meta,
  });

  return tok.access_token;
}
