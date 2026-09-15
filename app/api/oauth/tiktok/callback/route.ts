// app/api/oauth/tiktok/callback/route.ts
export const runtime = "nodejs";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { requireDashboardUser } from "@/lib/auth";
import { upsertAccountLink } from "@/lib/accountLinks";

const ALLOWED_REDIRECTS = [
  "http://localhost:3000/api/oauth/tiktok/callback",
  "https://social-hub.fr/api/oauth/tiktok/callback",
];

function getRedirectFromEnv() {
  let r = (process.env.TIKTOK_REDIRECT_URI || "").trim();
  // anti-quotes / espaces invisibles
  if ((r.startsWith('"') && r.endsWith('"')) || (r.startsWith("'") && r.endsWith("'"))) {
    r = r.slice(1, -1).trim();
  }
  return r;
}

export async function GET(req: Request) {
  try {
    const user = await requireDashboardUser();

    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    if (!code || !state) {
      return NextResponse.json({ error: "missing code/state" }, { status: 400 });
    }

    // Next 15: cookies() est async
    const jar = await cookies();
    const pkceRaw = jar.get("tiktok_pkce")?.value;
    if (!pkceRaw) return NextResponse.json({ error: "pkce cookie missing" }, { status: 400 });

    let pkce: { state: string; verifier: string };
    try {
      pkce = JSON.parse(pkceRaw);
    } catch {
      return NextResponse.json({ error: "pkce cookie invalid json" }, { status: 400 });
    }
    if (pkce.state !== state) {
      return NextResponse.json({ error: "invalid state" }, { status: 400 });
    }

    // redirect_uri DOIT être EXACTEMENT celui déclaré côté TikTok
    const redirect = getRedirectFromEnv();
    if (!ALLOWED_REDIRECTS.includes(redirect)) {
      return NextResponse.json(
        { error: "redirect_uri_not_allowed", redirect, allowed: ALLOWED_REDIRECTS },
        { status: 500 }
      );
    }

    // Échange code -> token (PKCE: code_verifier)
    const tokenRes = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_key: process.env.TIKTOK_CLIENT_KEY!,
        client_secret: process.env.TIKTOK_CLIENT_SECRET!,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirect,          // ⚠️ identique à celui de /start et au portail
        code_verifier: pkce.verifier,    // PKCE
      }),
    });

    const txt = await tokenRes.text();
    if (!tokenRes.ok) {
      // renvoie l’erreur brute TikTok pour diagnostiquer (souvent "redirect_uri mismatch")
      return NextResponse.json({ error: "token_exchange_failed", details: txt, redirect_uri_used: redirect }, { status: 400 });
    }
    const tok = JSON.parse(txt); // { access_token, refresh_token, expires_in, open_id, scope, ... }

    // (Optionnel) profil basique pour un username affichable.
    // ⚠️ `fields` est obligatoire sur cet endpoint TikTok : sans lui, l'API ne
    // renvoie aucun champ exploitable (display_name/username vides) — c'est ce
    // qui faisait afficher "—" sur la page Comptes liés malgré une connexion OK.
    let username: string | null = null;
    try {
      const u = await fetch(
        "https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,username",
        { headers: { Authorization: `Bearer ${tok.access_token}` } }
      ).then((r) => r.json());
      username = u?.data?.user?.display_name ?? u?.data?.user?.username ?? null;
    } catch {
      // laisse username = null si l'appel échoue
    }

    // Persistance — jeton propre à l'utilisateur Kinde, chiffré (AccountLink),
    // exactement comme YouTube et Instagram. Plus de table partagée : chacun
    // ne voit et ne peut casser que sa propre connexion TikTok.
    await upsertAccountLink({
      userId: user.id,
      provider: "tiktok",
      externalUserId: tok.open_id,
      username,
      accessToken: tok.access_token,
      refreshToken: tok.refresh_token,
      scope: tok.scope,
      expiresAtSec: tok.expires_in,
    });

    // Nettoie le cookie PKCE et redirige
    const res = NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}/settings/linked-accounts?connected=tiktok`
    );
    res.cookies.set("tiktok_pkce", "", { maxAge: 0, path: "/" });
    return res;
  } catch (e: any) {
    // fallback lisible en dev
    return NextResponse.json({ error: "internal_error", message: String(e?.message ?? e) }, { status: 500 });
  }
}
