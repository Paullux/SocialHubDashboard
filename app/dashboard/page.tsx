// app/dashboard/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { VideoItem } from "@/lib/types";
import {
  ErrorBox,
  VideoCardSkeleton,
  SortButton,
  PlatformFilter,
  VideoGrid,
  ConnectPanel,
} from "@/components/dashboard";
import type { PlatformFilterValue, LinkedAccount } from "@/components/dashboard";
import type { Platform } from "@/lib/types";
import { sortVideos, type SortKey, type SortDir } from "@/lib/videoSort";
import { useUiLang } from "@/lib/uiLang";
import LangToggle from "@/components/legal/LangToggle";

/* ================== Types réponse API ================== */
interface ApiResponseOk {
  videos: VideoItem[];
}
interface ApiResponseErr {
  error: string;
}
type ApiResponse = ApiResponseOk | ApiResponseErr;

/* ================== Constantes ================== */
const STEP = 60;

const SORT_KEYS: SortKey[] = ["date", "views", "likes", "comments", "shares"];

const T = {
  fr: {
    title: "DASHBOARD — Vidéos",
    sorts: { date: "Date", views: "Vues", likes: "Likes", comments: "Commentaires", shares: "Partages (TikTok)" },
    noTikTok: "Aucune vidéo TikTok pour ce lot",
    loading: "Chargement...",
    loadMore: `Charger +${STEP}`,
    empty: "Aucune vidéo trouvée sur les comptes connectés pour le moment.",
    emptyPlatform: "Aucune vidéo pour cette plateforme dans ce lot.",
    showAll: "Afficher toutes les plateformes",
    langLabel: "Langue de la page",
  },
  en: {
    title: "DASHBOARD — Videos",
    sorts: { date: "Date", views: "Views", likes: "Likes", comments: "Comments", shares: "Shares (TikTok)" },
    noTikTok: "No TikTok videos in this batch",
    loading: "Loading...",
    loadMore: `Load +${STEP}`,
    empty: "No videos found on your connected accounts yet.",
    emptyPlatform: "No videos for this platform in this batch.",
    showAll: "Show all platforms",
    langLabel: "Page language",
  },
} as const;

