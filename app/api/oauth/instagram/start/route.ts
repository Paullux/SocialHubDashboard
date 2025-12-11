// app/api/oauth/instagram/start/route.ts
import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
export async function GET() {
  const state = randomBytes(16).toString("hex");
  const params = new URLSearchParams({
    client_id: process.env.META_APP_ID!,
    redirect_uri: process.env.META_REDIRECT_URI!,
    response_type: "code",
    scope: "pages_show_list,instagram_basic,instagram_manage_insights",
    state,
  });
  return NextResponse.redirect(`https://www.facebook.com/v19.0/dialog/oauth?${params}`);
}
