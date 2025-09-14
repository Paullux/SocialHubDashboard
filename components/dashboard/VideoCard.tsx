// components/dashboard/VideoCard.tsx
"use client";

import Link from "next/link";
import FormatDate from "@/components/FormatDate";
import type { VideoItem } from "@/lib/types";
import KpiLine from "./KpiLine";

export default function VideoCard({ video: v }: { video: VideoItem }) {
  return (
    <li className="bg-neutral-800/70 backdrop-blur rounded-2xl overflow-hidden border border-neutral-700 shadow-sm hover:shadow transition flex flex-col">
      {/* Preview */}
      <a
        href={v.url || "#"}
        target="_blank"
        rel="noreferrer"
        title={v.title}
        className="block"
      >
        <div className="aspect-video bg-neutral-100 overflow-hidden">
          {v.thumbnail ? (
            <img
              src={v.thumbnail}
              alt={v.title}
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
            aria-label={`Ouvrir les stats pour ${v.title}`}
            title="Stats"
          >
            <span aria-hidden>📈</span>
            <span className="hidden sm:inline">Stats</span>
          </Link>
        </div>
      </div>
    </li>
  );
}
