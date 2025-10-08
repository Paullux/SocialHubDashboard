// app/api/auth/facebook/route.ts
import { NextResponse } from "next/server";
import { buildState, stateCookieSet } from "@/lib/security";

export async function GET() {
  const base = "https://www.facebook.com/v19.0/dialog/oauth";
  const scopes = (process.env.FACEBOOK_SCOPES || "public_profile,email")
    .split(/[ ,]+/).filter(Boolean).join(",");

  const state = buildState();
  const params = new URLSearchParams({
    client_id: process.env.FACEBOOK_APP_ID || "",
    redirect_uri: process.env.FACEBOOK_REDIRECT_URI || "",
    response_type: "code",
    scope: scopes,
    state,
  });

  const res = NextResponse.redirect(`${base}?${params.toString()}`);
  res.headers.append("Set-Cookie", stateCookieSet(state));
  return res;
}

