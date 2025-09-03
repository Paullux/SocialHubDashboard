// app/api/auth/callback/tiktok/route.ts
import { NextRequest, NextResponse } from "next/server";
import { saveTikTokToken } from "@/lib/tiktok/store";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");
  if (error) return NextResponse.json({ ok:false, step:"authorize", error }, { status: 400 });
  if (!code) return NextResponse.json({ ok:false, error:"Missing code" }, { status: 400 });

  const body = new URLSearchParams({
    client_key: process.env.TIKTOK_CLIENT_KEY || "",
    client_secret: process.env.TIKTOK_CLIENT_SECRET || "",
    code,
    grant_type: "authorization_code",
    redirect_uri: process.env.TIKTOK_REDIRECT_URI || "",
  });

  const r = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });

  const tokens = await r.json().catch(() => ({}));
  if (!r.ok) {
    console.error("[TikTok][TOKEN][ERROR]", r.status, tokens);
    return NextResponse.json({ ok:false, step:"token", status:r.status, tokens }, { status: r.status });
  }

  // ✅ C’EST ICI qu’on peut logguer les scopes et l’open_id
  console.log(
    "[TikTok][TOKEN] granted_scopes=%s open_id=%s expires_in_s=%d",
    tokens.scope,
    tokens.open_id,
    tokens.expires_in
  );

  await saveTikTokToken({
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt: Date.now() + (tokens.expires_in ?? 86400) * 1000,
    openId: tokens.open_id,
    scope: tokens.scope,
  });

  const redirectTo =
    process.env.NEXT_PUBLIC_BASE_URL
      ? `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard`
      : "/dashboard";

  return NextResponse.redirect(redirectTo);
}
