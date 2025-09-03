// app/api/auth/callback/tiktok/route.ts
import { NextRequest, NextResponse } from "next/server";
import { saveTikTokToken } from "@/lib/tiktok/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  const errorDesc = url.searchParams.get("error_description");

  if (error) {
    console.error("[TikTok][AUTH][authorize_error]", { error, errorDesc });
    return NextResponse.json(
      { ok: false, step: "authorize", error, error_description: errorDesc },
      { status: 400 }
    );
  }
  if (!code) {
    console.error("[TikTok][AUTH] missing code", req.url);
    return NextResponse.json({ ok: false, step: "callback", error: "Missing code" }, { status: 400 });
  }

  // Exchange code -> tokens
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

  // Essayons toujours de parser le JSON pour voir l’erreur renvoyée
  let json: any = null;
  try { json = await r.json(); } catch { json = null; }

  if (!r.ok) {
    console.error("[TikTok][AUTH][token_error]", r.status, json);
    return NextResponse.json(
      { ok: false, step: "token", status: r.status, response: json ?? null },
      { status: 400 }
    );
  }

  // Validation stricte
  const access = json?.access_token;
  const refresh = json?.refresh_token;
  const openId  = json?.open_id ?? "";
  const scope   = json?.scope ?? "";
  const expSec  = Number(json?.expires_in ?? 0);

  if (!access || !refresh || !expSec) {
    console.error("[TikTok][AUTH][token_missing_fields]", { access: !!access, refresh: !!refresh, expSec });
    return NextResponse.json(
      { ok: false, step: "token", status: r.status, response: json },
      { status: 400 }
    );
  }

  console.log("[TikTok][TOKEN] scopes=%s open_id=%s exp_s=%d", scope, openId, expSec);

  await saveTikTokToken({
    accessToken: access,
    refreshToken: refresh,
    expiresAt: Date.now() + expSec * 1000,
    openId,
    scope,
  });

  const redirectTo = process.env.NEXT_PUBLIC_BASE_URL
    ? `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard`
    : "/dashboard";
  return NextResponse.redirect(redirectTo);
}
