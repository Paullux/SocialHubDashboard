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
import { META_GRAPH, META_OAUTH_TOKEN } from "@/lib/meta/config";

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

  // Vérification anti-CSRF : le state doit correspondre au cookie posé par /start
  const cookieState = readStateFromCookie(req);
  if (!cookieState || !state || !timingSafeEqualStr(state, cookieState)) {
    return fail("Invalid OAuth state");
  }

  const client_id = process.env.META_APP_ID!;
  const client_secret = process.env.META_APP_SECRET!;
  const redirect_uri = process.env.META_REDIRECT_URI!;

  // 1) code -> token court
  const shortTokRes = await fetch(
    `${META_OAUTH_TOKEN}?` +
      new URLSearchParams({ client_id, client_secret, redirect_uri, code }),
    { cache: "no-store" }
  );
  if (!shortTokRes.ok) {
    return fail(`Failed short token: ${await shortTokRes.text()}`, shortTokRes.status);
  }
  const shortTok = await shortTokRes.json(); // {access_token, token_type, expires_in}

  // 2) token court -> token long (~60 jours)
  const longTokRes = await fetch(
    `${META_OAUTH_TOKEN}?` +
      new URLSearchParams({
        grant_type: "fb_exchange_token",
        client_id,
        client_secret,
        fb_exchange_token: String(shortTok.access_token),
      }),
    { cache: "no-store" }
  );
  if (!longTokRes.ok) {
    return fail(`Failed long token: ${await longTokRes.text()}`, longTokRes.status);
  }
  const longTok = await longTokRes.json(); // {access_token, token_type, expires_in?}
  const accessToken: string = longTok.access_token ?? shortTok.access_token;
  const expiresInSec: number | undefined =
    typeof longTok.expires_in === "number" ? longTok.expires_in : undefined;

  // 3) identifiant utilisateur Facebook (pour le callback de désautorisation)
  let fbUserId: string | undefined;
  try {
    const meRes = await fetch(
      `${META_GRAPH}/me?fields=id&access_token=${encodeURIComponent(accessToken)}`,
      { cache: "no-store" }
    );
    if (meRes.ok) fbUserId = (await meRes.json())?.id;
  } catch {
    /* non bloquant */
  }

  // 4) /me/accounts -> Page + instagram_business_account
  const pagesRes = await fetch(
    `${META_GRAPH}/me/accounts?` +
      new URLSearchParams({
        fields: "name,instagram_business_account",
        access_token: accessToken,
      }),
    { cache: "no-store" }
  );
  if (!pagesRes.ok) {
    return fail(`Failed pages: ${await pagesRes.text()}`, pagesRes.status);
  }
  const pagesJson = await pagesRes.json();
  const page =
    pagesJson?.data?.find((p: any) => p?.instagram_business_account?.id) ??
    pagesJson?.data?.[0];
  const igUserId: string | undefined = page?.instagram_business_account?.id;
  if (!igUserId) {
    return fail(
      "Aucune Page avec instagram_business_account. Vérifie que ton compte Instagram (Business/Creator) est bien lié à une Page Facebook."
    );
  }

  // 5) username Instagram (affichage)
  let username: string | undefined;
  try {
    const igUserRes = await fetch(
      `${META_GRAPH}/${igUserId}?fields=username&access_token=${encodeURIComponent(accessToken)}`,
      { cache: "no-store" }
    );
    if (igUserRes.ok) username = (await igUserRes.json())?.username;
  } catch {
    /* non bloquant */
  }

  // 6) persistance (token chiffré par upsertAccountLink)
  await upsertAccountLink({
    userId: user.id,
    provider: "instagram",
    externalUserId: igUserId,
    username: username ?? null,
    accessToken,
    refreshToken: null,
    scope: "instagram_basic instagram_manage_insights pages_show_list pages_read_engagement",
    expiresAtSec: expiresInSec,
    meta: { pageId: page?.id, pageName: page?.name, fbUserId },
  });

  const base = process.env.NEXT_PUBLIC_BASE_URL ?? new URL(req.url).origin;
  const res = NextResponse.redirect(`${base}/settings/linked-accounts?connected=instagram`);
  res.headers.append("Set-Cookie", stateCookieClear());
  return res;
}
