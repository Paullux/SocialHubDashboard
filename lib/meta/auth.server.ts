// lib/meta/auth.server.ts
import "server-only";
import { IG_LOGIN_OAUTH_TOKEN, IG_LOGIN_EXCHANGE_TOKEN, IG_LOGIN_REFRESH_TOKEN } from "./config";

/** Échange le `code` OAuth contre un token court (~1h) + l'IGSID de l'utilisateur. */
export async function exchangeCodeForShortLivedToken(
  code: string,
  redirectUri: string
): Promise<{ access_token: string; user_id: string } | null> {
  const body = new URLSearchParams({
    client_id: process.env.IG_LOGIN_APP_ID!,
    client_secret: process.env.IG_LOGIN_APP_SECRET!,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
    // Instagram ajoute parfois un suffixe "#_" au code renvoyé dans l'URL.
    code: code.replace(/#_$/, ""),
  });
  const r = await fetch(IG_LOGIN_OAUTH_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });
  if (!r.ok) return null;
  const data = await r.json();
  // Certaines versions renvoient { data: [{ access_token, user_id }] }
  const row = Array.isArray(data?.data) ? data.data[0] : data;
  if (!row?.access_token) return null;
  return { access_token: row.access_token, user_id: String(row.user_id ?? "") };
}

/** Token court -> token long (~60 jours). */
export async function exchangeForLongLivedToken(
  shortToken: string
): Promise<{ access_token: string; expires_in?: number } | null> {
  const r = await fetch(
    `${IG_LOGIN_EXCHANGE_TOKEN}?` +
      new URLSearchParams({
        grant_type: "ig_exchange_token",
        client_secret: process.env.IG_LOGIN_APP_SECRET!,
        access_token: shortToken,
      }),
    { cache: "no-store" }
  );
  if (!r.ok) return null;
  return r.json();
}

/** Rafraîchit un token long (doit avoir au moins 24h) pour 60 jours de plus. */
export async function refreshLongLivedToken(
  currentToken: string
): Promise<{ access_token: string; expires_in?: number } | null> {
  const r = await fetch(
    `${IG_LOGIN_REFRESH_TOKEN}?` +
      new URLSearchParams({
        grant_type: "ig_refresh_token",
        access_token: currentToken,
      }),
    { cache: "no-store" }
  );
  if (!r.ok) return null;
  return r.json();
}
