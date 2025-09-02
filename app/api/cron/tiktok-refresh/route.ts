// app/api/cron/tiktok-refresh/route.ts
export const runtime = "nodejs";

import { ensureFreshToken } from "@/lib/tiktok/auth.server";

export async function GET() {
  const getToken = async () => /* read from DB */ null as any;
  const saveToken = async (_t:any)=>{/* write to DB */};
  try {
    await ensureFreshToken(getToken, saveToken);
    return Response.json({ ok: true });
  } catch (e:any) {
    return Response.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
