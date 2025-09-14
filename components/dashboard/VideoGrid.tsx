// components/dashboard/VideoGrid.tsx
"use client";

import type { VideoItem } from "@/lib/types";
import VideoCard from "./VideoCard";

export default function VideoGrid({ videos }: { videos: VideoItem[] }) {
  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
      {videos.map((v) => (
        <VideoCard key={`${v.platform}:${v.id}`} video={v} />
      ))}
    </ul>
  );
}
