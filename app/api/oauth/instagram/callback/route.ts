// app/api/oauth/instagram/callback/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { upsertAccountLink } from "@/lib/accountLinks";
import {
  ipFromHeaders,
  isRateLimitedKey,
  readStateFromCookie,
  stateCookieClear,
  timingSafeEqualStr,
} from "@/lib/security";
import { IG_LOGIN_GRAPH } from "@/lib/meta/config";
import {
  exchangeCodeForShortLivedToken,
  exchangeForLongLivedToken,
} from "@/lib/meta/auth.server";

function fail(msg: string, status = 400) {
  const res = new NextResponse(msg, { status });
  res.headers.append("Set-Cookie", stateCookieClear());
  return res;
}

export async function GET(req: Request) {
  const ip = ipFromHeaders(req);
  if (isRateLimitedKey(`ig-oauth:${ip}`)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const user = await requireUser();
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const state = searchParams.get("state");
  if (error) return fail(`OAuth error: ${error}`);
  if (!code) return fail("Missing ?code");

  // Anti-CSRF
  const cookieState = readStateFromCookie(req);
  if (!cookieState || !state || !timingSafeEqualStr(state, cookieState)) {
    return fail("Invalid OAuth state");
  }

  const redirectUri = process.env.IG_LOGIN_REDIRECT_URI!;

  // 1) code -> token court (~1h) + IGSID (id Instagram scoped à cette app)
  const shortTok = await exchangeCodeForShortLivedToken(code, redirectUri);
  if (!shortTok?.access_token) {
    return fail("Failed to exchange code for short-lived token");
  }

  // 2) token court -> token long (~60 jours)
  const longTok = await exchangeForLongLivedToken(shortTok.access_token);
  const accessToken = longTok?.access_token ?? shortTok.access_token;
  const expiresInSec = longTok?.expires_in;

  // 3) profil (username, type de compte) — best-effort, non bloquant
  let username: string | undefined;
  let accountType: string | undefined;
  try {
    const r = await fetch(
      `${IG_LOGIN_GRAPH}/me?fields=id,username,account_type&access_token=${encodeURIComponent(accessToken)}`,
      { cache: "no-store" }
    );
    if (r.ok) {
      const me = await r.json();
      username = me?.username;
      accountType = me?.account_type;
    }
  } catch {
    /* non bloquant */
  }

  // 4) persistance (token utilisateur long, chiffré par upsertAccountLink).
  await upsertAccountLink({
    userId: user.id,
    provider: "instagram",
    externalUserId: shortTok.user_id,
    username: username ?? null,
    accessToken,
    refreshToken: null,
    scope: "instagram_business_basic instagram_business_manage_insights",
    expiresAtSec: expiresInSec,
    meta: { igUserId: shortTok.user_id, accountType },
  });

  const base = process.env.NEXT_PUBLIC_BASE_URL ?? new URL(req.url).origin;
  const res = NextResponse.redirect(
    `${base}/settings/linked-accounts?connected=instagram`
  );
  res.headers.append("Set-Cookie", stateCookieClear());
  return res;
}
