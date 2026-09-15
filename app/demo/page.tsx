// app/demo/page.tsx
"use client";

import { useEffect, useState } from "react";
import demoVideos, { DemoVideo } from "@/data/demo-videos";
import { VideoGrid, VideoCardSkeleton } from "@/components/dashboard";
import type { VideoItem } from "@/lib/types";

export default function DemoPage() {
  const [videos, setVideos] = useState<VideoItem[] | null>(null);

  useEffect(() => {
    // simule un délai pour voir les skeletons
    const timer = setTimeout(() => {
      const normalized: VideoItem[] = demoVideos.map((d: DemoVideo) => ({
        id: d.id,
        title: d.title,
        description: d.description,       // 👈 affichée au survol de la carte
        platform: d.platform,            // "youtube" | "tiktok"
        url: "#",                        // pas d’URL dans la démo
        thumbnail: d.thumbnailUrl,       // 👈 mapping clé de la correction
        viewCount: d.views,              // 👈 mapping
        likeCount: d.likes,              // 👈 mapping
        commentCount: d.comments,        // 👈 mapping
        shareCount: d.platform === "tiktok" ? 0 : undefined,
        publishedAt: new Date().toISOString(), // pour l’affichage de date
      }));
      setVideos(normalized);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <div className="rounded-2xl p-6 border border-neutral-800 bg-neutral-900/50 backdrop-blur">
        <h1 className="text-2xl font-semibold mb-2 text-neutral-100">Démo (9 vidéos)</h1>
        <p className="mb-6 text-sm text-neutral-400">
          Miniatures depuis <code>/public/thumbs/1.jpg … 9.jpg</code>
        </p>

        {!videos && (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <VideoCardSkeleton key={i} />
            ))}
          </ul>
        )}

        {videos && <VideoGrid videos={videos} demo />}
      </div>
    </main>
  );
}
