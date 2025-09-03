import { NextResponse } from "next/server";
import { getTikTokToken } from "@/lib/tiktok/store"; // ta fonction qui lit en BDD

export async function GET() {
  const token = await getTikTokToken();
  return NextResponse.json({ connected: !!token });
}
