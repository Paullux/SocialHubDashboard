// app/api/tiktok/diagnostic/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getFreshTikTokAccessToken } from "@/lib/tiktok/perUser";
import { ipFromHeaders, isRateLimitedKey } from "@/lib/security";
import { requireDashboardUser } from "@/lib/auth";

const ALLOW = process.env.ALLOW_TIKTOK_DEBUG === "1";

export async function GET(req: Request) {
  if (!ALLOW) {
    return NextResponse.json({ ok: false, error: "Debug disabled" }, { status: 403 });
  }

  let kindeUser;
  try {
    kindeUser = await requireDashboardUser();
  } catch {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const ip = ipFromHeaders(req);
  if (isRateLimitedKey(`ttdiag:${ip}`)) {
    return NextResponse.json({ ok: false, error: "Too many requests" }, { status: 429, headers: { "Cache-Control": "no-store" } });
  }

  try {
    // Jeton propre à l'utilisateur connecté (AccountLink), jamais un jeton
    // partagé — ce diagnostic ne doit voir que le compte TikTok de la
    // personne qui appelle la route.
    const access = await getFreshTikTokAccessToken(kindeUser.id);
    if (!access) {
      return NextResponse.json(
        { ok: false, error: "no_tiktok_account_linked" },
        { status: 404, headers: { "Cache-Control": "no-store" } }
      );
    }

    const [uRes, vRes] = await Promise.all([
      fetch("https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name", {
        headers: { Authorization: `Bearer ${access}` },
        cache: "no-store",
      }),
      fetch("https://open.tiktokapis.com/v2/video/list/?count=10", {
        headers: { Authorization: `Bearer ${access}` },
        cache: "no-store",
      }),
    ]);

    const user = await uRes.json().catch(() => ({}));
    const videosJson = await vRes.json().catch(() => ({}));
    const videos = videosJson?.data?.videos ?? [];

    console.log(
      "[TikTok][DIAG] user_ok=%s video_ok=%s video_count=%d sample_ids=%j",
      String(uRes.ok),
      String(vRes.ok),
      videos.length,
      videos.slice(0, 3).map((v: any) => v?.id)
    );

    return NextResponse.json({
      ok: true,
      summary: {
        user_ok: uRes.ok,
        video_ok: vRes.ok,
        video_count: videos.length,
      },
      user: {
        open_id: user?.data?.user?.open_id ?? user?.open_id,
        display_name: user?.data?.user?.display_name ?? user?.display_name,
      },
      videos_preview: videos.slice(0, 3).map((v: any) => ({
        id: v.id,
        title: v.title || v.video_description,
        created: v.create_time,
        share_url: v.share_url,
      })),
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (e: any) {
    console.error("[TikTok][DIAG][ERROR]", e);
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
