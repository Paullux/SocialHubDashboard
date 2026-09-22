"use client";

import { useEffect, useMemo, useState } from "react";
import { useIsXs } from "@/utils/useIsXs";
import { LOCALE, useUiLang } from "@/lib/uiLang";
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
    viewsHour: "Vues / heure",
    loading: "Chargement…",
    error: "Erreur :",
    engagementDay: "Engagement / jour — likes, commentaires et taux",
    engagementHour: "Engagement / heure — likes, commentaires et taux",
  },
  en: {
    views: "Views",
    likes: "Likes",
    comments: "Comments",
    shares: "Shares",
    engagement: "Engagement rate",
    viewsDay: "Views / day",
    viewsHour: "Views / hour",
    loading: "Loading…",
    error: "Error:",
    engagementDay: "Engagement / day — likes, comments and rate",
    engagementHour: "Engagement / hour — likes, comments and rate",
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
  return d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
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
  const [videoTitle, setVideoTitle] = useState<string>("");

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

  // 2) Récup titre vidéo
  useEffect(() => {
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
        if (mounted) setVideoTitle(found?.title || "");
      } catch {
        /* ignore */
      }
    })();
    return () => {
      mounted = false;
    };
  }, [videoId, platform]);

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

  const displayTitle = videoTitle
    ? truncateTitle(videoTitle, TITLE_LIMIT)
    : videoId;

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

      {/* === DAILY === */}
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

      {/* === HOURLY === */}
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
    </div>
  );
}
