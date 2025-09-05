// app/dashboard/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import type { VideoItem } from "@/lib/types";
import clsx from "clsx";
import Link from "next/link";
import FormatDate from "@/components/FormatDate";

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
  // On clone pour garder l’état original
  const arr = [...videos];

  // NaN en bas pour l'ordre desc, en haut pour asc (plus logique pour "shares" quand YouTube n'en a pas)
  const sign = dir === "desc" ? -1 : 1;

  arr.sort((a, b) => {
    const A = metricOf(a, key);
    const B = metricOf(b, key);

    const aNaN = Number.isNaN(A);
    const bNaN = Number.isNaN(B);
    if (aNaN && bNaN) return 0;
    if (aNaN) return 1; // A sans valeur -> va en bas
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
      const msg = e instanceof Error ? e.message : String(e);
      setErr(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load(limit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    if (sortKey === key) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDir("desc"); // par défaut, desc
    }
  };

  return (
    <>
      {/* BARRE FIXED FULL-WIDTH */}
      <div className="fixed top-20 left-0 right-0 z-20 w-screen">
        {/* Bandeau plein écran (fond + blur) */}
        <div className="w-full bg-neutral-800/90 backdrop-blur border-b border-neutral-700">
          {/* Wrapper aligné sur ton contenu (mêmes marges que <main>) */}
          <div className="mx-auto max-w-7xl px-6">
            <div className="flex flex-wrap items-center gap-2 py-3">
              <h1 className="ml-[40px] text-lg font-semibold mr-3 text-white">
                DASHBOARD — Vidéos
              </h1>

              {/* Tes boutons de tri existants */}
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

              {/* Bouton "+60" de retour, aligné à droite */}
              <div className="ml-auto">
                <button
                  disabled={loading}
                  onClick={() => setLimit((l) => l + STEP)}
                  className="border border-neutral-200 rounded-xl px-4 py-2 bg-neutral-900 text-white hover:bg-neutral-800 disabled:opacity-50"
                >
                  {loading ? "Chargement..." : `Charger +${STEP}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="pt-40 px-6 max-w-7xl mx-auto">
        {err && <ErrorBox message={err} />}

        {!sorted && !err && (
          <div className="text-sm text-neutral-500">Chargement…</div>
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
                className="border border-neutral-200 bg-neutral-800/40 backdrop-blur mt-8 rounded-xl px-5 py-2.5 bg-neutral-900 text-white hover:bg-neutral-800 disabled:opacity-50"
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

/* ================== UI components ================== */

function SortButton({
  label,
  active,
  dir,
  onClick,
  disabled,
  title,
}: {
  label: string;
  active: boolean;
  dir?: SortDir;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
}): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={clsx(
        "px-3 py-1.5 rounded-lg border text-sm transition",
        active
          ? "shadow-sm border-neutral-200 bg-neutral-900 text-white  hover:bg-neutral-800"
          : "border-neutral-600 bg-neutral-700 text-white hover:bg-neutral-600",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {active && <span aria-hidden="true">{dir === "desc" ? "▼" : "▲"}</span>}
      </span>
    </button>
  );
}

function Divider(): JSX.Element {
  return <span className="h-5 w-px bg-neutral-200 mx-1" />;
}

function ErrorBox({ message }: { message: string }): JSX.Element {
  return (
    <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800">
      Erreur&nbsp;: {message}
    </div>
  );
}

function VideoGrid({ videos }: { videos: VideoItem[] }): JSX.Element {
  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {videos.map((v) => (
        <VideoCard key={`${v.platform}:${v.id}`} video={v} />
      ))}
    </ul>
  );
}

function VideoCard({ video: v }: { video: VideoItem }): JSX.Element {
  return (
    <li className="bg-neutral-800/70 backdrop-blur rounded-2xl overflow-hidden border border-neutral-200 shadow-sm hover:shadow transition flex flex-col">
      {/* Preview */}
      <a
        href={v.url || "#"}
        target="_blank"
        rel="noreferrer"
        className="block"
        title={v.title}
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
            <div className="w-full h-full flex items-center justify-center text-neutral-400">
              (Pas d’aperçu)
            </div>
          )}
        </div>
      </a>

      {/* Zone infos */}
      <div className="flex flex-col flex-1">
        <div className="p-3 flex items-center gap-2 text-neutral-300 text-xs">
          <span className="uppercase tracking-wide rounded-full border border-neutral-500 px-2 py-0.5">
            {v.platform}
          </span>
          {v.publishedAt && <FormatDate iso={v.publishedAt} />}
        </div>

        <div className="px-3 pb-2 flex-1">
          <h3 className="font-medium line-clamp-2 text-neutral-100">
            {v.title}
          </h3>
        </div>

        <div className="bg-neutral-800/70 backdrop-blur mt-auto p-3 flex items-center justify-between text-neutral-100">
          <KpiLine v={v} />
          <Link
            href={`/analytics/${v.id}?platform=${v.platform}`}
            className="ml-3 text-xs px-2 py-1 rounded bg-neutral-700 hover:bg-neutral-600"
          >
            📈 Stats
          </Link>
        </div>
      </div>
    </li>
  );
}

function KpiLine({ v }: { v: VideoItem }): JSX.Element {
  const nf = new Intl.NumberFormat("fr-FR");
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px]">
      <span>
        Vue{(v.viewCount ?? 0) > 1 ? "s" : ""} :{" "}
        <strong>{v.viewCount != null ? nf.format(v.viewCount) : "—"}</strong>
      </span>
      <span>
        Like{(v.likeCount ?? 0) > 1 ? "s" : ""} :{" "}
        <strong>{v.likeCount != null ? nf.format(v.likeCount) : "—"}</strong>
      </span>
      <span>
        Comm. :{" "}
        <strong>
          {v.commentCount != null ? nf.format(v.commentCount) : "—"}
        </strong>
      </span>
      {v.platform === "tiktok" && v.shareCount != null && (
        <span>
          Partages : <strong>{nf.format(v.shareCount)}</strong>
        </span>
      )}
    </div>
  );
}
