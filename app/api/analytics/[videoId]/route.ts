// app/api/analytics/[videoId]/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getHourlyMetrics, getDailyMetrics } from "@/lib/metrics";

export async function GET(req: Request, ctx: any) {
  try {
    // 👇 Ici c'est ctx.params (pas "context")
    const { videoId } = await ctx.params;

    const url = new URL(req.url);
    const platformParam = (url.searchParams.get("platform") || "youtube").toLowerCase();
    const platform = platformParam === "tiktok" ? "tiktok" : "youtube";

    const [hourly, daily] = await Promise.all([
      getHourlyMetrics(platform, videoId),
      getDailyMetrics(platform, videoId),
    ]);

    return NextResponse.json({ platform, videoId, hourly, daily });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
