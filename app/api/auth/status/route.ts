// app/api/auth/status/route.ts
import { NextResponse } from "next/server";
import { getTikTokToken } from "@/lib/tiktok/store";
// plus tard : getYouTubeKey(), getInstagramToken(), getFacebookToken()...

export async function GET() {
  return NextResponse.json({
    youtube: !!process.env.YT_API_KEY && !!process.env.YT_CHANNEL_ID,
    tiktok: !!(await getTikTokToken()),
    instagram: false, // placeholder
    facebook: false,  // placeholder
  });
}
