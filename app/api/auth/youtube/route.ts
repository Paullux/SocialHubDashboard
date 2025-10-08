// app/api/auth/youtube/route.ts
import { NextResponse } from "next/server";
import { buildState, stateCookieSet } from "@/lib/security";

export async function GET() {
  const base = "https://accounts.google.com/o/oauth2/v2/auth";
  const scopes = (process.env.YOUTUBE_SCOPES || "https://www.googleapis.com/auth/youtube.readonly")
    .split(/[ ,]+/).filter(Boolean).join(" ");

  const state = buildState();
  const params = new URLSearchParams({
    client_id: process.env.YOUTUBE_CLIENT_ID || "",
    redirect_uri: process.env.YOUTUBE_REDIRECT_URI || "",
    response_type: "code",
    access_type: "offline",
    include_granted_scopes: "true",
    scope: scopes,
    state,
  });

  const res = NextResponse.redirect(`${base}?${params.toString()}`);
  res.headers.append("Set-Cookie", stateCookieSet(state));
  return res;
}

