// app/api/analytics/[videoId]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: { videoId: string } }) {
  const { videoId } = params;

  const rows = await prisma.videoMetric.findMany({
    where: { platform: "youtube", videoId },
    orderBy: { snapshotAt: "asc" },
    select: { snapshotAt: true, views: true, likes: true, comments: true, shares: true },
  });

  return NextResponse.json(rows);
}
