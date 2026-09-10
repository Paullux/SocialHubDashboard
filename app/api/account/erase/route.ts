// app/api/account/erase/route.ts
// Effacement en self-service demandé par l'utilisateur depuis « Comptes liés » :
//   1. déconnecte toutes les plateformes (AccountLink + OAuthToken TikTok « me ») ;
//   2. supprime de la base l'historique de métriques (VideoMetric) des vidéos
//      rattachées aux comptes que l'utilisateur avait connectés.
// Garde-fou : le corps JSON doit contenir { confirm: "tout effacer" }.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import crypto from "node:crypto";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fetchYouTubeLatest } from "@/lib/fetchVideos";
import { getAccountLink } from "@/lib/accountLinks";
import { fetchInstagramMedia, fetchFacebookVideos } from "@/lib/meta/media.server";
import { ensureFreshToken } from "@/lib/tiktok/auth.server";
import { getTikTokToken, saveTikTokToken } from "@/lib/tiktok/store";
import { jsonNoStore } from "@/lib/security";
import type { VideoItem } from "@/lib/types";

/** Phrase de confirmation attendue (insensible à la casse / aux espaces autour). */
const CONFIRM_PHRASE = "tout effacer";

export async function POST(req: Request) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return jsonNoStore({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as { confirm?: unknown } | null;
  const confirm =
    typeof body?.confirm === "string" ? body.confirm.trim().toLowerCase() : "";
  if (confirm !== CONFIRM_PHRASE) {
    return jsonNoStore(
      { error: "confirmation_mismatch", expected: CONFIRM_PHRASE },
      { status: 400 }
    );
  }

  // 1) Rassembler les vidéos de l'utilisateur AVANT de supprimer les jetons.
  //    Best-effort : une plateforme en échec n'empêche pas la suite.
  const byPlatform = new Map<string, Set<string>>();
  let partial = false;
  const push = (items: VideoItem[]) => {
    for (const v of items) {
      if (!v?.id || !v?.platform) continue;
      const set = byPlatform.get(v.platform) ?? new Set<string>();
      set.add(String(v.id));
      byPlatform.set(v.platform, set);
    }
  };

  // YouTube — liste publique via clé API, uniquement si le compte est lié.
  try {
    const ytLink = await getAccountLink(user.id, "google-youtube");
    const ytKey = process.env.YT_API_KEY || "";
    const ytChan = process.env.YT_CHANNEL_ID || "";
    if (ytLink && ytKey && ytChan) push(await fetchYouTubeLatest(ytKey, ytChan, 200));
  } catch (e) {
    partial = true;
    console.error("[account/erase] youtube list failed", e);
  }

  // TikTok — via le jeton stocké (table OAuthToken « me »).
  try {
    const tik = await getAccountLink(user.id, "tiktok");
    if (tik) {
      const access = await ensureFreshToken(getTikTokToken, saveTikTokToken);
      if (access) push(await fetchTikTokList(access));
    }
  } catch (e) {
    partial = true;
    console.error("[account/erase] tiktok list failed", e);
  }

  // Instagram + vidéos de Page Facebook.
  try {
    const link = await getAccountLink(user.id, "instagram");
    if (link?.accessToken) {
      const igId = String(link.meta?.igUserId || link.externalUserId || "");
      const pageId = String(link.meta?.pageId || "");
      const [ig, fb] = await Promise.all([
        igId ? fetchInstagramMedia(link.accessToken, igId, 200) : Promise.resolve([]),
        pageId
          ? fetchFacebookVideos(link.accessToken, pageId, 200).catch(() => [])
          : Promise.resolve([]),
      ]);
      push(ig);
      push(fb);
    }
  } catch (e) {
    partial = true;
    console.error("[account/erase] meta list failed", e);
  }

  // 2) Supprimer l'historique de métriques pour ces vidéos.
  let deletedMetrics = 0;
  for (const [platform, ids] of byPlatform) {
    if (ids.size === 0) continue;
    const { count } = await prisma.videoMetric.deleteMany({
      where: { platform, videoId: { in: [...ids] } },
    });
    deletedMetrics += count;
  }

  // 3) Supprimer tous les comptes liés de l'utilisateur.
  const hadTikTok = Boolean(await getAccountLink(user.id, "tiktok"));
  const { count: deletedLinks } = await prisma.accountLink.deleteMany({
    where: { userId: user.id },
  });

  // 4) TikTok : purger aussi le jeton partagé (table OAuthToken « me »),
  //    comme le fait /api/oauth/disconnect?provider=tiktok.
  if (hadTikTok) {
    await prisma.oAuthToken
      .delete({ where: { provider_userId: { provider: "tiktok", userId: "me" } } })
      .catch(() => {});
  }

  const code = crypto.randomUUID();
  console.log(
    "[account/erase] user=%s links=%d metrics=%d partial=%s code=%s",
    user.id,
    deletedLinks,
    deletedMetrics,
    partial,
    code
  );

  return jsonNoStore({
    ok: true,
    code,
    deletedLinks,
    deletedMetrics,
    metricsScope: partial ? "partial" : "complete",
  });
}

/* --------------------------- Helper TikTok --------------------------- */
// Reprend l'appel video/list de /api/videos (helper non exporté là-bas),
// borné à ~200 vidéos, en ne gardant que les identifiants.
async function fetchTikTokList(access: string): Promise<VideoItem[]> {
  const fields = ["id", "create_time"].join(",");
  const out: VideoItem[] = [];
  let cursor: number | undefined;

  while (out.length < 200) {
    const body: Record<string, unknown> = { max_count: 20 };
    if (cursor != null) body.cursor = cursor;

    const r = await fetch(
      `https://open.tiktokapis.com/v2/video/list/?fields=${encodeURIComponent(fields)}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${access}`,
          "Content-Type": "application/json",
          Accept: "application/json",
          "User-Agent": "social-hub/1.0",
        },
        body: JSON.stringify(body),
        cache: "no-store",
      }
    );
    if (!r.ok) break;

    const data = (await r.json()) as {
      data?: {
        videos?: Array<{ id?: string | number }>;
        has_more?: boolean;
        cursor?: number;
      };
    };
    const list = data?.data?.videos ?? [];
    for (const v of list) {
      if (v?.id != null) {
        out.push({
          id: String(v.id),
          platform: "tiktok",
          title: "",
          url: "",
          thumbnail: "",
          publishedAt: new Date().toISOString(),
        });
      }
    }
    if (!data?.data?.has_more || data?.data?.cursor == null) break;
    cursor = data.data.cursor;
  }
  return out;
}
