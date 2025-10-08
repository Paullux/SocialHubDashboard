// lib/security.ts
export function ipFromHeaders(req: Request): string {
  const h = (k: string) => req.headers.get(k) ?? "";
  const chain = h("x-forwarded-for") || h("cf-connecting-ip") || h("x-real-ip");
  return chain.split(",")[0].trim() || "unknown";
}

const buckets = new Map<string, { ts: number; count: number }>();
const WINDOW = 60; // s
const MAX = 60; // requêtes / minute / IP
export function isRateLimitedKey(key: string) {
  const now = Math.floor(Date.now() / 1000);
  const b = buckets.get(key) ?? { ts: now, count: 0 };
  if (now - b.ts >= WINDOW) { b.ts = now; b.count = 0; }
  b.count++;
  buckets.set(key, b);
  return b.count > MAX;
}

export function jsonNoStore(body: any, init?: ResponseInit) {
  const r = Response.json(body, init);
  r.headers.set("Cache-Control", "no-store");
  r.headers.set("Pragma", "no-cache");
  r.headers.set("Expires", "0");
  return r;
}

export function timingSafeEqualStr(a?: string|null, b?: string|null) {
  if (!a || !b) return false;
  try {
    const ua = new TextEncoder().encode(a);
    const ub = new TextEncoder().encode(b);
    if (ua.length !== ub.length) return false;
    // @ts-ignore
    return crypto.subtle && crypto.subtle.timingSafeEqual
      ? (crypto as any).subtle.timingSafeEqual(ua, ub)
      : (() => {
          // Fallback XOR
          let out = 0;
          for (let i=0; i<ua.length; i++) out |= ua[i] ^ ub[i];
          return out === 0;
        })();
  } catch { return false; }
}

// ---- OAuth state cookie helpers ----
const STATE_COOKIE = "oauth_state";
const COOKIE_BASE = "HttpOnly; Path=/; SameSite=Lax";
export function buildState(): string {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Buffer.from(arr).toString("base64url");
}
export function stateCookieSet(state: string) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${STATE_COOKIE}=${state}; Max-Age=600; ${COOKIE_BASE}${secure}`;
}
export function stateCookieClear() {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${STATE_COOKIE}=; Max-Age=0; ${COOKIE_BASE}${secure}`;
}
export function readStateFromCookie(req: Request) {
  const cookie = req.headers.get("cookie") || "";
  const m = cookie.match(new RegExp(`${STATE_COOKIE}=([^;]+)`));
  return m?.[1] ?? null;
}
