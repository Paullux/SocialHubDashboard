// app/api/analytics/[videoId]/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { getHourlyMetrics, getDailyMetrics } from "@/lib/metrics";
import { ipFromHeaders, isRateLimitedKey, jsonNoStore } from "@/lib/security";
import { requireUser } from "@/lib/auth";

export async function GET(
  req: Request,
  context: { params: Promise<{ videoId: string }> }
) {
  try {
    // Données réservées : accessibles uniquement après authentification Kinde.
    try {
      await requireUser();
    } catch {
      return jsonNoStore({ error: "unauthorized" }, { status: 401 });
    }

    const ip = ipFromHeaders(req);
    if (isRateLimitedKey(`ana:${ip}`)) {
      return jsonNoStore({ error: "Too many requests" }, { status: 429 });
    }

    // ✅ UNWRAP params
    const { videoId } = await context.params;

    if (!videoId) {
      return jsonNoStore({ error: "Missing videoId" }, { status: 400 });
    }

    const url = new URL(req.url);
    const p = (url.searchParams.get("platform") || "youtube").toLowerCase();
    const platform =
      p === "tiktok" ? "tiktok" : p === "instagram" ? "instagram" : p === "facebook" ? "facebook" : "youtube";

    const isValid =
      platform === "youtube"
        ? /^[A-Za-z0-9_-]{11}$/.test(videoId)
        : /^\d{5,25}$/.test(videoId);

    if (!isValid) {
      return jsonNoStore(
        { error: `Invalid videoId for ${platform}` },
        { status: 400 }
      );
    }

    // ✅ CE LOG VA MAINTENANT S’AFFICHER
    console.log("[ANALYTICS]", { platform, videoId });

    const [hourly, daily] = await Promise.all([
      getHourlyMetrics(platform, videoId),
      getDailyMetrics(platform, videoId),
    ]);

    return jsonNoStore({ platform, videoId, hourly, daily });
  } catch (e: any) {
    return jsonNoStore({ error: String(e?.message ?? e) }, { status: 500 });
  }
}

