// components/dashboard/ConnectPanel.tsx
"use client";

import { useState } from "react";
import clsx from "clsx";
import { FaYoutube, FaTiktok, FaInstagram } from "react-icons/fa";
import type { Platform } from "@/lib/types";
import type { Lang } from "@/lib/uiLang";

/** Lien renvoyé par /api/linked-accounts (nom du provider côté base). */
export type LinkedAccount = { provider: string; username: string | null };

const PROVIDERS: {
  platform: Platform;
  provider: string;
  name: string;
  icon: JSX.Element;
  accent: string;
}[] = [
  {
    platform: "youtube",
    provider: "google-youtube",
    name: "YouTube",
    icon: <FaYoutube size={22} className="text-red-500" />,
    accent: "border-red-400/70 bg-red-600/20 hover:bg-red-600/30",
  },
  {
    platform: "tiktok",
    provider: "tiktok",
    name: "TikTok",
    icon: <FaTiktok size={20} className="text-white" />,
    accent: "border-cyan-300/70 bg-cyan-500/20 hover:bg-cyan-500/30",
  },
  {
    platform: "instagram",
    provider: "instagram",
    name: "Instagram",
    icon: <FaInstagram size={22} className="text-pink-500" />,
    accent: "border-fuchsia-400/70 bg-fuchsia-600/20 hover:bg-fuchsia-600/30",
  },
];

const T = {
  fr: {
    heroTitle: "Connecte ta première plateforme",
    heroText:
      "Social Hub Dashboard rassemble les statistiques de tes vidéos YouTube, TikTok et Instagram. Connecte au moins un compte pour les voir apparaître ici.",
    footerTitle: "Comptes connectés",
    reassure: "Accès en lecture seule. Tu peux te déconnecter à tout moment.",
    connect: (name: string) => `Connecter ${name}`,
    connected: "Connecté",
    disconnect: "Déconnecter",
    confirm: (name: string) => `Déconnecter ${name} ?`,
    yes: "Oui, déconnecter",
    cancel: "Annuler",
    pending: "Déconnexion…",
    failed: "La déconnexion a échoué, réessaie.",
  },
  en: {
    heroTitle: "Connect your first platform",
    heroText:
      "Social Hub Dashboard brings together the stats of your YouTube, TikTok and Instagram videos. Connect at least one account to see them here.",
    footerTitle: "Connected accounts",
    reassure: "Read-only access. You can disconnect at any time.",
    connect: (name: string) => `Connect ${name}`,
    connected: "Connected",
    disconnect: "Disconnect",
    confirm: (name: string) => `Disconnect ${name}?`,
    yes: "Yes, disconnect",
    cancel: "Cancel",
    pending: "Disconnecting…",
    failed: "Disconnecting failed, please try again.",
  },
} as const;

/**
 * Panneau de connexion des plateformes.
 * - `hero` : aucun compte lié, c'est tout le contenu du dashboard.
 * - `footer` : au moins un compte lié, affiché sous les vidéos pour gérer les liens.
 */
export default function ConnectPanel({
  links,
  variant,
  lang = "fr",
}: {
  links: LinkedAccount[];
  variant: "hero" | "footer";
  lang?: Lang;
}) {
  const t = T[lang];
  const [confirming, setConfirming] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  const byProvider = new Map(links.map((l) => [l.provider, l]));

  async function disconnect(provider: string) {
    setPending(provider);
    setFailed(false);
    try {
      // La route redirige vers /settings/linked-accounts : on ne suit pas la
      // redirection, on recharge le dashboard pour mettre à jour vidéos et navbar.
      const r = await fetch(
        `/api/oauth/disconnect?provider=${encodeURIComponent(provider)}`,
        { redirect: "manual", cache: "no-store" }
      );
      if (r.type !== "opaqueredirect" && !r.ok) throw new Error(`HTTP ${r.status}`);
      window.location.reload();
    } catch {
      setFailed(true);
      setPending(null);
      setConfirming(null);
    }
  }

  const hero = variant === "hero";

  return (
    <section
      className={clsx(
        "rounded-2xl border border-neutral-700 bg-neutral-900/60",
        hero ? "mx-auto mt-6 max-w-2xl p-6 sm:p-8 text-center" : "mt-12 mb-8 p-4 sm:p-6"
      )}
    >
      {hero ? (
        <>
          <h2 className="text-xl sm:text-2xl font-semibold">{t.heroTitle}</h2>
          <p className="mt-2 text-sm sm:text-base text-neutral-400">{t.heroText}</p>
        </>
      ) : (
        <h2 className="text-lg font-semibold">{t.footerTitle}</h2>
      )}

      <ul className={clsx("mt-5 grid gap-3", hero ? "grid-cols-1" : "grid-cols-1 md:grid-cols-3")}>
        {PROVIDERS.map((p) => {
          const link = byProvider.get(p.provider);

          if (!link) {
            return (
              <li key={p.provider}>
                <a
                  href={`/api/oauth/${p.provider}/start`}
                  className={clsx(
                    "flex h-full items-center justify-center gap-3 rounded-xl border px-4 py-3 font-medium text-white transition-colors",
                    p.accent
                  )}
                >
                  {p.icon}
                  {t.connect(p.name)}
                </a>
              </li>
            );
          }

          const isConfirming = confirming === p.provider;
          const isPending = pending === p.provider;

          return (
            <li
              key={p.provider}
              className="flex h-full flex-col gap-3 rounded-xl border border-green-600/60 bg-green-600/10 px-4 py-3 text-left"
            >
              <div className="flex items-center gap-3">
                {p.icon}
                <div className="min-w-0">
                  <div className="text-sm text-green-400">✓ {t.connected}</div>
                  <div className="truncate font-medium">{link.username ?? p.name}</div>
                </div>
              </div>

              {isConfirming || isPending ? (
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-neutral-300">{t.confirm(p.name)}</span>
                  <button
                    type="button"
                    onClick={() => void disconnect(p.provider)}
                    disabled={isPending}
                    className="rounded-lg border border-red-500/70 bg-red-600/20 px-3 py-1 hover:bg-red-600/30 disabled:opacity-50"
                  >
                    {isPending ? t.pending : t.yes}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirming(null)}
                    disabled={isPending}
                    className="rounded-lg border border-neutral-700 px-3 py-1 hover:bg-neutral-800 disabled:opacity-50"
                  >
                    {t.cancel}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirming(p.provider)}
                  className="self-start rounded-lg border border-neutral-700 px-3 py-1 text-sm text-neutral-300 hover:bg-neutral-800"
                >
                  {t.disconnect}
                </button>
              )}
            </li>
          );
        })}
      </ul>

      {failed && <p className="mt-3 text-sm text-red-400">{t.failed}</p>}
      <p className="mt-4 text-xs text-neutral-500">{t.reassure}</p>
    </section>
  );
}
