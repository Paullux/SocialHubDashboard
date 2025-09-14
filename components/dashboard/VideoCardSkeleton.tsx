// components/dashboard/VideoCardSkeleton.tsx
"use client";

export default function VideoCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-neutral-800 bg-neutral-900/60 backdrop-blur overflow-hidden shadow-sm">
      {/* miniature */}
      <div className="aspect-video bg-neutral-800" />

      {/* texte */}
      <div className="p-3 space-y-2">
        <div className="h-4 w-3/4 rounded bg-neutral-800" />
        <div className="h-3 w-1/2 rounded bg-neutral-800" />
      </div>
    </div>
  );
}
