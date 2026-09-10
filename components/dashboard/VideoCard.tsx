// components/dashboard/VideoCard.tsx
"use client";

import Link from "next/link";
import FormatDate from "@/components/FormatDate";
import type { VideoItem } from "@/lib/types";
import KpiLine from "./KpiLine";

/** Normalise les fins de ligne (CRLF / CR isolé → LF) et resserre les lignes
 *  vides multiples. TikTok renvoie souvent des `\r` seuls dans `video_description`. */
function normalizeText(s?: string | null): string {
  return (s ?? "")
    .replace(/\r\n?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export default function VideoCard({ video: v }: { video: VideoItem }) {
  const title = normalizeText(v.title);
  const description = normalizeText(v.description);
  const showDesc = Boolean(description && description !== title);
  // Inutile d'afficher l'infobulle si elle ne ferait que répéter un titre court
  // déjà visible sous la carte.
  const hasTip = showDesc || title.length > 70 || title.includes("\n");

  return (
    <li className="group relative bg-neutral-800/70 backdrop-blur rounded-2xl overflow-hidden border border-neutral-700 shadow-sm hover:shadow transition flex flex-col">
      {/* Preview */}
      <a
        href={v.url || "#"}
        target="_blank"
        rel="noreferrer"
        aria-label={title || "Ouvrir la vidéo"}
        className="block"
      >
        <div className="aspect-video bg-neutral-100 overflow-hidden">
          {v.thumbnail ? (
            <img
              src={v.thumbnail}
              alt={title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-neutral-400 text-sm">
              (Pas d’aperçu)
            </div>
          )}
        </div>
      </a>

      {/* Infos */}
      <div className="flex flex-col flex-1">
        <div className="p-2 sm:p-3 flex items-center gap-2 text-[11px] sm:text-xs text-neutral-300">
          <span className="uppercase tracking-wide rounded-full border border-neutral-500 px-1.5 py-0.5">
            {v.platform}
          </span>
          {v.publishedAt && <FormatDate iso={v.publishedAt} />}
        </div>

        <div className="px-2 sm:px-3 pb-2 flex-1">
          <h3 className="font-medium text-sm sm:text-base line-clamp-2 text-neutral-100">
            {v.title}
          </h3>
        </div>

        <div className="bg-neutral-800/70 backdrop-blur mt-auto px-2 sm:px-3 py-2 flex items-center justify-between text-neutral-100">
          <div className="overflow-x-auto whitespace-nowrap pr-2">
            <KpiLine v={v} />
          </div>

          <Link
            href={`/analytics/${v.id}?platform=${v.platform}`}
            className="ml-2 text-[11px] sm:text-xs px-2 py-1 rounded bg-neutral-700 hover:bg-neutral-600 flex items-center gap-1 shrink-0"
            aria-label={`Ouvrir les stats pour ${title}`}
            title="Stats"
          >
            <span aria-hidden>📈</span>
            <span className="hidden sm:inline">Stats</span>
          </Link>
        </div>
      </div>

      {/* Infobulle au survol : titre + description (fins de ligne préservées). */}
      {hasTip && (
        <div
          role="tooltip"
          className="pointer-events-none absolute inset-x-1.5 top-1.5 z-30 max-h-[calc(100%-0.75rem)] overflow-hidden rounded-xl border border-white/10 bg-neutral-950/90 p-3 text-left opacity-0 shadow-xl ring-1 ring-black/30 backdrop-blur-lg transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
        >
          {title && (
            <p className="text-sm font-semibold leading-snug text-neutral-50">
              {title}
            </p>
          )}
          {showDesc && (
            <p className="mt-1.5 line-clamp-[14] whitespace-pre-line text-xs leading-relaxed text-neutral-200">
              {description}
            </p>
          )}
        </div>
      )}
    </li>
  );
}
