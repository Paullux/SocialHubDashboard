// components/dashboard/PlatformFilter.tsx
"use client";

import clsx from "clsx";
import type { Platform } from "@/lib/types";
import type { Lang } from "@/lib/uiLang";

export type PlatformFilterValue = Platform | "all";

const NAMES: Record<Platform, string> = {
  youtube: "YouTube",
  tiktok: "TikTok",
  instagram: "Instagram",
};

const T = {
  fr: {
    all: "Toutes",
    group: "Filtrer par plateforme",
    heading: "Plateforme",
    none: (name: string) => `Aucune vidéo ${name} dans ce lot`,
    showAll: "Afficher toutes les plateformes",
    show: (name: string) => `Afficher ${name}`,
  },
  en: {
    all: "All",
    group: "Filter by platform",
    heading: "Platform",
    none: (name: string) => `No ${name} videos in this batch`,
    showAll: "Show all platforms",
    show: (name: string) => `Show ${name}`,
  },
} as const;

/** Couleur d'accent par plateforme, reprise des badges de `VideoCard`. */
const ACCENT: Record<PlatformFilterValue, string> = {
  all: "border-neutral-200 bg-neutral-900",
  youtube: "border-red-400/70 bg-red-600/20",
  tiktok: "border-cyan-300/70 bg-cyan-500/20",
  instagram: "border-fuchsia-400/70 bg-fuchsia-600/20",
};

export default function PlatformFilter({
  value,
  counts,
  onChange,
  pending = false,
  lang = "fr",
}: {
  value: PlatformFilterValue;
  /** Nombre de vidéos par plateforme dans le lot chargé. */
  counts: Record<Platform, number>;
  onChange: (next: PlatformFilterValue) => void;
  /** Lot pas encore chargé : les compteurs valent tous 0 sans que ça veuille
   *  dire « aucune vidéo ». On affiche un tiret et on ne désactive rien, sinon
   *  la barre donne l'impression d'un compte vide pendant le chargement. */
  pending?: boolean;
  lang?: Lang;
}) {
  const t = T[lang];
  const label = (key: PlatformFilterValue) => (key === "all" ? t.all : NAMES[key]);
  const options: { key: PlatformFilterValue; n: number }[] = [
    { key: "all", n: counts.youtube + counts.tiktok + counts.instagram },
    { key: "youtube", n: counts.youtube },
    { key: "tiktok", n: counts.tiktok },
    { key: "instagram", n: counts.instagram },
  ];

  return (
    <div
      role="group"
      aria-label={t.group}
      className="flex flex-wrap items-center gap-1.5 sm:gap-2"
    >
      <span className="text-xs uppercase tracking-wide text-neutral-400 mr-0.5">
        {t.heading}
      </span>

      {options.map(({ key, n }) => {
        const active = value === key;
        // Une plateforme absente du lot n'est pas cliquable : filtrer dessus
        // n'afficherait qu'une grille vide. Pendant le chargement, on ne sait
        // pas encore : on laisse tout actif.
        const disabled = !pending && key !== "all" && n === 0;

        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            disabled={disabled}
            aria-pressed={active}
            title={
              disabled
                ? t.none(label(key))
                : key === "all"
                  ? t.showAll
                  : t.show(label(key))
            }
            className={clsx(
              "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-sm text-white transition",
              active
                ? clsx("shadow-sm", ACCENT[key])
                : "border-neutral-600 bg-neutral-700 hover:bg-neutral-600",
              disabled && "opacity-40 cursor-not-allowed hover:bg-neutral-700"
            )}
          >
            {label(key)}
            <span
              aria-hidden
              className={clsx(
                "rounded px-1 text-[11px] tabular-nums",
                active ? "bg-black/30" : "bg-black/25 text-neutral-300"
              )}
            >
              {pending ? "–" : n}
            </span>
          </button>
        );
      })}
    </div>
  );
}
