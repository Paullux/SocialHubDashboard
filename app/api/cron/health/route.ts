// app/api/cron/health/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const last = await prisma.videoMetric.findFirst({
    orderBy: { snapshotAt: "desc" },
    select: { platform: true, videoId: true, snapshotAt: true }
  });

  const perPlatform = await prisma.videoMetric.groupBy({
    by: ["platform"],
    _count: { _all: true },
  });

  return NextResponse.json({
    lastRunAt: last?.snapshotAt?.toISOString() ?? null,
    lastExample: last ?? null,
    totals: perPlatform.reduce((acc, r) => {
      acc[r.platform] = r._count._all;
      return acc;
    }, {} as Record<string, number>),
  });
}
