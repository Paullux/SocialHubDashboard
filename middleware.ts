// middleware.ts
import { withAuth } from "@kinde-oss/kinde-auth-nextjs/middleware";
import { NextRequest, NextResponse } from "next/server";

type KindeToken = { permissions?: string[] };

function baseSecurityHeaders() {
  return {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
  } as const;
}

// Notre handler “core” : génère le nonce + pose la CSP globale
async function coreMiddleware(req: NextRequest) {
  // Skip assets statiques pour gagner en perf
  const path = req.nextUrl.pathname;
  if (
    path.startsWith("/_next/static") ||
    path.startsWith("/_next/image") ||
    path.endsWith("/favicon.ico") ||
    /\.(svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$/.test(path)
  ) {
    return NextResponse.next();
  }

  const res = NextResponse.next();

  // Nonce par requête
  const buf = new Uint8Array(16);
  crypto.getRandomValues(buf);
  const nonce = Buffer.from(buf).toString("base64");

  // CSP stricte avec nonce + strict-dynamic
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

  // Pose les en-têtes
  res.headers.set("content-security-policy", csp);
  res.headers.set("x-nonce", nonce);

  const base = baseSecurityHeaders();
  for (const [k, v] of Object.entries(base)) res.headers.set(k, v);

  // Petit log propre
  console.log("→", req.method, path);
  return res;
}

// On enveloppe coreMiddleware avec withAuth, en ne “protégeant” que /dashboard/*
const authedMiddleware = withAuth(
  async function middleware(req: NextRequest) {
    // D’abord nos headers/csp globaux
    return coreMiddleware(req);
  },
  {
    loginPage: "/login",
    // Tous publics par défaut…
    publicPaths: ["/", "/login", "/api/(.*)", "/(?!dashboard)(.*)"],
    // … sauf /dashboard/* qui exige la permission
    isAuthorized: ({ token }: { token: KindeToken | null }) => {
      const perms = token?.permissions ?? [];
      return perms.includes("read:dashboard");
    },
  }
);

export default authedMiddleware;

// Middleware actif globalement (sauf assets)
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
