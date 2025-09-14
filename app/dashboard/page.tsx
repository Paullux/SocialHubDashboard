// app/dashboard/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import type { VideoItem } from "@/lib/types";
import {
  ErrorBox,
  VideoCardSkeleton,
  SortButton,
  VideoGrid,
} from "@/components/dashboard";

/* ================== Types réponse API ================== */
interface ApiResponseOk {
  videos: VideoItem[];
}
interface ApiResponseErr {
  error: string;
}
type ApiResponse = ApiResponseOk | ApiResponseErr;

type SortKey = "date" | "views" | "likes" | "comments" | "shares";
type SortDir = "desc" | "asc";

/* ================== Constantes ================== */
const STEP = 60;

/* ================== Helpers ================== */
function metricOf(v: VideoItem, key: SortKey): number {
  switch (key) {
    case "date":
      return v.publishedAt ? Date.parse(v.publishedAt) : Number.NaN;
    case "views":
      return v.viewCount ?? Number.NaN;
    case "likes":
      return v.likeCount ?? Number.NaN;
    case "comments":
      return v.commentCount ?? Number.NaN;
    case "shares":
      return v.shareCount ?? Number.NaN; // TikTok only
  }
}

function sortVideos(
  videos: VideoItem[],
  key: SortKey,
  dir: SortDir
): VideoItem[] {
  const arr = [...videos];
  const sign = dir === "desc" ? -1 : 1;
  arr.sort((a, b) => {
    const A = metricOf(a, key);
    const B = metricOf(b, key);
    const aNaN = Number.isNaN(A);
    const bNaN = Number.isNaN(B);
    if (aNaN && bNaN) return 0;
    if (aNaN) return 1;
    if (bNaN) return -1;
    if (A === B) return 0;
    return A > B ? sign : -sign;
  });
  return arr;
}

/* ================== Page ================== */
export default function DashboardPage(): JSX.Element {
  const [limit, setLimit] = useState<number>(STEP);
  const [videos, setVideos] = useState<VideoItem[] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [err, setErr] = useState<string | null>(null);

  // Tri
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  async function load(newLimit: number): Promise<void> {
    try {
      setLoading(true);
      setErr(null);
      const r = await fetch(`/api/videos?limit=${newLimit}`, {
        cache: "no-store",
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data: ApiResponse = await r.json();
      if ("error" in data) throw new Error(data.error);
      setVideos(data.videos ?? []);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load(limit);
  }, [limit]);

  const hasTikTok = useMemo(
    () => (videos ?? []).some((v) => v.platform === "tiktok"),
    [videos]
  );

  const sorted = useMemo(() => {
    if (!videos) return null;
    return sortVideos(videos, sortKey, sortDir);
  }, [videos, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  return (
    <>
      {/* BARRE FIXE sous la navbar (navbar ~ h-14) */}
      <div className="fixed top-14 left-0 right-0 z-20 w-screen">
        <div className="w-full bg-neutral-900/90 backdrop-blur border-b border-neutral-700">
          <div className="mx-auto max-w-7xl px-3 sm:px-6">
            <div className="flex flex-wrap items-center gap-2 py-2 sm:py-3">
              <h1 className="ml-2 sm:ml-[40px] text-base sm:text-lg font-semibold mr-2 sm:mr-3">
                DASHBOARD — Vidéos
              </h1>

              <div className="flex flex-wrap gap-2">
                <SortButton
                  label="Date"
                  active={sortKey === "date"}
                  dir={sortKey === "date" ? sortDir : undefined}
                  onClick={() => toggleSort("date")}
                />
                <SortButton
                  label="Vues"
                  active={sortKey === "views"}
                  dir={sortKey === "views" ? sortDir : undefined}
                  onClick={() => toggleSort("views")}
                />
                <SortButton
                  label="Likes"
                  active={sortKey === "likes"}
                  dir={sortKey === "likes" ? sortDir : undefined}
                  onClick={() => toggleSort("likes")}
                />
                <SortButton
                  label="Commentaires"
                  active={sortKey === "comments"}
                  dir={sortKey === "comments" ? sortDir : undefined}
                  onClick={() => toggleSort("comments")}
                />
                <SortButton
                  label="Partages (TikTok)"
                  active={sortKey === "shares"}
                  dir={sortKey === "shares" ? sortDir : undefined}
                  onClick={() => toggleSort("shares")}
                  disabled={!hasTikTok}
                  title={
                    !hasTikTok ? "Aucune vidéo TikTok pour ce lot" : undefined
                  }
                />
              </div>

              <div className="ml-auto">
                <button
                  onClick={() => setLimit((l) => l + STEP)}
                  disabled={loading}
                  className="rounded-xl px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50"
                >
                  {loading ? "Chargement..." : `Charger +${STEP}`}
                </button>
              </div>
            </div>

            {/* Skeleton de toolbar au tout premier chargement */}
            {/* {!sorted && !err && (
              <div className="flex gap-2 pb-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <span
                    key={i}
                    className="h-8 w-24 rounded-lg bg-neutral-800 animate-pulse"
                  />
                ))}
              </div>
            )} */}
          </div>
        </div>
      </div>

      {/* marge haute = navbar (56px) + barre (~48px) ≈ 24/28 */}
      <main className="pt-24 sm:pt-28 px-3 sm:px-6 max-w-7xl mx-auto">
        {err && <ErrorBox message={err} />}

        {/* GRID DE SKELETONS pendant le fetch initial */}
        {!sorted && !err && (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {Array.from({ length: 9 }).map((_, i) => (
              <VideoCardSkeleton key={i} />
            ))}
          </ul>
        )}

        {sorted && sorted.length === 0 && (
          <div className="text-sm text-neutral-500">
            Aucune vidéo trouvée. Vérifie tes clés/permissions.
          </div>
        )}

        {sorted && sorted.length > 0 && (
          <>
            <VideoGrid videos={sorted} />
            <div className="flex justify-center">
              <button
                disabled={loading}
                onClick={() => setLimit((l) => l + STEP)}
                className="border border-neutral-700 bg-neutral-800/60 backdrop-blur mt-8 rounded-xl px-5 py-2.5 text-white hover:bg-neutral-700 disabled:opacity-50"
              >
                {loading ? "Chargement..." : `Charger +${STEP}`}
              </button>
            </div>
          </>
        )}
      </main>
    </>
  );
}
