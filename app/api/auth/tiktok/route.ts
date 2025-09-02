// app/api/auth/tiktok/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  const scopesEnv = process.env.TIKTOK_SCOPES || "user.info.basic,user.video.list";
  // normalise: accepte "a b" / "a,b" / "a, b"
  const scope = scopesEnv.split(/[,\s]+/).filter(Boolean).join(",");

  const p = new URLSearchParams({
    client_key: process.env.TIKTOK_CLIENT_KEY!,           // SANDBOX si tu testes
    response_type: "code",
    scope,                                                // ← virgules
    redirect_uri: process.env.TIKTOK_REDIRECT_URI!,       // https://social-hub.fr/api/auth/callback/tiktok
    state: "shub_" + Math.random().toString(36).slice(2),
  });

  return NextResponse.redirect(`https://www.tiktok.com/v2/auth/authorize/?${p.toString()}`);
}
