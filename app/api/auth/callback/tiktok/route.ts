import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");

  if (!code) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }

  // Later: exchange `code` for `access_token` with TikTok API
  // POST https://open.tiktokapis.com/v2/oauth/token/

  return NextResponse.json({ success: true, code, state });
}
