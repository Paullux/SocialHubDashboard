// app/api/demo/videos/route.ts
import { NextResponse } from "next/server";
import demoVideos from "@/data/demo-videos";

export async function GET() {
  const res = NextResponse.json({ videos: demoVideos });
  res.headers.set("Cache-Control", "no-store");
  return res;
}
