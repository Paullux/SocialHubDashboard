// app/api/auth/youtube/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  const base = "https://accounts.google.com/o/oauth2/v2/auth";
  const scopes = (process.env.YOUTUBE_SCOPES || "https://www.googleapis.com/auth/youtube.readonly")
    .split(/[ ,]+/)
    .filter(Boolean)
    .join(" ");

  const params = new URLSearchParams({
    client_id: process.env.YOUTUBE_CLIENT_ID || "",
    redirect_uri: process.env.YOUTUBE_REDIRECT_URI || "",
    response_type: "code",
    access_type: "offline",
    include_granted_scopes: "true",
    scope: scopes,
    state: "yt_" + Math.random().toString(36).slice(2),
  });

  return NextResponse.redirect(`${base}?${params.toString()}`);
}
