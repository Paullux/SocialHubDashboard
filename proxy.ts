// proxy.ts
import { withAuth } from "@kinde-oss/kinde-auth-nextjs/middleware";
import { NextRequest, NextResponse } from "next/server";

type KindeToken = {
  permissions?: string[];
};

// 🔓 Chemins publics (aucune auth requise). N'a d'effet que pour les chemins
// qui entrent aussi dans le withAuth() ci-dessous (/dashboard, /analytics,
// /settings/linked-accounts) — les routes listées ici ne matchent jamais ce
// préfixe, donc ce tableau ne les rend pas publiques : leur protection réelle
// est faite route par route via requireDashboardUser() (lib/auth.ts). Seuls
// /api/oauth/disconnect, /api/meta/deauthorize (HMAC Meta) et
// /api/cron/snapshot (CRON_SECRET) échappent à Kinde pour des raisons
// structurelles — voir lib/auth.ts et les handlers correspondants.
const PUBLIC_PATHS = [
  "/", "/login", "/terms", "/privacy", "/demo", "/delete-data",
  // OAuth providers (start + callback) : reachables sans session au niveau du
  // proxy, mais désormais gardés par requireDashboardUser() dans chaque route.
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

  // Fast Refresh de Next évalue du code à la volée (react-refresh-utils), ce que
  // 'unsafe-eval' seul autorise. On ne l'ouvre QUE hors production : en prod la
  // directive reste stricte (nonce + strict-dynamic, sans eval).
  const DEV_EVAL = process.env.NODE_ENV === "production" ? "" : " 'unsafe-eval'";

  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${DEV_EVAL} ${MATOMO_ORIGIN}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' https: data:",
    "font-src 'self' https: data:",
    `connect-src 'self' https:${DEV_EVAL ? " ws:" : ""} ${MATOMO_ORIGIN}`,
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
    path.startsWith("/settings/linked-accounts") ||
    // Routes API : refus par défaut. Avant, le middleware ne filtrait que les
    // pages — une nouvelle route sous /api était donc publique tant que son
    // auteur n'y mettait pas lui-même une garde. Désormais l'inverse, sauf pour
    // les chemins qui s'authentifient autrement (voir isPublicApi).
    (path.startsWith("/api/") && !isPublicApi(path))
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

          // Toute autre route /api : une session suffit ici, la route elle-même
          // vérifie ensuite la permission via requireDashboardUser().
          if (p.startsWith("/api/")) return !!token;

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
/**
 * Chemins /api joignables sans session Kinde. Chacun porte sa propre
 * authentification : handler Kinde lui-même (sans quoi la connexion boucle),
 * flux OAuth gardés par requireDashboardUser() dans le corps de la route,
 * CRON_SECRET comparé en timing-safe, ou signature HMAC de Meta.
 */
function isPublicApi(path: string): boolean {
  return (
    path.startsWith("/api/auth/") ||        // handler Kinde (login, callback, logout…)
    path.startsWith("/api/oauth/") ||       // start / callback / disconnect
    path === "/api/cron/snapshot" ||        // CRON_SECRET
    path === "/api/meta/deauthorize" ||     // signed_request HMAC
    path === "/api/videos"                  // session OU clé de cron, tranché dans la route
  );
}

// Matcher for proxy
export const config = {
  matcher: [
    // Protect dashboard, analytics and settings UI
    "/dashboard/:path*",
    "/analytics/:path*",
    "/settings/linked-accounts/:path*",
    // Toutes les routes API passent par le middleware (refus par défaut)
    "/api/:path*",
    // Public pages (CSP applied here too)
    "/", "/login", "/terms", "/privacy", "/demo", "/demo/:path*", "/delete-data",
  ],
};
