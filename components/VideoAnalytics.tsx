"use client";

import { useEffect, useMemo, useState } from "react";
import { useIsXs } from "@/utils/useIsXs";
import { LOCALE, useUiLang } from "@/lib/uiLang";
import { untitledLabel } from "@/lib/untitled";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";

type Platform = "youtube" | "tiktok" | "instagram";

const PLATFORM_LABEL: Record<Platform, string> = {
  youtube: "YouTube",
  tiktok: "TikTok",
  instagram: "Instagram",
};

const T = {
  fr: {
    views: "Vues",
    likes: "Likes",
    comments: "Commentaires",
    shares: "Partages",
    engagement: "Taux d’engagement",
    viewsDay: "Vues / jour",
    viewsHour: "Vues / heure — 7 derniers jours",
    loading: "Chargement…",
    error: "Erreur :",
    engagementDay: "Engagement / jour — likes, commentaires et taux",
    engagementHour: "Engagement / heure — 7 derniers jours",
    buildingTitle: "L’historique de cette vidéo se construit",
    buildingBody:
      "Social Hub enregistre les compteurs de chacune de tes vidéos une fois par jour, et toutes les heures pour les plus récentes. Les courbes apparaîtront au fil des prochains jours : rien n’est cassé, il faut juste un peu de recul.",
    buildingNow: "En ce moment :",
  },
  en: {
    views: "Views",
    likes: "Likes",
    comments: "Comments",
    shares: "Shares",
    engagement: "Engagement rate",
    viewsDay: "Views / day",
    viewsHour: "Views / hour — last 7 days",
    loading: "Loading…",
    error: "Error:",
    engagementDay: "Engagement / day — likes, comments and rate",
    engagementHour: "Engagement / hour — last 7 days",
    buildingTitle: "This video’s history is being built",
    buildingBody:
      "Social Hub records the counters of every one of your videos once a day, and every hour for the most recent ones. The charts will fill in over the next few days: nothing is broken, it just needs a little time.",
    buildingNow: "Right now:",
  },
} as const;

type HourlyPoint = {
  at: string;
  views: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
};

type DailyPoint = {
  day: string;
  views: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
};

type ApiOk = {
  platform: Platform;
  videoId: string;
  /** Titre lu dans le catalogue : null = inconnu, "" = sans description. */
  title?: string | null;
  /** Compteurs actuels (catalogue), null si la vidéo n'y est pas. */
  current?: {
    views: number | null;
    likes: number | null;
    comments: number | null;
    shares: number | null;
  } | null;
  hourly: HourlyPoint[];
  daily: DailyPoint[];
};
type ApiErr = { error: string };

type VideoMeta = { id: string; platform: Platform; title: string };

