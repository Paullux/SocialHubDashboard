// app/api/linked-accounts/route.ts
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const user = await requireUser(); // Auth côté serveur

    const links = await prisma.accountLink.findMany({
      where: { userId: user.id },
    });

    return NextResponse.json({ links });
  } catch (err) {
    return NextResponse.json(
      { error: "Unauthorized or failed to load accounts" },
      { status: 401 }
    );
  }
}