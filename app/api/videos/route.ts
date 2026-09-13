// app/api/videos/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import type { VideoItem } from "@/lib/types";
import { fetchYouTubeLatest } from "@/lib/fetchVideos";
import { getFreshTikTokAccessToken } from "@/lib/tiktok/perUser";
import { getAccountLink } from "@/lib/accountLinks";
import { fetchInstagramMedia } from "@/lib/meta/media.server";
import { ipFromHeaders, isRateLimitedKey, timingSafeEqualStr } from "@/lib/security";
import { attachThumbnailDimensions } from "@/lib/imageProbe.server";

/* ================== Types ================== */
type Notes = Record<string, unknown>;

interface TikTokVideo {
  id: string;
  title?: string;
  video_description?: string;
  duration?: number;
  cover_image_url?: string;
  share_url?: string;
  embed_link?: string;
  create_time?: number;
  like_count?: number;
  comment_count?: number;
  share_count?: number;
  view_count?: number;
}

interface TikTokResponse {
  data?: {
    has_more?: boolean;
    cursor?: number;
    videos?: TikTokVideo[];
  };
}

/* ================== Helper TikTok paginé ================== */
async function fetchTikTokPaged(
  access: string,
  target: number,
  debug: boolean,
  notes: Notes
): Promise<VideoItem[]> {
  const items: VideoItem[] = [];
  let cursor: number | undefined;
  const fields = [
    "id","title","video_description","duration","cover_image_url","share_url","embed_link",
    "create_time","like_count","comment_count","share_count","view_count",
  ].join(",");

  const dbg = {
    pages: 0,
    cursors: [] as Array<number | null>,
    last_status: 0,
    total_received: 0,
  };

  while (items.length < target) {
    const body: Record<string, unknown> = {
      max_count: Math.min(20, Math.max(0, target - items.length)),
    };
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

    dbg.pages += 1;
    dbg.last_status = r.status;

    if (!r.ok) {
      if (debug) {
        try { (notes as any).tiktok_error_body = await r.json(); } catch {}
      }
      break;
    }

    const data: TikTokResponse = await r.json();
    const list: TikTokVideo[] = data?.data?.videos ?? [];
    dbg.total_received += list.length;

    for (const v of list) {
      items.push({
        id: String(v.id),
        platform: "tiktok",
        title: v.title || v.video_description || "",
        description: v.video_description || "",
        url: v.share_url || "",
        thumbnail: v.cover_image_url || "",
        publishedAt: v.create_time ? new Date(v.create_time * 1000).toISOString() : new Date().toISOString(),
        viewCount: typeof v.view_count === "number" ? v.view_count : undefined,
        likeCount: typeof v.like_count === "number" ? v.like_count : undefined,
        commentCount: typeof v.comment_count === "number" ? v.comment_count : undefined,
        shareCount: typeof v.share_count === "number" ? v.share_count : undefined,
        embedLink: v.embed_link,
      });
      if (items.length >= target) break;
    }

    const hasMore: boolean = Boolean(data?.data?.has_more);
    cursor = data?.data?.cursor;
    dbg.cursors.push(cursor ?? null);
    if (!hasMore || cursor == null) break;
  }

  if (debug) (notes as any).tiktok_debug = dbg;
  return items;
}