function formatDayLabel(iso: string, locale: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(locale, { day: "2-digit", month: "2-digit" });
}
function formatHourLabel(iso: string, locale: string) {
  const d = new Date(iso);
  return d.toLocaleString(locale, {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
/** Taux d'engagement : (likes + commentaires + partages) / vues, en %.
 *  `null` si les vues manquent ou valent 0 — diviser par zéro donnerait
 *  l'infini, et un point absent est plus honnête qu'un pic inventé. */
function engagementRate(p: {
  views: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
}): number | null {
  if (p.views == null || p.views <= 0) return null;
  const interactions = (p.likes ?? 0) + (p.comments ?? 0) + (p.shares ?? 0);
  return Math.round((interactions / p.views) * 1000) / 10;
}

/** Le français sépare le signe % du nombre par une espace insécable, pas l'anglais. */
function percentSuffix(locale: string) {
  return locale.startsWith("fr") ? " %" : "%";
}

function formatPercent(n: number | null, locale: string) {
  if (n == null || Number.isNaN(n)) return "—";
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(n)}${percentSuffix(locale)}`;
}

function formatNumber(n: number | null, locale: string) {
  if (n == null || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat(locale).format(n);
}

export default function VideoAnalytics({
  videoId,
  platform = "youtube",
}: {
  videoId: string;
  platform?: Platform;
}) {
  const [data, setData] = useState<ApiOk | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // null : vidéo introuvable dans la liste (on affiche son id) ; "" : trouvée
  // mais sans description (TikTok / Instagram) → titre générique.
  const [videoTitle, setVideoTitle] = useState<string | null>(null);

  const isXs = useIsXs(); // <= 425px ?
  const [lang] = useUiLang();
  const t = T[lang];
  const locale = LOCALE[lang];

  // Marges des graphes (colle à gauche en xs)
  const chartMargin = isXs
    ? ({ top: 8, right: 8, bottom: 20, left: 0 } as const)
    : ({ top: 12, right: 16, bottom: 24, left: 12 } as const);

  // Légende à gauche en xs
  const legendProps = isXs
    ? {
        align: "left" as const,
        verticalAlign: "bottom" as const,
        wrapperStyle: { paddingLeft: 4 },
      }
    : { align: "center" as const, verticalAlign: "bottom" as const };

  // 1) Charger analytics
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `/api/analytics/${encodeURIComponent(videoId)}?platform=${platform}`,
          { cache: "no-store" }
        );
        const json: ApiOk | ApiErr = await res.json();
        if (!res.ok || "error" in json) {
          throw new Error(
            ("error" in json && json.error) || `HTTP ${res.status}`
          );
        }
        if (mounted) setData(json as ApiOk);
      } catch (e) {
        setErr(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [videoId, platform]);

  // 2) Titre : fourni par /api/analytics (catalogue, tout le compte). Repli
  // sur les 200 dernières vidéos seulement si le catalogue ne la connaît pas
  // (compte lié depuis le dernier passage du cron).
  useEffect(() => {
    if (!data) return;
    if (typeof data.title === "string") {
      setVideoTitle(data.title);
      return;
    }
    let mounted = true;
    (async () => {
      try {
        const r = await fetch(`/api/videos?limit=200`, { cache: "no-store" });
        if (!r.ok) return;
        const j = await r.json();
        const list: any[] = Array.isArray(j?.videos) ? j.videos : [];
        const found = list.find(
          (v: any) => v.id === videoId && v.platform === platform
        ) as VideoMeta | undefined;
        if (mounted) setVideoTitle(found ? (found.title ?? "").trim() : null);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      mounted = false;
    };
  }, [data, videoId, platform]);

  const daily = useMemo(
    () => (data?.daily ?? []).map((p) => ({ ...p, engagement: engagementRate(p) })),
    [data]
  );
  const hourly = useMemo(
    () => (data?.hourly ?? []).map((p) => ({ ...p, engagement: engagementRate(p) })),
    [data]
  );

  function truncateTitle(title: string, max: number) {
    if (!title) return "";
    return title.length > max
      ? title.slice(0, max - 1) + "…"
      : title;
  }

  const TITLE_LIMIT = platform === "tiktok" ? 45 : 35;

  const displayTitle =
    videoTitle === null
      ? videoId
      : videoTitle
        ? truncateTitle(videoTitle, TITLE_LIMIT)
        : untitledLabel(platform, lang);

  const titleText =
    displayTitle +
    ` — ${PLATFORM_LABEL[platform] ?? "YouTube"}`;


  // Couleurs
  const COLOR_VIEWS = "#16a34a"; // vert
  const COLOR_LIKES = "#dc2626"; // rouge
  const COLOR_COMMS = "#2563eb"; // bleu
  const COLOR_SHARES = "#f97316"; // orange
  const COLOR_ENGAGE = "#a855f7"; // violet — axe de droite, en %

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <h2 className="text-xl font-semibold">{titleText}</h2>
        {loading && (
          <span className="text-sm text-neutral-500">{t.loading}</span>
        )}
        {err && <span className="text-sm text-red-500">{t.error} {err}</span>}
      </header>

      {/* Historique trop court pour une courbe : on l'explique plutôt que
          d'afficher des cadres vides — un nouvel utilisateur croirait que le
          site ne marche pas. */}
      {data && daily.length < 2 && (
        <section className="rounded-2xl border border-sky-700/60 bg-sky-950/40 p-4 space-y-2">
          <h3 className="font-medium text-sky-100">{t.buildingTitle}</h3>
          <p className="text-sm text-neutral-300">{t.buildingBody}</p>
          {data.current && (
            <p className="text-sm text-neutral-200 flex flex-wrap gap-x-4 gap-y-1">
              <span className="text-neutral-400">{t.buildingNow}</span>
              <span>
                {t.views} <strong>{formatNumber(data.current.views, locale)}</strong>
              </span>
              <span>
                {t.likes} <strong>{formatNumber(data.current.likes, locale)}</strong>
              </span>
              <span>
                {t.comments} <strong>{formatNumber(data.current.comments, locale)}</strong>
              </span>
              {platform === "tiktok" && (
                <span>
                  {t.shares} <strong>{formatNumber(data.current.shares, locale)}</strong>
                </span>
              )}
            </p>
          )}
        </section>
      )}

      {/* === DAILY === */}
      {daily.length > 0 && (
      <>
      <section className="rounded-2xl border border-neutral-700 bg-neutral-800/60 backdrop-blur p-4 xs:p-2">
        <h3 className="font-medium mb-2 text-neutral-200">{t.viewsDay}</h3>
        <div className="w-full h-72">
          <ResponsiveContainer
            width="100%"
            height="100%"
            initialDimension={{ width: 800, height: 288 }}
          >
            <LineChart data={daily} margin={chartMargin}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" tickFormatter={(v) => formatDayLabel(v, locale)} />
              <YAxis
                tickFormatter={(v) => formatNumber(Number(v), locale)}
                width={70}
              />
              <Tooltip
                formatter={(value: any) => formatNumber(Number(value), locale)}
                labelFormatter={(l) =>
                  new Date(l as string).toLocaleDateString(locale, {
                    weekday: "short",
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                  })
                }
              />
              <Legend {...legendProps} />
              <Line
                type="monotone"
                dataKey="views"
                name={t.views}
                dot={false}
                strokeWidth={2}
                stroke={COLOR_VIEWS}
              />
              {platform === "tiktok" && (
                <Line
                  type="monotone"
                  dataKey="shares"
                  name={t.shares}
                  dot={false}
                  strokeWidth={2}
                  stroke={COLOR_SHARES}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-700 bg-neutral-800/60 backdrop-blur p-4 xs:p-2">
        <h3 className="font-medium mb-2 text-neutral-200">
          {t.engagementDay}
        </h3>
        <div className="w-full h-72">
          <ResponsiveContainer
            width="100%"
            height="100%"
            initialDimension={{ width: 800, height: 288 }}
          >
            <LineChart data={daily} margin={chartMargin}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" tickFormatter={(v) => formatDayLabel(v, locale)} />
              <YAxis
                yAxisId="left"
                tickFormatter={(v) => formatNumber(Number(v), locale)}
                width={70}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tickFormatter={(v) => `${Number(v)}${percentSuffix(locale)}`}
                width={56}
                stroke={COLOR_ENGAGE}
              />
              <Tooltip
                formatter={(value: any, name: any) =>
                  name === t.engagement
                    ? formatPercent(value == null ? null : Number(value), locale)
                    : formatNumber(Number(value), locale)
                }
                labelFormatter={(l) =>
                  new Date(l as string).toLocaleDateString(locale, {
                    weekday: "short",
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                  })
                }
              />
              <Legend {...legendProps} />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="likes"
                name={t.likes}
                dot={false}
                strokeWidth={2}
                stroke={COLOR_LIKES}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="comments"
                name={t.comments}
                dot={false}
                strokeWidth={2}
                stroke={COLOR_COMMS}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="engagement"
                name={t.engagement}
                dot={false}
                strokeWidth={2}
                strokeDasharray="4 3"
                connectNulls
                stroke={COLOR_ENGAGE}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
      </>
      )}

      {/* === HOURLY === */}
      {hourly.length > 0 && (
      <>
      <section className="rounded-2xl border border-neutral-700 bg-neutral-800/60 backdrop-blur p-4 xs:p-2">
        <h3 className="font-medium mb-2 text-neutral-200">{t.viewsHour}</h3>
        <div className="w-full h-72">
          <ResponsiveContainer
            width="100%"
            height="100%"
            initialDimension={{ width: 800, height: 288 }}
          >
            <LineChart data={hourly} margin={chartMargin}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="at" tickFormatter={(v) => formatHourLabel(v, locale)} />
              <YAxis
                tickFormatter={(v) => formatNumber(Number(v), locale)}
                width={70}
              />
              <Tooltip
                formatter={(value: any) => formatNumber(Number(value), locale)}
                labelFormatter={(l) =>
                  new Date(l as string).toLocaleString(locale, {
                    weekday: "short",
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                }
              />
              <Legend {...legendProps} />
              <Line
                type="monotone"
                dataKey="views"
                name={t.views}
                dot={false}
                strokeWidth={2}
                stroke={COLOR_VIEWS}
              />
              {platform === "tiktok" && (
                <Line
                  type="monotone"
                  dataKey="shares"
                  name={t.shares}
                  dot={false}
                  strokeWidth={2}
                  stroke={COLOR_SHARES}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-700 bg-neutral-800/60 backdrop-blur p-4 xs:p-2">
        <h3 className="font-medium mb-2 text-neutral-200">
          {t.engagementHour}
        </h3>
        <div className="w-full h-72">
          <ResponsiveContainer
            width="100%"
            height="100%"
            initialDimension={{ width: 800, height: 288 }}
          >
            <LineChart data={hourly} margin={chartMargin}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="at" tickFormatter={(v) => formatHourLabel(v, locale)} />
              <YAxis
                yAxisId="left"
                tickFormatter={(v) => formatNumber(Number(v), locale)}
                width={70}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tickFormatter={(v) => `${Number(v)}${percentSuffix(locale)}`}
                width={56}
                stroke={COLOR_ENGAGE}
              />
              <Tooltip
                formatter={(value: any, name: any) =>
                  name === t.engagement
                    ? formatPercent(value == null ? null : Number(value), locale)
                    : formatNumber(Number(value), locale)
                }
                labelFormatter={(l) =>
                  new Date(l as string).toLocaleString(locale, {
                    weekday: "short",
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                }
              />
              <Legend {...legendProps} />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="likes"
                name={t.likes}
                dot={false}
                strokeWidth={2}
                stroke={COLOR_LIKES}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="comments"
                name={t.comments}
                dot={false}
                strokeWidth={2}
                stroke={COLOR_COMMS}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="engagement"
                name={t.engagement}
                dot={false}
                strokeWidth={2}
                strokeDasharray="4 3"
                connectNulls
                stroke={COLOR_ENGAGE}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
      </>
      )}
    </div>
  );
}
