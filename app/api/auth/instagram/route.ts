// app/api/auth/instagram/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  const base = "https://api.instagram.com/oauth/authorize";
  const scopes = (process.env.INSTAGRAM_SCOPES || "user_profile,user_media")
    .split(/[ ,]+/)
    .filter(Boolean)
    .join(",");

  const params = new URLSearchParams({
    client_id: process.env.INSTAGRAM_CLIENT_ID || "",
    redirect_uri: process.env.INSTAGRAM_REDIRECT_URI || "",
    response_type: "code",
    scope: scopes,
    state: "ig_" + Math.random().toString(36).slice(2),
  });

  return NextResponse.redirect(`${base}?${params.toString()}`);
}
