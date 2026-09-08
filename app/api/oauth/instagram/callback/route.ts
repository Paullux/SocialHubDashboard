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

/** Premier target_id présent pour l'un des scopes donnés (Facebook Login for Business). */
function targetFromGranular(
  granular: Array<{ scope: string; target_ids?: string[] }> | undefined,
  scopes: string[]
): string | undefined {
  for (const s of scopes) {
    const g = granular?.find((x) => x.scope === s);
    if (g?.target_ids?.length) return g.target_ids[0];
  }
  return undefined;
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
  const shortTok = await shortTokRes.json();

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
  const longTok = await longTokRes.json();
  const accessToken: string = longTok.access_token ?? shortTok.access_token;
  const expiresInSec: number | undefined =
    typeof longTok.expires_in === "number" ? longTok.expires_in : undefined;

  const at = encodeURIComponent(accessToken);

  // 3) debug_token : les tokens Facebook Login for Business ne peuplent PAS
  //    /me/accounts. Les actifs accordés sont dans granular_scopes.
  const appToken = `${client_id}|${client_secret}`;
  const dbg = await fetch(
    `${META_GRAPH}/debug_token?input_token=${at}&access_token=${encodeURIComponent(appToken)}`,
    { cache: "no-store" }
  )
    .then((r) => r.json())
    .catch(() => null);
  const tokenData = dbg?.data ?? {};
  const granular: Array<{ scope: string; target_ids?: string[] }> =
    tokenData?.granular_scopes ?? [];
  const fbUserId: string | undefined = tokenData?.user_id;

  const igUserId = targetFromGranular(granular, [
    "instagram_basic",
    "instagram_manage_insights",
  ]);
  const pageId = targetFromGranular(granular, [
    "pages_show_list",
    "pages_read_engagement",
  ]);

  if (!igUserId) {
    const grab = async (path: string) => {
      try {
        const r = await fetch(
          `${META_GRAPH}/${path}${path.includes("?") ? "&" : "?"}access_token=${at}`,
          { cache: "no-store" }
        );
        return await r.json();
      } catch (e) {
        return { fetch_error: String(e) };
      }
    };
    const [me, perms, accounts] = await Promise.all([
      grab("me?fields=id,name"),
      grab("me/permissions"),
      grab("me/accounts?fields=id,name,instagram_business_account"),
    ]);
    const res = NextResponse.json(
      {
        error: "no_instagram_asset_granted",
        hint:
          "Aucun compte Instagram accordé. Sur l'écran d'autorisation, coche 'Modifier les paramètres' puis sélectionne ta Page ET ton compte Instagram.",
        granular_scopes: granular,
        token: tokenData,
        me,
        permissions: perms?.data,
        me_accounts_raw: accounts,
      },
      { status: 400 }
    );
    res.headers.append("Set-Cookie", stateCookieClear());
    return res;
  }

  // 4) username Instagram (affichage) + confirmation du lien Page
  let username: string | undefined;
  try {
    const r = await fetch(
      `${META_GRAPH}/${igUserId}?fields=username&access_token=${at}`,
      { cache: "no-store" }
    );
    if (r.ok) username = (await r.json())?.username;
  } catch {
    /* non bloquant */
  }

  let pageName: string | undefined;
  if (pageId) {
    try {
      const r = await fetch(
        `${META_GRAPH}/${pageId}?fields=name&access_token=${at}`,
        { cache: "no-store" }
      );
      if (r.ok) pageName = (await r.json())?.name;
    } catch {
      /* non bloquant */
    }
  }

  // 5) persistance (token utilisateur long, chiffré par upsertAccountLink).
  //    Les appels IG media/insights se font avec ce token ; le token de Page
  //    (pour les vidéos FB) sera dérivé à la demande.
  await upsertAccountLink({
    userId: user.id,
    provider: "instagram",
    externalUserId: igUserId,
    username: username ?? null,
    accessToken,
    refreshToken: null,
    scope: "instagram_basic instagram_manage_insights pages_show_list pages_read_engagement",
    expiresAtSec: expiresInSec,
    meta: { igUserId, pageId, pageName, fbUserId },
  });

  const base = process.env.NEXT_PUBLIC_BASE_URL ?? new URL(req.url).origin;
  const res = NextResponse.redirect(
    `${base}/settings/linked-accounts?connected=instagram`
  );
  res.headers.append("Set-Cookie", stateCookieClear());
  return res;
}
