// proxy.ts
import { withAuth } from "@kinde-oss/kinde-auth-nextjs/middleware";
import { NextRequest, NextResponse } from "next/server";

type KindeToken = {
  permissions?: string[];
};

// 🔓 Chemins publics (aucune auth requise)
const PUBLIC_PATHS = [
  "/", "/login", "/terms", "/privacy", "/demo", "/delete-data",
  // OAuth providers (start + callback)
  "/api/oauth/google-youtube/start",
  "/api/oauth/google-youtube/callback",
  "/api/oauth/tiktok/start",
  "/api/oauth/tiktok/callback",
  "/api/oauth/instagram/start",
  "/api/oauth/instagram/callback",
  "/api/oauth/disconnect",
  // Health and misc
  "/api/health", "/favicon.ico"
];

// 🛡️ Autorisation fine par route (simple et lisible)
function hasPerm(token: KindeToken | null, perm: string) {
  return (token?.permissions ?? []).includes(perm);
}

// Base security headers
function setBaseSecurityHeaders(res: NextResponse) {
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
}

// Generate CSP nonce
function genNonce() {
  const buf = new Uint8Array(16);
  crypto.getRandomValues(buf);
  return Buffer.from(buf).toString("base64");
}

// Core proxy for CSP
async function coreProxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

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

  // Origine de l'instance Matomo auto-hébergée (mesure d'audience, chargée sur
  // consentement). Sous 'strict-dynamic' l'hôte est ignoré par les navigateurs
  // récents mais reste utile pour les autres.
  const MATOMO_ORIGIN = "https://stats.social-hub.fr";

  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' ${MATOMO_ORIGIN}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' https: data:",
    "font-src 'self' https: data:",
    `connect-src 'self' https: ${MATOMO_ORIGIN}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");

  res.headers.set("Content-Security-Policy", csp);
  res.headers.set("x-nonce", nonce);
  setBaseSecurityHeaders(res);

  return res;
}

// Main proxy
export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Apply auth + CSP for dashboard, analytics and settings/* pages
  if (
    path.startsWith("/dashboard") ||
    path.startsWith("/analytics") ||
    path.startsWith("/settings/linked-accounts")
  ) {

    const handler = withAuth(
      async (r: NextRequest) => coreProxy(r),
      {
        loginPage: "/login",
        publicPaths: PUBLIC_PATHS,
        isAuthorized: ({ token, req }: { token: KindeToken | null; req: NextRequest }) => {
          const p = req.nextUrl.pathname;

          // Public (handled by PUBLIC_PATHS already)
          if (PUBLIC_PATHS.includes(p)) return true;

          // Dashboard + analytics need read:dashboard
          if (p.startsWith("/dashboard")) return hasPerm(token, "read:dashboard");
          if (p.startsWith("/analytics")) return hasPerm(token, "read:dashboard");

          // Linked accounts can use same permission or a dedicated one
          if (p.startsWith("/settings/linked-accounts")) return hasPerm(token, "read:dashboard");

          // Default deny
          return false;
        },
      }
    ) as unknown as (r: NextRequest) => Promise<NextResponse>;

    return handler(req);
  }

  // Everything else → only CSP
  return coreProxy(req);
}

// Matcher for proxy
export const config = {
  matcher: [
    // Protect dashboard, analytics and settings UI
    "/dashboard/:path*",
    "/analytics/:path*",
    "/settings/linked-accounts/:path*",
    // OAuth providers are public
    "/api/oauth/:path*",
    // Public pages (CSP applied here too)
    "/", "/login", "/terms", "/privacy", "/demo", "/demo/:path*", "/delete-data",
  ],
};
