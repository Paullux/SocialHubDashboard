// app/api/oauth/instagram/start/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { buildState, stateCookieSet } from "@/lib/security";
import { META_OAUTH_DIALOG, META_SCOPE_PARAM } from "@/lib/meta/config";

export async function GET(req: Request) {
  const clientId = process.env.META_APP_ID;
  const redirectUri = process.env.META_REDIRECT_URI;
  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { error: "meta_oauth_not_configured", missing: { META_APP_ID: !clientId, META_REDIRECT_URI: !redirectUri } },
      { status: 500 }
    );
  }

  const state = buildState();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: META_SCOPE_PARAM,
    state,
  });

  // ?reconnect=1 force le ré-affichage de l'écran d'autorisation
  if (new URL(req.url).searchParams.get("reconnect") === "1") {
    params.set("auth_type", "reauthorize");
  }

  const res = NextResponse.redirect(`${META_OAUTH_DIALOG}?${params.toString()}`);
  res.headers.append("Set-Cookie", stateCookieSet(state));
  return res;
}
