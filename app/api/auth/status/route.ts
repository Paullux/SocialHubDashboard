// app/api/auth/status/route.ts
import { NextResponse } from "next/server";
import { getTikTokToken } from "@/lib/tiktok/store";

export async function GET() {
  const res = NextResponse.json({
    youtube: !!process.env.YT_API_KEY && !!process.env.YT_CHANNEL_ID,
    tiktok: !!(await getTikTokToken()),
    instagram: false,
    facebook: false,
  });
  res.headers.set("Cache-Control", "no-store");
  return res;
}

