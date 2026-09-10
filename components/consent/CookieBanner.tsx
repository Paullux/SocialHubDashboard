// components/consent/CookieBanner.tsx
"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useConsent } from "./CookieConsentProvider";

export default function CookieBanner() {
  const { ready, decided, preferencesOpen, openPreferences, closePreferences, acceptAll, rejectAll, save, consent } =
    useConsent();

  const showBanner = ready && !decided && !preferencesOpen;

  return (
    <>
      {showBanner && (
        <BannerBar
          onAcceptAll={acceptAll}
          onRejectAll={rejectAll}
          onCustomize={openPreferences}
        />
      )}
      {preferencesOpen && (
        <PreferencesDialog
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

/* ------------------------------- bandeau ------------------------------- */

function BannerBar({
  onAcceptAll,
  onRejectAll,
  onCustomize,
}: {
  onAcceptAll: () => void;
  onRejectAll: () => void;
  onCustomize: () => void;
}) {
  return (
    <div
      role="region"
      aria-label="Gestion des cookies"
      className="fixed inset-x-0 bottom-20 z-50 px-3 pb-2 sm:bottom-16 sm:px-4"
    >
      <div className="mx-auto max-w-4xl rounded-2xl border border-neutral-700 bg-neutral-900/95 p-4 shadow-soft backdrop-blur sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-relaxed text-neutral-300">
            Social Hub utilise des cookies strictement nécessaires au fonctionnement du site
            (connexion sécurisée) et, avec votre accord, un outil de mesure d’audience
            (Matomo, hébergé par nos soins). Vous pouvez accepter, refuser ou choisir.{" "}
            <Link href="/privacy" className="font-medium text-brand underline hover:no-underline">
              En savoir plus
            </Link>
            .
          </p>
          <div className="grid grid-cols-1 gap-2 sm:flex sm:shrink-0 sm:items-center">
            <button
              type="button"
              onClick={onCustomize}
              className="rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-sm font-medium text-neutral-100 transition-colors hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-brand/70"
            >
              Personnaliser
            </button>
            <button
              type="button"
              onClick={onRejectAll}
              className="rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-sm font-medium text-neutral-100 transition-colors hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-brand/70"
            >
              Tout refuser
            </button>
            <button
              type="button"
              onClick={onAcceptAll}
              className="rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand/70 focus:ring-offset-2 focus:ring-offset-neutral-900"
            >
              Tout accepter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* --------------------------- panneau de choix --------------------------- */

function PreferencesDialog({
  initialAnalytics,
  onClose,
  onAcceptAll,
  onRejectAll,
  onSave,
}: {
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
        <h2 id={titleId} className="text-lg font-semibold text-neutral-100">
          Préférences de cookies
        </h2>
        <p id={descId} className="mt-1 text-sm text-neutral-400">
          Choisissez les traceurs que vous autorisez. Votre choix est conservé 6 mois et
          modifiable à tout moment via « Gérer les cookies » en bas de page.
        </p>

        <div className="mt-4 space-y-3">
          <CategoryRow
            title="Strictement nécessaires"
            description="Session de connexion (Kinde), sécurité, mémorisation de votre choix de cookies. Toujours actifs."
            checked
            disabled
          />
          <CategoryRow
            title="Mesure d’audience"
            description="Matomo (stats.social-hub.fr), hébergé par nos soins. Statistiques de visite anonymisées : pages vues, appareil approximatif, provenance. Aucune publicité, aucun partage à des tiers."
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
            Tout refuser
          </button>
          <button
            type="button"
            onClick={() => onSave(analytics)}
            className="rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-sm font-medium text-neutral-100 transition-colors hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-brand/70"
          >
            Enregistrer mes choix
          </button>
          <button
            type="button"
            onClick={onAcceptAll}
            className="rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand/70 focus:ring-offset-2 focus:ring-offset-neutral-900"
          >
            Tout accepter
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
