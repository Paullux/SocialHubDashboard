// app/api/auth/tiktok/route.ts
import { NextResponse } from "next/server";
import { buildState, stateCookieSet } from "@/lib/security";

export async function GET() {
  const base = "https://www.tiktok.com/v2/auth/authorize/";
  const scopes = (process.env.TIKTOK_SCOPES || "user.info.basic,video.list")
    .split(/[ ,]+/).filter(Boolean).join(",");

  const state = buildState();

  const p = new URLSearchParams({
    client_key: process.env.TIKTOK_CLIENT_KEY || "",
    response_type: "code",
    scope: scopes,
    redirect_uri: process.env.TIKTOK_REDIRECT_URI || "",
    state,
  });

  const res = NextResponse.redirect(`${base}?${p.toString()}`);
  res.headers.append("Set-Cookie", stateCookieSet(state));
  return res;
}
