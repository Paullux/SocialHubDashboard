// lib/meta/auth.server.ts
import "server-only";
import { META_GRAPH, META_OAUTH_TOKEN } from "./config";

/** Ré-échange un token long courant contre un nouveau (~60 jours). */
export async function exchangeForLongLivedToken(
  currentToken: string
): Promise<{ access_token: string; expires_in?: number } | null> {
  const r = await fetch(
    `${META_OAUTH_TOKEN}?` +
      new URLSearchParams({
        grant_type: "fb_exchange_token",
        client_id: process.env.META_APP_ID!,
        client_secret: process.env.META_APP_SECRET!,
        fb_exchange_token: currentToken,
      }),
    { cache: "no-store" }
  );
  if (!r.ok) return null;
  return r.json();
}

/**
 * Token d'accès de Page (dérivé du token utilisateur). Long-lived / sans
 * expiration si le token utilisateur source est long-lived.
 */
export async function getPageAccessToken(
  userToken: string,
  pageId: string
): Promise<string | null> {
  try {
    const r = await fetch(
      `${META_GRAPH}/${pageId}?fields=access_token&access_token=${encodeURIComponent(userToken)}`,
      { cache: "no-store" }
    );
    if (!r.ok) return null;
    return (await r.json())?.access_token ?? null;
  } catch {
    return null;
  }
}
