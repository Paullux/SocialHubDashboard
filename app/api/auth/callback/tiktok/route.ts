// app/api/auth/callback/tiktok/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const err  = req.nextUrl.searchParams.get("error");

  if (err) return NextResponse.json({ ok:false, step:"authorize", error: err }, { status: 400 });
  if (!code) return NextResponse.json({ ok:false, error: "Missing code" }, { status: 400 });

  const body = new URLSearchParams({
    client_key: process.env.TIKTOK_CLIENT_KEY!,
    client_secret: process.env.TIKTOK_CLIENT_SECRET!,
    code,
    grant_type: "authorization_code",
    redirect_uri: process.env.TIKTOK_REDIRECT_URI!, // doit matcher EXACTEMENT
  });

  const r = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });

  const json = await r.json();
  if (!r.ok) return NextResponse.json({ ok:false, step:"token", status:r.status, json }, { status: r.status });

  // TODO: stocker access_token/refresh_token en DB
  return NextResponse.json({ ok:true, tokens: json });
}
