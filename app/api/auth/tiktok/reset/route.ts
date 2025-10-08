// app/api/auth/tiktok/reset/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST() {
  await prisma.oAuthToken.deleteMany({ where: { provider: "tiktok", userId: "me" } });
  const res = NextResponse.json({ ok: true, reset: true });
  res.headers.set("Cache-Control", "no-store");
  return res;
}
