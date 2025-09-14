// components/dashboard/VideoCardSkeleton.tsx
"use client";

export default function VideoCardSkeleton() {
  return (
    <li className="bg-neutral-800/70 backdrop-blur rounded-2xl overflow-hidden border border-neutral-700 shadow-sm flex flex-col">
      {/* Preview 16:9 (1280x720) */}
      <div className="relative aspect-[16/9] bg-neutral-600 animate-pulse" />

      {/* Infos */}
      <div className="flex flex-col flex-1">
        {/* Ligne tags + date */}
        <div className="p-2 sm:p-3 flex items-center gap-2">
          <span className="h-5 w-16 rounded-full bg-neutral-600 animate-pulse" />
          <span className="h-4 w-20 rounded bg-neutral-600 animate-pulse" />
        </div>

        {/* Titre (2 lignes) */}
        <div className="px-2 sm:px-3 pb-2 flex-1 space-y-2">
          <div className="h-4 w-5/6 rounded bg-neutral-600 animate-pulse" />
        </div>

        {/* Barre du bas (KPIs + bouton) */}
        <div className="bg-neutral-800/70 backdrop-blur mt-auto px-2 sm:px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-x-auto whitespace-nowrap pr-2">
            <span className="h-4 w-14 rounded bg-neutral-600 animate-pulse" />
            <span className="h-4 w-12 rounded bg-neutral-600 animate-pulse" />
            <span className="h-4 w-10 rounded bg-neutral-600 animate-pulse" />
          </div>
          <span className="h-6 w-16 rounded bg-neutral-600 animate-pulse shrink-0" />
        </div>
      </div>
    </li>
  );
}
