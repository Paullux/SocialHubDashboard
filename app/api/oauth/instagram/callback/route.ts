// app/api/oauth/instagram/callback/route.ts
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { upsertAccountLink } from "@/lib/accountLinks";

const META_OAUTH = "https://graph.facebook.com/v19.0/oauth/access_token";
const META_GRAPH = "https://graph.facebook.com/v19.0";

function badReq(msg: string, status = 400) {
  return new NextResponse(msg, { status });
}

export async function GET(req: Request) {
  const user = await requireUser();
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  if (error) return badReq(`OAuth error: ${error}`);
  if (!code) return badReq("Missing ?code");

  // 1) code -> short-lived token
  const shortTokRes = await fetch(
    `${META_OAUTH}?` +
      new URLSearchParams({
        client_id: process.env.META_APP_ID!,
        client_secret: process.env.META_APP_SECRET!,
        redirect_uri: process.env.META_REDIRECT_URI!,
        code,
      }),
    { cache: "no-store" }
  );
  if (!shortTokRes.ok) {
    const t = await shortTokRes.text();
    return badReq(`Failed short token: ${t}`, shortTokRes.status);
  }
  const shortTok = await shortTokRes.json(); // {access_token, token_type, expires_in}

  // 2) short -> long-lived (≈60 jours)
  const longTokRes = await fetch(
    `${META_OAUTH}?` +
      new URLSearchParams({
        grant_type: "fb_exchange_token",
        client_id: process.env.META_APP_ID!,
        client_secret: process.env.META_APP_SECRET!,
        fb_exchange_token: String(shortTok.access_token),
      }),
    { cache: "no-store" }
  );
  if (!longTokRes.ok) {
    const t = await longTokRes.text();
    return badReq(`Failed long token: ${t}`, longTokRes.status);
  }
  const longTok = await longTokRes.json(); // {access_token, token_type, expires_in?}
  const accessToken: string = longTok.access_token ?? shortTok.access_token;

  // 3) /me/accounts -> récupérer la page et l'ig_user_id
  const pagesRes = await fetch(
    `${META_GRAPH}/me/accounts?` +
      new URLSearchParams({
        fields: "name,instagram_business_account",
        access_token: accessToken,
      }),
    { cache: "no-store" }
  );
  if (!pagesRes.ok) {
    const t = await pagesRes.text();
    return badReq(`Failed pages: ${t}`, pagesRes.status);
  }
  const pagesJson = await pagesRes.json();
  const page =
    pagesJson?.data?.find((p: any) => p?.instagram_business_account?.id) ??
    pagesJson?.data?.[0];
  const igUserId: string | undefined = page?.instagram_business_account?.id;
  if (!igUserId) {
    return badReq(
      "Aucune Page avec instagram_business_account trouvée. Vérifie que ton IG est bien lié à une Page Facebook."
    );
  }

  // 4) /IG_USER_ID?fields=username
  const igUserRes = await fetch(
    `${META_GRAPH}/${igUserId}?fields=username&access_token=${encodeURIComponent(
      accessToken
    )}`,
    { cache: "no-store" }
  );
  if (!igUserRes.ok) {
    const t = await igUserRes.text();
    return badReq(`Failed ig user: ${t}`, igUserRes.status);
  }
  const igUser = await igUserRes.json();
  const username: string | undefined = igUser?.username;

  // (optionnel) durée d'expiration : Meta ne renvoie pas toujours expires_in pour long-lived
  // on enregistre sans "expiresAt", et on mettra en place un job de refresh mensuel.

  // 5) Persist AccountLink
  await upsertAccountLink({
    userId: user.id,
    provider: "instagram",
    externalUserId: igUserId,
    username: username ?? null,
    accessToken,
    refreshToken: null,
    scope: "pages_show_list instagram_basic instagram_manage_insights",
    // expiresAtSec: longTok.expires_in ?? undefined,
    meta: { pageId: page?.id, pageName: page?.name },
  });

  // 6) Redirige vers ta page “Comptes liés”
  const base = process.env.NEXT_PUBLIC_BASE_URL!;
  return NextResponse.redirect(
    `${base}/settings/linked-accounts?connected=instagram`
  );
}
