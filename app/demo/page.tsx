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
import { useUiLang } from "@/lib/uiLang";
import LangToggle from "@/components/legal/LangToggle";

const T = {
  fr: {
    title: "Démo (9 vidéos)",
    sorts: { date: "Date", views: "Vues", likes: "Likes", comments: "Commentaires", shares: "Partages (TikTok)" },
    noTikTok: "Aucune vidéo TikTok dans cette sélection",
    notice:
      "Données d’exemple : les vignettes et les statistiques affichées ici sont fictives. L’interface, elle, est identique à celle du tableau de bord. Clique sur une vignette pour voir le détail des stats.",
    empty: "Aucune vidéo pour cette plateforme.",
    showAll: "Tout afficher",
    langLabel: "Langue de la page",
  },
  en: {
    title: "Demo (9 videos)",
    sorts: { date: "Date", views: "Views", likes: "Likes", comments: "Comments", shares: "Shares (TikTok)" },
    noTikTok: "No TikTok videos in this selection",
    notice:
      "Sample data: the thumbnails and statistics shown here are fictional. The interface itself is identical to the real dashboard. Click a thumbnail to see the detailed stats.",
    empty: "No videos for this platform.",
    showAll: "Show all",
    langLabel: "Page language",
  },
} as const;

const SORT_KEYS: SortKey[] = ["date", "views", "likes", "comments", "shares"];

export default function DemoPage() {
  const [platform, setPlatform] = useState<PlatformFilterValue>("all");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [lang, setLang] = useUiLang();
  const t = T[lang];

  // simule un délai pour voir les skeletons
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 800);
    return () => clearTimeout(timer);
  }, []);

  // Dérivé de la langue : la changer ne relance pas le faux chargement.
  const videos = useMemo<VideoItem[] | null>(() => {
    if (!ready) return null;
    return demoVideos.map((d: DemoVideo) => ({
      id: d.id,
      title: (lang === "en" && d.en?.title) || d.title,
      description: (lang === "en" && d.en?.description) || d.description, // affichée au survol de la carte
      platform: d.platform,
      url: "", // pas d’URL : la vignette mène aux stats
      thumbnail: d.thumbnailUrl,
      viewCount: d.views,
      likeCount: d.likes,
      commentCount: d.comments,
      shareCount: d.platform === "tiktok" ? 0 : undefined,
      publishedAt: new Date().toISOString(), // pour l’affichage de date
    }));
  }, [ready, lang]);

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

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <div className="rounded-2xl p-6 border border-neutral-800 bg-neutral-900/50 backdrop-blur">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-2">
          <h1 className="text-2xl font-semibold text-neutral-100">
            {t.title}
          </h1>

          {videos && (
            <div className="flex flex-wrap gap-2">
              {SORT_KEYS.map((key) => (
                <SortButton
                  key={key}
                  label={t.sorts[key]}
                  active={sortKey === key}
                  dir={sortKey === key ? sortDir : undefined}
                  onClick={() => toggleSort(key)}
                  disabled={key === "shares" && !hasTikTok}
                  title={
                    key === "shares" && !hasTikTok
                      ? t.noTikTok
                      : undefined
                  }
                />
              ))}
            </div>
          )}

          <LangToggle
            lang={lang}
            onChange={setLang}
            label={t.langLabel}
            className="sm:ml-auto"
          />
        </div>
        {/* La mention remplace une note de développement qui affichait le
            chemin des fichiers de vignettes : sans intérêt pour un visiteur,
            et trompeuse sur une capture d'écran. Ce qu'il faut dire, c'est
            que les chiffres ne sont pas réels. */}
        <p className="mb-4 text-sm text-neutral-400">
          {t.notice}
        </p>

        {videos && (
          <div className="mb-6">
            <PlatformFilter
              value={platform}
              counts={counts}
              onChange={setPlatform}
              lang={lang}
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

        {sorted && sorted.length > 0 && <VideoGrid videos={sorted} demo lang={lang} />}

        {sorted && sorted.length === 0 && (
          <p className="text-sm text-neutral-500">
            {t.empty}{" "}
            <button
              type="button"
              onClick={() => setPlatform("all")}
              className="underline hover:text-neutral-300"
            >
              {t.showAll}
            </button>
          </p>
        )}
      </div>
    </main>
  );
}
