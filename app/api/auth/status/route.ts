// app/api/auth/status/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { requireDashboardUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Status = { youtube: boolean; tiktok: boolean; instagram: boolean };

export async function GET() {
  try {
    const user = await requireDashboardUser();

    const links = await prisma.accountLink.findMany({
      where: {
        userId: user.id,
        provider: { in: ["google-youtube", "tiktok", "instagram"] },
      },
      select: { provider: true },
    });

    const has = (p: string) =>
      links.some((l: { provider: string }) => l.provider === p);

    const s: Status = {
      youtube: has("google-youtube"),
      tiktok: has("tiktok"),
      instagram: has("instagram"),
    };

    return NextResponse.json(s);
  } catch {
    const s: Status = { youtube: false, tiktok: false, instagram: false };
    return NextResponse.json(s);
  }
}
