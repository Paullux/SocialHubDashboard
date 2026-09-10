// components/analytics/Matomo.tsx
"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { useConsent } from "@/components/consent/CookieConsentProvider";

const MATOMO_URL = (process.env.NEXT_PUBLIC_MATOMO_URL || "https://stats.social-hub.fr").replace(
  /\/+$/,
  "",
);
const MATOMO_SITE_ID = process.env.NEXT_PUBLIC_MATOMO_SITE_ID || "1";
// Conteneur Matomo Tag Manager (facultatif). Vide => non chargé.
const MATOMO_CONTAINER =
  process.env.NEXT_PUBLIC_MATOMO_CONTAINER ||
  "https://stats.social-hub.fr/js/container_MEycDz8y.js";

declare global {
  interface Window {
    _paq?: unknown[];
    _mtm?: Record<string, unknown>[];
  }
}

function paq(): unknown[] {
  if (typeof window === "undefined") return [];
  window._paq = window._paq || [];
  return window._paq;
}

/**
 * Charge Matomo (tracker + Tag Manager) uniquement après consentement
 * « mesure d'audience ». Les scripts sont injectés par du JS déjà exécuté par la
 * page : sous CSP `strict-dynamic` ils héritent de la confiance du bundle
 * applicatif (nonce), aucun nonce supplémentaire n'est requis.
 *
 * Le suivi des pages vues est piloté ici (fiable pour la navigation SPA). Si le
 * conteneur MTM déclenche aussi un tag « page vue », pense à le désactiver côté
 * interface Matomo pour éviter un double comptage.
 *
 * Retrait du consentement => Matomo oublie le consentement et supprime ses cookies.
 */
export default function Matomo() {
  const { consent, ready } = useConsent();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const injected = useRef(false);
  const trackingStarted = useRef(false);
  const lastUrl = useRef<string | null>(null);

  const enabled = ready && consent.analytics;

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Consentement retiré : purge côté Matomo.
    if (!enabled) {
      if (trackingStarted.current) {
        const _paq = paq();
        _paq.push(["forgetConsentGiven"]);
        _paq.push(["forgetCookieConsentGiven"]);
        _paq.push(["optUserOut"]);
        _paq.push(["deleteCookies"]);
        trackingStarted.current = false;
      }
      return;
    }

    const _paq = paq();

    // Injection unique des scripts Matomo.
    if (!injected.current) {
      _paq.push(["requireConsent"]);
      _paq.push(["requireCookieConsent"]);
      _paq.push(["enableLinkTracking"]);
      _paq.push(["setTrackerUrl", `${MATOMO_URL}/matomo.php`]);
      _paq.push(["setSiteId", MATOMO_SITE_ID]);
      appendScript(`${MATOMO_URL}/matomo.js`);

      // Matomo Tag Manager (facultatif).
      if (MATOMO_CONTAINER) {
        const _mtm = (window._mtm = window._mtm || []);
        _mtm.push({ "mtm.startTime": Date.now(), event: "mtm.Start" });
        appendScript(MATOMO_CONTAINER);
      }

      injected.current = true;
    }

    // Reprise du suivi après consentement.
    if (!trackingStarted.current) {
      _paq.push(["setConsentGiven"]);
      _paq.push(["setCookieConsentGiven"]);
      trackingStarted.current = true;
    }

    // Suivi de la page courante (une seule fois par URL).
    const query = searchParams?.toString();
    const url = pathname + (query ? `?${query}` : "");
    if (url !== lastUrl.current) {
      if (lastUrl.current !== null) {
        _paq.push(["setReferrerUrl", window.location.origin + lastUrl.current]);
      }
      _paq.push(["setCustomUrl", window.location.origin + url]);
      _paq.push(["setDocumentTitle", document.title]);
      _paq.push(["trackPageView"]);
      lastUrl.current = url;
    }
  }, [enabled, pathname, searchParams]);

  return null;
}

function appendScript(src: string) {
  if (document.querySelector(`script[src="${src}"]`)) return;
  const s = document.createElement("script");
  s.async = true;
  s.src = src;
  document.head.appendChild(s);
}
