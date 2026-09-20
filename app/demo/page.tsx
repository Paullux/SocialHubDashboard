// app/demo/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import demoVideos, { DemoVideo } from "@/data/demo-videos";
import {
  VideoGrid,
  VideoCardSkeleton,
  PlatformFilter,
  SortButton,
} from "@/components/dashboard";
import type { PlatformFilterValue } from "@/components/dashboard";
import type { Platform, VideoItem } from "@/lib/types";
import { sortVideos, type SortKey, type SortDir } from "@/lib/videoSort";

export default function DemoPage() {
  const [videos, setVideos] = useState<VideoItem[] | null>(null);
  const [platform, setPlatform] = useState<PlatformFilterValue>("all");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  useEffect(() => {
    // simule un délai pour voir les skeletons
    const timer = setTimeout(() => {
      const normalized: VideoItem[] = demoVideos.map((d: DemoVideo) => ({
        id: d.id,
        title: d.title,
        description: d.description,       // 👈 affichée au survol de la carte
        platform: d.platform,            // "youtube" | "tiktok" | "instagram"
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

  const counts = useMemo<Record<Platform, number>>(() => {
    const c: Record<Platform, number> = { youtube: 0, tiktok: 0, instagram: 0 };
    for (const v of videos ?? []) c[v.platform] += 1;
    return c;
  }, [videos]);

  const filtered = useMemo(() => {
    if (!videos) return null;
    if (platform === "all") return videos;
    return videos.filter((v) => v.platform === platform);
  }, [videos, platform]);

  // Le tri « Partages » n'a de sens que si le lot affiché contient du TikTok.
  const hasTikTok = useMemo(
    () => (filtered ?? []).some((v) => v.platform === "tiktok"),
    [filtered]
  );

  const sorted = useMemo(() => {
    if (!filtered) return null;
    return sortVideos(filtered, sortKey, sortDir);
  }, [filtered, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const SORTS: { key: SortKey; label: string }[] = [
    { key: "date", label: "Date" },
    { key: "views", label: "Vues" },
    { key: "likes", label: "Likes" },
    { key: "comments", label: "Commentaires" },
    { key: "shares", label: "Partages (TikTok)" },
  ];

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <div className="rounded-2xl p-6 border border-neutral-800 bg-neutral-900/50 backdrop-blur">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-2">
          <h1 className="text-2xl font-semibold text-neutral-100">
            Démo (9 vidéos)
          </h1>

          {videos && (
            <div className="flex flex-wrap gap-2">
              {SORTS.map(({ key, label }) => (
                <SortButton
                  key={key}
                  label={label}
                  active={sortKey === key}
                  dir={sortKey === key ? sortDir : undefined}
                  onClick={() => toggleSort(key)}
                  disabled={key === "shares" && !hasTikTok}
                  title={
                    key === "shares" && !hasTikTok
                      ? "Aucune vidéo TikTok dans cette sélection"
                      : undefined
                  }
                />
              ))}
            </div>
          )}
        </div>
        {/* La mention remplace une note de développement qui affichait le
            chemin des fichiers de vignettes : sans intérêt pour un visiteur,
            et trompeuse sur une capture d'écran. Ce qu'il faut dire, c'est
            que les chiffres ne sont pas réels. */}
        <p className="mb-4 text-sm text-neutral-400">
          Données d’exemple : les vignettes et les statistiques affichées ici
          sont fictives. L’interface, elle, est identique à celle du tableau de
          bord.
        </p>

        {videos && (
          <div className="mb-6">
            <PlatformFilter
              value={platform}
              counts={counts}
              onChange={setPlatform}
            />
          </div>
        )}

        {!videos && (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <VideoCardSkeleton key={i} />
            ))}
          </ul>
        )}

        {sorted && sorted.length > 0 && <VideoGrid videos={sorted} demo />}

        {sorted && sorted.length === 0 && (
          <p className="text-sm text-neutral-500">
            Aucune vidéo pour cette plateforme.{" "}
            <button
              type="button"
              onClick={() => setPlatform("all")}
              className="underline hover:text-neutral-300"
            >
              Tout afficher
            </button>
          </p>
        )}
      </div>
    </main>
  );
}
