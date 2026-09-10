// components/consent/CookieBanner.tsx
"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useConsent } from "./CookieConsentProvider";
import { useUiLang, type Lang } from "@/lib/uiLang";
import LangToggle from "@/components/legal/LangToggle";

/* ------------------------------- i18n ------------------------------- */

const T = {
  fr: {
    bannerLabel: "Gestion des cookies",
    langLabel: "Langue",
    intro:
      "Social Hub utilise des cookies strictement nécessaires au fonctionnement du site (connexion sécurisée) et, avec votre accord, un outil de mesure d’audience (Matomo, hébergé par nos soins). Vous pouvez accepter, refuser ou choisir.",
    learnMore: "En savoir plus",
    customize: "Personnaliser",
    rejectAll: "Tout refuser",
    acceptAll: "Tout accepter",
    prefsTitle: "Préférences de cookies",
    prefsDesc:
      "Choisissez les traceurs que vous autorisez. Votre choix est conservé 6 mois et modifiable à tout moment via « Gérer les cookies » en bas de page.",
    necessaryTitle: "Strictement nécessaires",
    necessaryDesc:
      "Session de connexion (Kinde), sécurité, mémorisation de votre choix de cookies. Toujours actifs.",
    analyticsTitle: "Mesure d’audience",
    analyticsDesc:
      "Matomo (stats.social-hub.fr), hébergé par nos soins. Statistiques de visite anonymisées : pages vues, appareil approximatif, provenance. Aucune publicité, aucun partage à des tiers.",
    save: "Enregistrer mes choix",
  },
  en: {
    bannerLabel: "Cookie management",
    langLabel: "Language",
    intro:
      "Social Hub uses cookies that are strictly necessary for the site to work (secure sign-in) and, with your consent, an audience-measurement tool (Matomo, hosted by us). You can accept, reject or choose.",
    learnMore: "Learn more",
    customize: "Customize",
    rejectAll: "Reject all",
    acceptAll: "Accept all",
    prefsTitle: "Cookie preferences",
    prefsDesc:
      "Choose the trackers you allow. Your choice is kept for 6 months and can be changed at any time via “Manage cookies” at the bottom of the page.",
    necessaryTitle: "Strictly necessary",
    necessaryDesc:
      "Sign-in session (Kinde), security, remembering your cookie choice. Always on.",
    analyticsTitle: "Audience measurement",
    analyticsDesc:
      "Matomo (stats.social-hub.fr), hosted by us. Anonymized visit statistics: pages viewed, approximate device, referrer. No advertising, no sharing with third parties.",
    save: "Save my choices",
  },
} as const;

/* ------------------------------- racine ------------------------------- */

export default function CookieBanner() {
  const {
    ready,
    decided,
    preferencesOpen,
    openPreferences,
    closePreferences,
    acceptAll,
    rejectAll,
    save,
    consent,
  } = useConsent();
  const [lang, setLang] = useUiLang();

  const showBanner = ready && !decided && !preferencesOpen;

  return (
    <>
      {showBanner && (
        <BannerBar
          t={T[lang]}
          lang={lang}
          onLang={setLang}
          onAcceptAll={acceptAll}
          onRejectAll={rejectAll}
          onCustomize={openPreferences}
        />
      )}
      {preferencesOpen && (
        <PreferencesDialog
          t={T[lang]}
          lang={lang}
          onLang={setLang}
          initialAnalytics={consent.analytics}
          onClose={closePreferences}
          onAcceptAll={acceptAll}
          onRejectAll={rejectAll}
          onSave={(analytics) => save({ analytics })}
        />
      )}
    </>
  );
}

type Dict = (typeof T)[Lang];

/* ------------------------------- bandeau ------------------------------- */

