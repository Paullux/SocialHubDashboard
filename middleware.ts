// middleware.ts
import { withAuth } from "@kinde-oss/kinde-auth-nextjs/middleware";
import { NextRequest, NextResponse } from "next/server";

type KindeToken = {
  permissions?: string[];
};

// 🔓 Chemins publics (aucune auth requise)
const PUBLIC_PATHS = [
  "/", "/login",
  // OAuth providers (start + callback)
  "/api/oauth/google-youtube/start",
  "/api/oauth/google-youtube/callback",
  "/api/oauth/tiktok/start",
  "/api/oauth/tiktok/callback",
  "/api/oauth/instagram/start",
  "/api/oauth/instagram/callback",
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

// Core middleware for CSP
async function coreMiddleware(req: NextRequest) {
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

// Main middleware
export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Apply auth + CSP for dashboard and settings/* pages
  if (path.startsWith("/dashboard") || path.startsWith("/settings/linked-accounts")) {

    const handler = withAuth(
      async (r: NextRequest) => coreMiddleware(r),
      {
        loginPage: "/login",
        publicPaths: PUBLIC_PATHS,
        isAuthorized: ({ token, req }: { token: KindeToken | null; req: NextRequest }) => {
          const p = req.nextUrl.pathname;

          // Public (handled by PUBLIC_PATHS already)
          if (PUBLIC_PATHS.includes(p)) return true;

          // Dashboard needs read:dashboard
          if (p.startsWith("/dashboard")) return hasPerm(token, "read:dashboard");

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
  return coreMiddleware(req);
}

// Matcher for middleware
export const config = {
  matcher: [
    // Protect dashboard and settings UI
    "/dashboard/:path*",
    "/settings/linked-accounts/:path*",
    // OAuth providers are public
    "/api/oauth/:path*",
    // Allow other public asset paths
    "/", "/login",
  ],
};
