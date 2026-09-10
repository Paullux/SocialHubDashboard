// lib/consent.ts
// Gestion du consentement RGPD (cookies / traceurs).
// Source de vérité : un cookie first-party `sh_consent` (lisible côté client
// et serveur) + un miroir localStorage pour réagir vite au chargement.

export const CONSENT_COOKIE = "sh_consent";
export const CONSENT_VERSION = 1;
// Durée de conservation du choix : 6 mois (recommandation CNIL).
export const CONSENT_MAX_AGE = 60 * 60 * 24 * 182;
// Événement émis quand le consentement change (écouté par les loaders de scripts).
export const CONSENT_EVENT = "sh:consent-change";

/** Catégories de traceurs. Les cookies essentiels ne sont pas listés :
 *  ils sont strictement nécessaires et ne se refusent pas. */
export type ConsentCategory = "analytics";

export type ConsentState = {
  v: number;
  /** Mesure d'audience (Matomo). */
  analytics: boolean;
  /** Timestamp ISO de la décision. */
  ts: string;
};

export const DEFAULT_CONSENT: ConsentState = {
  v: CONSENT_VERSION,
  analytics: false,
  ts: "",
};

export function isDecided(state: ConsentState | null): state is ConsentState {
  return !!state && state.v === CONSENT_VERSION && typeof state.ts === "string" && state.ts.length > 0;
}

/** Parse tolérant d'une valeur de cookie/stockage. */
export function parseConsent(raw: string | null | undefined): ConsentState | null {
  if (!raw) return null;
  try {
    const obj = JSON.parse(raw) as Partial<ConsentState>;
    if (typeof obj !== "object" || obj === null) return null;
    return {
      v: typeof obj.v === "number" ? obj.v : 0,
      analytics: obj.analytics === true,
      ts: typeof obj.ts === "string" ? obj.ts : "",
    };
  } catch {
    return null;
  }
}

export function serializeConsent(state: ConsentState): string {
  return JSON.stringify(state);
}

/* ------------------------------- côté client ------------------------------- */

export function readConsentClient(): ConsentState | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp(`(?:^|; )${CONSENT_COOKIE}=([^;]*)`));
  if (m) {
    const fromCookie = parseConsent(decodeURIComponent(m[1]));
    if (fromCookie) return fromCookie;
  }
  try {
    return parseConsent(window.localStorage.getItem(CONSENT_COOKIE));
  } catch {
    return null;
  }
}

export function writeConsentClient(state: ConsentState): void {
  if (typeof document === "undefined") return;
  const value = encodeURIComponent(serializeConsent(state));
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${CONSENT_COOKIE}=${value}; Path=/; Max-Age=${CONSENT_MAX_AGE}; SameSite=Lax${secure}`;
  try {
    window.localStorage.setItem(CONSENT_COOKIE, serializeConsent(state));
  } catch {
    /* stockage indisponible : le cookie suffit */
  }
  window.dispatchEvent(new CustomEvent<ConsentState>(CONSENT_EVENT, { detail: state }));
}

/* ------------------------------- côté serveur ------------------------------ */

/** À utiliser dans un Server Component / route : parseConsent(cookies().get(CONSENT_COOKIE)?.value). */
export function readConsentFromCookieValue(value: string | undefined): ConsentState | null {
  return parseConsent(value);
}
