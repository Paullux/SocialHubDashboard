// app/api/oauth/tiktok/start/route.ts
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { randomBytes, createHash } from "crypto";
import { requireDashboardUser } from "@/lib/auth";

const b64url = (b: Buffer) => b.toString("base64").replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/g,"");
const ALLOWED = [
  "http://localhost:3000/api/oauth/tiktok/callback",
  "https://social-hub.fr/api/oauth/tiktok/callback",
];

export async function GET(req: Request) {
  try {
    await requireDashboardUser();
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let redirect = (process.env.TIKTOK_REDIRECT_URI || "").trim();
  // anti-quotes
  if (redirect.startsWith('"') || redirect.endsWith('"') || redirect.startsWith("'") || redirect.endsWith("'")) {
    return NextResponse.json({ error: "redirect_uri_has_quotes", redirect }, { status: 500 });
  }
  if (!ALLOWED.includes(redirect)) {
    return NextResponse.json({ error: "redirect_uri_not_allowed", redirect, allowed: ALLOWED }, { status: 500 });
  }

  const state = randomBytes(16).toString("hex");
  const verifier = b64url(randomBytes(48));
  const challenge = b64url(createHash("sha256").update(verifier).digest());

  const params = new URLSearchParams({
    client_key: process.env.TIKTOK_CLIENT_KEY!,
    response_type: "code",
    scope: "user.info.basic,video.list",
    redirect_uri: redirect,                 // ✅ l’exacte valeur whitelistée
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
  });

  if (new URL(req.url).searchParams.get("dryrun") === "1") {
    return NextResponse.json({ authUrl: `https://www.tiktok.com/v2/auth/authorize/?${params}`, redirect_uri: redirect });
  }

  const res = NextResponse.redirect(`https://www.tiktok.com/v2/auth/authorize/?${params}`);
  res.cookies.set("tiktok_pkce", JSON.stringify({ state, verifier }), {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 600,
  });
  return res;
}
