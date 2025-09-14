// app/api/demo/videos/route.ts
import { NextResponse } from "next/server";
import demoVideos from "@/data/demo-videos";

export async function GET() {
  return NextResponse.json({ videos: demoVideos });
}
