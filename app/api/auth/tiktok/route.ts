// app/api/auth/tiktok/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  const base = "https://www.tiktok.com/v2/auth/authorize/";
  const scopes = (process.env.TIKTOK_SCOPES || "user.info.basic,video.list")
    .split(/[ ,]+/)
    .filter(Boolean)
    .join(",");

  const p = new URLSearchParams({
    client_key: process.env.TIKTOK_CLIENT_KEY || "",
    response_type: "code",
    scope: scopes, // TikTok attend des virgules entre scopes
    redirect_uri: process.env.TIKTOK_REDIRECT_URI || "",
    state: "shub_" + Math.random().toString(36).slice(2),
  });

  return NextResponse.redirect(`${base}?${p.toString()}`);
}
