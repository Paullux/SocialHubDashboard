// app/api/auth/tiktok/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  const base = "https://www.tiktok.com/v2/auth/authorize/";
  const p = new URLSearchParams({
    client_key: process.env.TIKTOK_CLIENT_KEY!,
    response_type: "code",
    scope: (process.env.TIKTOK_SCOPES || "user.info.basic user.video.list").replace(/\s+/g, " "),
    redirect_uri: process.env.TIKTOK_REDIRECT_URI!,
    state: "shub_" + Math.random().toString(36).slice(2),
  });
  // encodage propre du redirect_uri par URLSearchParams
  return NextResponse.redirect(`${base}?${p.toString()}`);
}
