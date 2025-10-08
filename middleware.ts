// middleware.ts
import { withAuth } from "@kinde-oss/kinde-auth-nextjs/middleware";
import { NextRequest, NextResponse } from "next/server";

type KindeToken = { permissions?: string[] };

function setBaseSecurityHeaders(res: NextResponse) {
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
}

function genNonce() {
  const buf = new Uint8Array(16);
  crypto.getRandomValues(buf);
  return Buffer.from(buf).toString("base64");
}

// ⚙️ CSP globale (toujours exécutée)
async function coreMiddleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip assets (on laisse Next/Vercel servir)
  if (
    pathname.startsWith("/_next/static") ||
    pathname.startsWith("/_next/image") ||
    pathname.endsWith("/favicon.ico") ||
    /\.(svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  const res = NextResponse.next();
  const nonce = genNonce();

  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' https: data:",
    "font-src 'self' https: data:",
    "connect-src 'self' https:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");

  res.headers.set("Content-Security-Policy", csp);
  res.headers.set("x-nonce", nonce);
  setBaseSecurityHeaders(res);

  return res;
}

// 🛡️ Enveloppe auth Kinde (uniquement quand on est sur /dashboard)
const authed = withAuth(
  async function authWrapper(req: NextRequest) {
    // Important: appliquer quand même la CSP ici (sinon perte de headers sur /dashboard)
    return coreMiddleware(req);
  },
  {
    loginPage: "/login",
    isAuthorized: ({ token }: { token: KindeToken | null }) =>
      (token?.permissions ?? []).includes("read:dashboard"),
  }
);

// ✅ Point d’entrée unique
export default async function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/dashboard")) {
    // Routes protégées → passe par Kinde (qui applique coreMiddleware à l’intérieur)
    return authed(req);
  }
  // Tout le reste → CSP globale sans auth
  return coreMiddleware(req);
}

// ✅ Matcher simple et compatible Next 15
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
