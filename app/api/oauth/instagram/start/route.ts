// app/api/oauth/instagram/start/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { buildState, stateCookieSet } from "@/lib/security";
import { IG_LOGIN_OAUTH_AUTHORIZE, IG_LOGIN_SCOPE_PARAM } from "@/lib/meta/config";

export async function GET(req: Request) {
  const clientId = process.env.IG_LOGIN_APP_ID;
  const redirectUri = process.env.IG_LOGIN_REDIRECT_URI;
  if (!clientId || !redirectUri) {
    return NextResponse.json(
      {
        error: "instagram_oauth_not_configured",
        missing: { IG_LOGIN_APP_ID: !clientId, IG_LOGIN_REDIRECT_URI: !redirectUri },
      },
      { status: 500 }
    );
  }

  const state = buildState();

  // Instagram API with Instagram Login : OAuth classique, scope= (PAS config_id,
  // contrairement à l'ancien Facebook Login for Business).
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: IG_LOGIN_SCOPE_PARAM,
    state,
  });

  // ?reconnect=1 : force le ré-affichage de l'écran d'autorisation.
  if (new URL(req.url).searchParams.get("reconnect") === "1") {
    params.set("force_reauth", "true");
  }

  const res = NextResponse.redirect(`${IG_LOGIN_OAUTH_AUTHORIZE}?${params.toString()}`);
  res.headers.append("Set-Cookie", stateCookieSet(state));
  return res;
}