/* ================== Route ================== */
export async function GET(req: Request) {
  const ip = ipFromHeaders(req);
  if (isRateLimitedKey(`videos:${ip}`)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Cache-Control": "no-store" } });
  }

  const url = new URL(req.url);
  const debug = url.searchParams.get("debug") === "1";
  const notes: Notes = {};

  try {
    const limitParam = url.searchParams.get("limit");
    const ytParam = url.searchParams.get("yt");
    const ttParam = url.searchParams.get("tt");
    const TOTAL_LIMIT = Math.min(Math.max(Number(limitParam ?? 60), 1), 200); // borne à 200

    // Utilisateur Kinde (une seule fois) : chaque plateforme n'est affichée que
    // si l'utilisateur a lié SON PROPRE compte → chacun ne voit que ses vidéos,
    // et la déconnexion masque les siennes (jamais celles d'un autre).
    let kuserId: string | null = null;
    try {
      kuserId = (await getKindeServerSession().getUser())?.id ?? null;
    } catch {
      /* pas de session */
    }

    // 🔒 Données réservées : session Kinde requise. Exception : appel interne du
    // cron (snapshot) qui présente ?key=CRON_SECRET.
    const cronKey = url.searchParams.get("key");
    const isCron =
      !!process.env.CRON_SECRET &&
      !!cronKey &&
      (await timingSafeEqualStr(cronKey, process.env.CRON_SECRET));
    if (!kuserId && !isCron) {
      return NextResponse.json(
        { error: "unauthorized" },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }

    // YouTube — chaque utilisateur voit SA propre chaîne (résolue via
    // channels?mine=true à la connexion et stockée dans AccountLink.meta),
    // jamais une chaîne fixe partagée par toute l'app.
    const ytKey = process.env.YT_API_KEY || "";
    let ytChannelId: string | null = null;
    if (kuserId) {
      try {
        const link = await getAccountLink(kuserId, "google-youtube");
        ytChannelId = (link?.meta as { channelId?: string } | null)?.channelId ?? null;
      } catch {
        /* ignore */
      }
    }
    const hasYTLink = Boolean(ytChannelId);

    // TikTok — jeton propre à l'utilisateur (AccountLink), comme Instagram ;
    // plus de singleton partagé.
    let tiktokAccess: string | null = null;
    if (kuserId) {
      try {
        tiktokAccess = await getFreshTikTokAccessToken(kuserId);
      } catch (e: unknown) {
        (notes as any).tiktok_token_error = String(e);
      }
    }

    let ytTarget: number;
    let ttTarget: number;
    if (ytParam !== null || ttParam !== null) {
      ytTarget = Math.max(Number(ytParam ?? 0) || 0, 0);
      ttTarget = Math.max(Number(ttParam ?? 0) || 0, 0);
      if (ytTarget + ttTarget > TOTAL_LIMIT) {
        const scale = TOTAL_LIMIT / Math.max(1, ytTarget + ttTarget);
        ytTarget = Math.floor(ytTarget * scale);
        ttTarget = TOTAL_LIMIT - ytTarget;
      }
    } else {
      if (tiktokAccess) {
        ytTarget = Math.ceil(TOTAL_LIMIT / 2);
        ttTarget = TOTAL_LIMIT - ytTarget;
      } else {
        ytTarget = TOTAL_LIMIT;
        ttTarget = 0;
      }
    }

    // Collecte YouTube
    let yt: VideoItem[] = [];
    if (ytKey && ytChannelId && ytTarget > 0) {
      try {
        yt = await fetchYouTubeLatest(ytKey, ytChannelId, ytTarget);
      } catch (e: unknown) {
        (notes as any).youtube_error = String(e);
      }
    } else if (!ytKey) {
      (notes as any).youtube = "missing key";
    } else if (!hasYTLink) {
      (notes as any).youtube = "not linked";
    }

    // Collecte TikTok
    let tt: VideoItem[] = [];
    if (tiktokAccess && ttTarget > 0) {
      try {
        tt = await fetchTikTokPaged(tiktokAccess, ttTarget, debug, notes);
      } catch (e: unknown) {
        (notes as any).tiktok_error = String(e);
      }
    }

    // Collecte Instagram si l'utilisateur Kinde a lié son compte
    let ig: VideoItem[] = [];
    try {
      if (kuserId) {
        const link = await getAccountLink(kuserId, "instagram");
        if (link?.accessToken) {
          ig = await fetchInstagramMedia(link.accessToken, TOTAL_LIMIT);
        }
      }
    } catch (e: unknown) {
      (notes as any).meta_error = String(e);
    }

    if (debug) {
      (notes as any).yt_count = yt.length;
      (notes as any).tt_count = tt.length;
      (notes as any).ig_count = ig.length;
    }

    const seen = new Set<string>();
    const videos = [...yt, ...tt, ...ig]
      .filter((v) => {
        const key = `${v.platform}:${v.id}`;
        if (!v.id || seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt))
      .slice(0, TOTAL_LIMIT);

    // TikTok/Instagram ne fournissent pas les dimensions de leur miniature :
    // on les sonde nous-mêmes (best-effort), uniquement sur la liste finale
    // déjà limitée. YouTube les a déjà (cf. fetchVideos.ts), donc ignoré ici.
    await attachThumbnailDimensions(videos);

    const res = NextResponse.json(debug ? { videos, count: videos.length, notes } : { videos });
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (e: unknown) {
    return NextResponse.json(
      debug ? { videos: [], error: String(e), notes } : { error: "Failed to fetch videos" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
