// app/api/linked-accounts/route.ts
import { NextResponse } from "next/server";
import { requireDashboardUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const user = await requireDashboardUser(); // Auth + permission côté serveur

    const links = await prisma.accountLink.findMany({
      where: { userId: user.id },
      // Jamais les jetons (même chiffrés) côté navigateur.
      select: { provider: true, username: true },
    });

    return NextResponse.json({ links });
  } catch (err) {
    return NextResponse.json(
      { error: "Unauthorized or failed to load accounts" },
      { status: 401 }
    );
  }
}