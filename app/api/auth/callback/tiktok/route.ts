// app/api/auth/callback/tiktok/route.ts
import { NextRequest, NextResponse } from "next/server";
import { saveTikTokToken } from "@/lib/tiktok/store";

export async function GET(req: NextRequest) {
  const error = req.nextUrl.searchParams.get("error");
  const code = req.nextUrl.searchParams.get("code");

  if (error) return NextResponse.json({ ok: false, step: "authorize", error }, { status: 400 });
  if (!code) return NextResponse.json({ ok: false, error: "Missing code" }, { status: 400 });

  const body = new URLSearchParams({
    client_key: process.env.TIKTOK_CLIENT_KEY!,
    client_secret: process.env.TIKTOK_CLIENT_SECRET!,
    code,
    grant_type: "authorization_code",
    redirect_uri: process.env.TIKTOK_REDIRECT_URI!,
  });

  const r = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });

  const tokens = await r.json();
  if (!r.ok) {
    return NextResponse.json({ ok: false, step: "token", status: r.status, tokens }, { status: r.status });
  }

  await saveTikTokToken({
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt: Date.now() + tokens.expires_in * 1000,
    openId: tokens.open_id,
    scope: tokens.scope,
  });

  // Redirige vers le dashboard (ou renvoie JSON si tu préfères)
  const redirectTo = process.env.NEXT_PUBLIC_BASE_URL
    ? `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard`
    : "/dashboard";
  return NextResponse.redirect(redirectTo);
}