/* ================== Page ================== */
export default function DashboardPage(): JSX.Element {
  const [limit, setLimit] = useState<number>(STEP);
  const [videos, setVideos] = useState<VideoItem[] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [err, setErr] = useState<string | null>(null);
  // Comptes liés : null tant qu'on ne sait pas (ou si l'appel a échoué), pour ne
  // pas afficher l'écran « connecte ta première plateforme » à tort.
  const [links, setLinks] = useState<LinkedAccount[] | null>(null);

  // Tri
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Filtre par plateforme
  const [platform, setPlatform] = useState<PlatformFilterValue>("all");

  const [lang, setLang] = useUiLang();
  const t = T[lang];

  // La barre d'outils est en `fixed` : sa hauteur varie avec le nombre de
  // lignes (filtre + tri passent a la ligne en dessous de ~640px). On la mesure
  // au lieu de coder la marge en dur, sinon les premieres cartes passent
  // dessous des qu'une ligne s'ajoute.
  const barRef = useRef<HTMLDivElement | null>(null);
  const [barH, setBarH] = useState<number | null>(null);

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

  useEffect(() => {
    fetch("/api/linked-accounts", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d: { links?: LinkedAccount[] }) => setLinks(d.links ?? []))
      .catch(() => setLinks(null));
  }, []);

  const noAccount = links !== null && links.length === 0;
  // Les partages n'existent que côté TikTok : sans compte TikTok, pas de tri.
  const tiktokLinked = links?.some((l) => l.provider === "tiktok") ?? false;
  const sortKeys = tiktokLinked ? SORT_KEYS : SORT_KEYS.filter((k) => k !== "shares");

  // Meta ajoute « #_ » à ses redirections OAuth : on le retire de l'URL.
  useEffect(() => {
    if (window.location.hash === "#_") {
      const { pathname, search } = window.location;
      window.history.replaceState(window.history.state, "", pathname + search);
    }
  }, []);

  useEffect(() => {
    const el = barRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const measure = () => setBarH(el.offsetHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const counts = useMemo<Record<Platform, number>>(() => {
    const c: Record<Platform, number> = { youtube: 0, tiktok: 0, instagram: 0 };
    for (const v of videos ?? []) c[v.platform] += 1;
    return c;
  }, [videos]);

  // Un lot rechargé peut ne plus contenir la plateforme filtrée (déconnexion
  // d'un compte, par exemple) : on revient sur « Toutes » plutôt que d'afficher
  // une grille vide sans explication.
  useEffect(() => {
    if (platform !== "all" && videos && counts[platform] === 0) {
      setPlatform("all");
    }
  }, [counts, platform, videos]);

  const filtered = useMemo(() => {
    if (!videos) return null;
    if (platform === "all") return videos;
    return videos.filter((v) => v.platform === platform);
  }, [videos, platform]);

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
    <>
      {/* BARRE FIXE sous la navbar (navbar ~ h-14) */}
      <div ref={barRef} className="fixed top-14 left-0 right-0 z-20 w-screen">
        <div className="w-full bg-neutral-900/90 backdrop-blur border-b border-neutral-700">
          <div className="mx-auto max-w-7xl px-3 sm:px-6">
            <div className="flex flex-wrap items-center gap-2 py-2 sm:py-3">
              <h1 className="ml-2 sm:ml-[40px] text-base sm:text-lg font-semibold mr-2 sm:mr-3">
                {t.title}
              </h1>

              {/* Sans compte lié, tris / filtre / chargement ne servent à rien et
                  détournent l'attention de l'écran d'accueil. */}
              {!noAccount && (
                <div className="flex flex-wrap gap-2">
                  {sortKeys.map((key) => (
                    <SortButton
                      key={key}
                      label={t.sorts[key]}
                      active={sortKey === key}
                      dir={sortKey === key ? sortDir : undefined}
                      onClick={() => toggleSort(key)}
                      disabled={key === "shares" && !hasTikTok}
                      title={key === "shares" && !hasTikTok ? t.noTikTok : undefined}
                    />
                  ))}
                </div>
              )}

              <div className="ml-auto flex items-center gap-2">
                <LangToggle lang={lang} onChange={setLang} label={t.langLabel} className="self-center" />
                {!noAccount && (
                  <button
                    onClick={() => setLimit((l) => l + STEP)}
                    disabled={loading}
                    className="rounded-xl px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50"
                  >
                    {loading ? t.loading : t.loadMore}
                  </button>
                )}
              </div>
            </div>

            {!noAccount && (
              <div className="flex items-center gap-2 pb-2 sm:pb-3">
                <PlatformFilter
                  value={platform}
                  counts={counts}
                  onChange={setPlatform}
                  pending={!videos}
                  lang={lang}
                />
              </div>
            )}

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
      <main
        className="xs:pt-[180px] pt-24 sm:pt-28 px-3 sm:px-6 max-w-7xl mx-auto"
        style={barH ? { paddingTop: barH + 56 + 16 } : undefined}
      >
        {/* Aucun compte lié : l'écran d'accueil remplace la grille */}
        {noAccount && <ConnectPanel links={[]} variant="hero" lang={lang} />}

        {!noAccount && err && <ErrorBox message={err} lang={lang} />}

        {/* GRID DE SKELETONS pendant le fetch initial */}
        {!noAccount && !sorted && !err && (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {Array.from({ length: 9 }).map((_, i) => (
              <VideoCardSkeleton key={i} />
            ))}
          </ul>
        )}

        {!noAccount && sorted && sorted.length === 0 && (
          <div className="text-sm text-neutral-500">
            {platform === "all" ? (
              t.empty
            ) : (
              <>
                {t.emptyPlatform}{" "}
                <button
                  type="button"
                  onClick={() => setPlatform("all")}
                  className="underline hover:text-neutral-300"
                >
                  {t.showAll}
                </button>
              </>
            )}
          </div>
        )}

        {!noAccount && sorted && sorted.length > 0 && (
          <>
            <VideoGrid videos={sorted} lang={lang} />
            <div className="flex justify-center">
              <button
                disabled={loading}
                onClick={() => setLimit((l) => l + STEP)}
                className="border border-neutral-700 bg-neutral-800/60 backdrop-blur mt-8 rounded-xl px-5 py-2.5 text-white hover:bg-neutral-700 disabled:opacity-50"
              >
                {loading ? t.loading : t.loadMore}
              </button>
            </div>
          </>
        )}

        {/* Au moins un compte lié : gestion des connexions sous les vidéos */}
        {links && links.length > 0 && (
          <ConnectPanel links={links} variant="footer" lang={lang} />
        )}
      </main>
    </>
  );
}
