// app/api/auth/instagram/route.ts
import { NextResponse } from "next/server";
import { buildState, stateCookieSet } from "@/lib/security";

export async function GET() {
  const base = "https://api.instagram.com/oauth/authorize";
  const scopes = (process.env.INSTAGRAM_SCOPES || "user_profile,user_media")
    .split(/[ ,]+/).filter(Boolean).join(",");

  const state = buildState();
  const params = new URLSearchParams({
    client_id: process.env.INSTAGRAM_CLIENT_ID || "",
    redirect_uri: process.env.INSTAGRAM_REDIRECT_URI || "",
    response_type: "code",
    scope: scopes,
    state,
  });

  const res = NextResponse.redirect(`${base}?${params.toString()}`);
  res.headers.append("Set-Cookie", stateCookieSet(state));
  return res;
}