function BannerBar({
  t,
  lang,
  onLang,
  onAcceptAll,
  onRejectAll,
  onCustomize,
}: {
  t: Dict;
  lang: Lang;
  onLang: (l: Lang) => void;
  onAcceptAll: () => void;
  onRejectAll: () => void;
  onCustomize: () => void;
}) {
  return (
    <div
      role="region"
      aria-label={t.bannerLabel}
      className="fixed inset-x-0 bottom-20 z-50 px-3 pb-2 sm:bottom-16 sm:px-4"
    >
      <div className="mx-auto max-w-4xl rounded-2xl border border-neutral-700 bg-neutral-900/95 p-4 shadow-soft backdrop-blur sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-relaxed text-neutral-300">
            {t.intro}{" "}
            <Link href="/privacy" className="font-medium text-brand underline hover:no-underline">
              {t.learnMore}
            </Link>
            .
          </p>
          <div className="flex flex-col gap-2 sm:shrink-0">
            <LangToggle
              lang={lang}
              onChange={onLang}
              label={t.langLabel}
              className="self-end sm:self-auto"
            />
            <div className="grid grid-cols-1 gap-2 sm:flex sm:items-center">
              <button
                type="button"
                onClick={onCustomize}
                className="rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-sm font-medium text-neutral-100 transition-colors hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-brand/70"
              >
                {t.customize}
              </button>
              <button
                type="button"
                onClick={onRejectAll}
                className="rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-sm font-medium text-neutral-100 transition-colors hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-brand/70"
              >
                {t.rejectAll}
              </button>
              <button
                type="button"
                onClick={onAcceptAll}
                className="rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand/70 focus:ring-offset-2 focus:ring-offset-neutral-900"
              >
                {t.acceptAll}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* --------------------------- panneau de choix --------------------------- */

function PreferencesDialog({
  t,
  lang,
  onLang,
  initialAnalytics,
  onClose,
  onAcceptAll,
  onRejectAll,
  onSave,
}: {
  t: Dict;
  lang: Lang;
  onLang: (l: Lang) => void;
  initialAnalytics: boolean;
  onClose: () => void;
  onAcceptAll: () => void;
  onRejectAll: () => void;
  onSave: (analytics: boolean) => void;
}) {
  const [analytics, setAnalytics] = useState(initialAnalytics);
  const titleId = useId();
  const descId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        tabIndex={-1}
        className="max-h-[90vh] w-full overflow-y-auto rounded-t-2xl border border-neutral-700 bg-neutral-900 p-5 shadow-soft outline-none sm:max-w-lg sm:rounded-2xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id={titleId} className="text-lg font-semibold text-neutral-100">
            {t.prefsTitle}
          </h2>
          <LangToggle lang={lang} onChange={onLang} label={t.langLabel} />
        </div>
        <p id={descId} className="mt-1 text-sm text-neutral-400">
          {t.prefsDesc}
        </p>

        <div className="mt-4 space-y-3">
          <CategoryRow
            title={t.necessaryTitle}
            description={t.necessaryDesc}
            checked
            disabled
          />
          <CategoryRow
            title={t.analyticsTitle}
            description={t.analyticsDesc}
            checked={analytics}
            onChange={setAnalytics}
          />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <button
            type="button"
            onClick={onRejectAll}
            className="rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-sm font-medium text-neutral-100 transition-colors hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-brand/70"
          >
            {t.rejectAll}
          </button>
          <button
            type="button"
            onClick={() => onSave(analytics)}
            className="rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-sm font-medium text-neutral-100 transition-colors hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-brand/70"
          >
            {t.save}
          </button>
          <button
            type="button"
            onClick={onAcceptAll}
            className="rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand/70 focus:ring-offset-2 focus:ring-offset-neutral-900"
          >
            {t.acceptAll}
          </button>
        </div>
      </div>
    </div>
  );
}

function CategoryRow({
  title,
  description,
  checked,
  disabled,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (v: boolean) => void;
}) {
  return (
    <label
      className={`flex items-start gap-3 rounded-xl border border-neutral-800 bg-neutral-800/50 p-3 ${
        disabled ? "opacity-70" : "cursor-pointer"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
        className="mt-1 h-4 w-4 shrink-0 accent-brand"
      />
      <span className="min-w-0">
        <span className="block text-sm font-medium text-neutral-100">{title}</span>
        <span className="mt-0.5 block text-xs leading-relaxed text-neutral-400">{description}</span>
      </span>
    </label>
  );
}
