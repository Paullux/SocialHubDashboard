// app/api/tiktok/diagnostic/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { ensureFreshToken } from "@/lib/tiktok/auth.server";
import { getTikTokToken, saveTikTokToken } from "@/lib/tiktok/store";
import { ipFromHeaders, isRateLimitedKey } from "@/lib/security";

const ALLOW = process.env.ALLOW_TIKTOK_DEBUG === "1";

export async function GET(req: Request) {
  if (!ALLOW) {
    return NextResponse.json({ ok: false, error: "Debug disabled" }, { status: 403 });
  }

  const ip = ipFromHeaders(req);
  if (isRateLimitedKey(`ttdiag:${ip}`)) {
    return NextResponse.json({ ok: false, error: "Too many requests" }, { status: 429, headers: { "Cache-Control": "no-store" } });
  }

  try {
    const access = await ensureFreshToken(getTikTokToken, saveTikTokToken);

    const [uRes, vRes] = await Promise.all([
      fetch("https://open.tiktokapis.com/v2/user/info/", {
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
