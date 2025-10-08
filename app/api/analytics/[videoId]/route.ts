// app/api/analytics/[videoId]/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getHourlyMetrics, getDailyMetrics } from "@/lib/metrics";
import { ipFromHeaders, isRateLimitedKey, jsonNoStore } from "@/lib/security";

const VIDEO_ID_RX = /^[A-Za-z0-9_\-:.]{1,128}$/;

export async function GET(req: Request, ctx: { params: { videoId: string } }) {
  try {
    const ip = ipFromHeaders(req);
    if (isRateLimitedKey(`ana:${ip}`)) {
      return jsonNoStore({ error: "Too many requests" }, { status: 429 });
    }

    const { videoId } = ctx.params ?? {};
    if (!videoId || !VIDEO_ID_RX.test(videoId)) {
      return jsonNoStore({ error: "Invalid videoId" }, { status: 400 });
    }

    const url = new URL(req.url);
    const p = (url.searchParams.get("platform") || "youtube").toLowerCase();
    const platform = p === "tiktok" ? "tiktok" : "youtube";

    const [hourly, daily] = await Promise.all([
      getHourlyMetrics(platform, videoId),
      getDailyMetrics(platform, videoId),
    ]);

    return jsonNoStore({ platform, videoId, hourly, daily });
  } catch (e: any) {
    return jsonNoStore({ error: String(e?.message ?? e) }, { status: 500 });
  }
}
