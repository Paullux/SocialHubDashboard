// app/api/oauth/disconnect/route.ts
export const runtime = "nodejs";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const user = await requireUser();
  const { searchParams } = new URL(req.url);
  const provider = searchParams.get("provider")!;
  await prisma.accountLink.delete({ where: { userId_provider: { userId: user.id, provider } } }).catch(() => {});
  return Response.redirect(new URL("/settings/linked-accounts?disconnected="+provider, process.env.NEXT_PUBLIC_BASE_URL));
}
