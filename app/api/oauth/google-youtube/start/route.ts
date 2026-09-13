// app/api/oauth/google-youtube/start/route.ts
import { NextResponse } from "next/server";
import { buildState, stateCookieSet } from "@/lib/security";

export async function GET() {
  const state = buildState();
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    scope: [
      "openid","email","profile",
      "https://www.googleapis.com/auth/youtube.readonly",
      "https://www.googleapis.com/auth/yt-analytics.readonly",
    ].join(" "),
    state,
  });
  const res = NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
  res.headers.append("Set-Cookie", stateCookieSet(state));
  return res;
}
