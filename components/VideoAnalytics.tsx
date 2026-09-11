"use client";

import { useEffect, useMemo, useState } from "react";
import { useIsXs } from "@/utils/useIsXs";
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

function formatDayLabel(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
}
function formatHourLabel(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}
function formatNumber(n: number | null) {
  if (n == null || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("fr-FR").format(n);
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

  const daily = useMemo(() => data?.daily ?? [], [data]);
  const hourly = useMemo(() => data?.hourly ?? [], [data]);

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

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <h2 className="text-xl font-semibold">{titleText}</h2>
        {loading && (
          <span className="text-sm text-neutral-500">Chargement…</span>
        )}
        {err && <span className="text-sm text-red-500">Erreur : {err}</span>}
      </header>

      {/* === DAILY === */}
      <section className="rounded-2xl border border-neutral-700 bg-neutral-800/60 backdrop-blur p-4 xs:p-2">
        <h3 className="font-medium mb-2 text-neutral-200">Vues / jour</h3>
        <div className="w-full h-72">
          <ResponsiveContainer
            width="100%"
            height="100%"
            initialDimension={{ width: 800, height: 288 }}
          >
            <LineChart data={daily} margin={chartMargin}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" tickFormatter={formatDayLabel} />
              <YAxis
                tickFormatter={(v) => formatNumber(Number(v))}
                width={70}
              />
              <Tooltip
                formatter={(value: any) => formatNumber(Number(value))}
                labelFormatter={(l) =>
                  new Date(l as string).toLocaleDateString("fr-FR", {
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
                name="Vues"
                dot={false}
                strokeWidth={2}
                stroke={COLOR_VIEWS}
              />
              {platform === "tiktok" && (
                <Line
                  type="monotone"
                  dataKey="shares"
                  name="Partages"
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
          Engagement / jour (Likes, Commentaires)
        </h3>
        <div className="w-full h-72">
          <ResponsiveContainer
            width="100%"
            height="100%"
            initialDimension={{ width: 800, height: 288 }}
          >
            <LineChart data={daily} margin={chartMargin}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" tickFormatter={formatDayLabel} />
              <YAxis
                tickFormatter={(v) => formatNumber(Number(v))}
                width={70}
              />
              <Tooltip
                formatter={(value: any) => formatNumber(Number(value))}
                labelFormatter={(l) =>
                  new Date(l as string).toLocaleDateString("fr-FR", {
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
                dataKey="likes"
                name="Likes"
                dot={false}
                strokeWidth={2}
                stroke={COLOR_LIKES}
              />
              <Line
                type="monotone"
                dataKey="comments"
                name="Commentaires"
                dot={false}
                strokeWidth={2}
                stroke={COLOR_COMMS}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* === HOURLY === */}
      <section className="rounded-2xl border border-neutral-700 bg-neutral-800/60 backdrop-blur p-4 xs:p-2">
        <h3 className="font-medium mb-2 text-neutral-200">Vues / heure</h3>
        <div className="w-full h-72">
          <ResponsiveContainer
            width="100%"
            height="100%"
            initialDimension={{ width: 800, height: 288 }}
          >
            <LineChart data={hourly} margin={chartMargin}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="at" tickFormatter={formatHourLabel} />
              <YAxis
                tickFormatter={(v) => formatNumber(Number(v))}
                width={70}
              />
              <Tooltip
                formatter={(value: any) => formatNumber(Number(value))}
                labelFormatter={(l) =>
                  new Date(l as string).toLocaleString("fr-FR", {
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
                name="Vues"
                dot={false}
                strokeWidth={2}
                stroke={COLOR_VIEWS}
              />
              {platform === "tiktok" && (
                <Line
                  type="monotone"
                  dataKey="shares"
                  name="Partages"
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
          Engagement / heure (Likes, Commentaires)
        </h3>
        <div className="w-full h-72">
          <ResponsiveContainer
            width="100%"
            height="100%"
            initialDimension={{ width: 800, height: 288 }}
          >
            <LineChart data={hourly} margin={chartMargin}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="at" tickFormatter={formatHourLabel} />
              <YAxis
                tickFormatter={(v) => formatNumber(Number(v))}
                width={70}
              />
              <Tooltip
                formatter={(value: any) => formatNumber(Number(value))}
                labelFormatter={(l) =>
                  new Date(l as string).toLocaleString("fr-FR", {
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
                dataKey="likes"
                name="Likes"
                dot={false}
                strokeWidth={2}
                stroke={COLOR_LIKES}
              />
              <Line
                type="monotone"
                dataKey="comments"
                name="Commentaires"
                dot={false}
                strokeWidth={2}
                stroke={COLOR_COMMS}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
