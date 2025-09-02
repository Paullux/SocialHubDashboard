// lib/tiktok/auth.server.ts
// Utilitaire serveur pour s'assurer d'un access_token valide (refresh auto si nécessaire)
export async function ensureFreshToken(
  getToken: () => Promise<{ accessToken: string; refreshToken: string; expiresAt: number } | null>,
  saveToken: (t: { accessToken: string; refreshToken: string; expiresAt: number }) => Promise<void>
): Promise<string> {
  const t = await getToken();
  if (!t) throw new Error("No TikTok token stored");

  const now = Date.now();
  if (now < t.expiresAt - 60_000) return t.accessToken; // encore valide (1 min de marge)

  const body = new URLSearchParams({
    client_key: process.env.TIKTOK_CLIENT_KEY!,
    client_secret: process.env.TIKTOK_CLIENT_SECRET!,
    grant_type: "refresh_token",
    refresh_token: t.refreshToken,
  });

  const r = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });

  const json = await r.json();
  if (!r.ok) throw new Error(`tiktok_refresh_failed_${r.status}:${JSON.stringify(json)}`);

  const updated = {
    accessToken: json.access_token as string,
    refreshToken: (json.refresh_token as string) || t.refreshToken,
    expiresAt: Date.now() + ((json.expires_in as number) ?? 86400) * 1000,
  };
  await saveToken(updated);
  return updated.accessToken;
}
