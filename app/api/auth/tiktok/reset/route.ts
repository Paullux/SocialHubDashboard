import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST() {
  await prisma.oAuthToken.deleteMany({ where: { provider: "tiktok", userId: "me" } });
  return NextResponse.json({ ok: true, reset: true });
}
