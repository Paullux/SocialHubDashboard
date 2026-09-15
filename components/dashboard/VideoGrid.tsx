// components/dashboard/VideoGrid.tsx
"use client";

import type { VideoItem } from "@/lib/types";
import VideoCard from "./VideoCard";

export default function VideoGrid({
  videos,
  demo = false,
}: {
  videos: VideoItem[];
  /** Vidéos factices (page /demo) : pas d'ID réel, donc pas de lien vers les stats détaillées. */
  demo?: boolean;
}) {
  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
      {videos.map((v) => (
        <VideoCard key={`${v.platform}:${v.id}`} video={v} demo={demo} />
      ))}
    </ul>
  );
}
