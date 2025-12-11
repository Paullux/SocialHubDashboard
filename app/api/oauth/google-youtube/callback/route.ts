// app/api/oauth/google-youtube/callback/route.ts
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { upsertAccountLink } from "@/lib/accountLinks";

const OAUTH_TOKEN = "https://oauth2.googleapis.com/token";

function dev() {
  return process.env.NODE_ENV !== "production";
}

export async function GET(req: Request) {
  try {
    const user = await requireUser(); // assure-toi d'être connecté Kinde
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const err = searchParams.get("error");
    if (err) return NextResponse.json({ error: err }, { status: 400 });
    if (!code) return NextResponse.json({ error: "Missing code" }, { status: 400 });

    const client_id = process.env.GOOGLE_CLIENT_ID!;
    const client_secret = process.env.GOOGLE_CLIENT_SECRET!;
    const redirect_uri = process.env.GOOGLE_REDIRECT_URI!; // DOIT matcher exactement GCP

    // 1) code -> token
    const tokenRes = await fetch(OAUTH_TOKEN, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id,
        client_secret,
        redirect_uri,
        grant_type: "authorization_code",
      }),
      cache: "no-store",
    });

    const tokenText = await tokenRes.text();
    if (!tokenRes.ok) {
      if (dev()) console.error("Token exchange failed:", tokenText);
      return NextResponse.json({ error: "token_exchange_failed", details: tokenText }, { status: 400 });
    }
    const tok = JSON.parse(tokenText); // {access_token, refresh_token, expires_in, ...}

    // 2) Récupérer la chaîne
    const chRes = await fetch(
      "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
      { headers: { Authorization: `Bearer ${tok.access_token}` } }
    );
    const chText = await chRes.text();
    if (!chRes.ok) {
      if (dev()) console.error("Channels failed:", chText);
      return NextResponse.json({ error: "channels_failed", details: chText }, { status: 400 });
    }
    const ch = JSON.parse(chText);
    const first = ch?.items?.[0];
    const channelId = first?.id ?? "unknown";
    const title = first?.snippet?.title ?? null;

    // 3) Persist
    await upsertAccountLink({
      userId: user.id,
      provider: "google-youtube",
      externalUserId: channelId,
      username: title,
      accessToken: tok.access_token,
      refreshToken: tok.refresh_token,
      scope: "youtube.readonly yt-analytics.readonly",
      expiresAtSec: tok.expires_in,
      meta: { channelId },
    });

    const base = process.env.NEXT_PUBLIC_BASE_URL!;
    return NextResponse.redirect(`${base}/settings/linked-accounts?connected=youtube`);
  } catch (e: any) {
    console.error("YT callback fatal:", e);
    // En dev, renvoie l’erreur lisible, en prod redirige soft
    if (dev()) return NextResponse.json({ error: "internal_error", message: String(e?.message ?? e) }, { status: 500 });
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/settings/linked-accounts?error=youtube`);
  }
}
