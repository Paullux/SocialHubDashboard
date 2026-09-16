// app/api/oauth/disconnect/route.ts
export const runtime = "nodejs";
import { requireDashboardUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  // requireDashboardUser() lève une exception : sans ce filet, un appel sans
  // session ressortait en 500 alors qu'il est simplement non authentifié.
  const user = await requireDashboardUser().catch(() => null);
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const provider = searchParams.get("provider")!;

  // Chacun ne déconnecte que son propre lien — TikTok utilise désormais un
  // jeton par utilisateur (AccountLink) comme YouTube/Instagram, plus de
  // table partagée à purger séparément.
  await prisma.accountLink
    .delete({ where: { userId_provider: { userId: user.id, provider } } })
    .catch(() => {});

  return Response.redirect(
    new URL(
      "/settings/linked-accounts?disconnected=" + provider,
      process.env.NEXT_PUBLIC_BASE_URL
    )
  );
}
