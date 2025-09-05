"use client";

import { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";

type Platform = "youtube" | "tiktok";

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
  if (n == null) return "—";
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
        if (mounted) {
          setVideoTitle(found?.title || "");
        }
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

  const titleText =
    (videoTitle ? videoTitle : videoId) +
    ` — ${platform === "youtube" ? "YouTube" : "TikTok"}`;

  // Couleurs
  const COLOR_VIEWS = "#16a34a"; // vert
  const COLOR_LIKES = "#dc2626"; // rouge
  const COLOR_COMMS = "#2563eb"; // bleu
  const COLOR_SHARES = "#f97316"; // orange (tailwind orange-500)

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <h2 className="text-xl font-semibold">{titleText}</h2>
        {loading && (
          <span className="text-sm text-neutral-500">Chargement…</span>
        )}
        {err && <span className="text-sm text-red-600">Erreur: {err}</span>}
      </header>

      {/* === DAILY === */}
      <section className="rounded-2xl border border-neutral-200 bg-white/60 backdrop-blur p-4">
        <h3 className="font-medium mb-2">Vues / jour</h3>
        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={daily}>
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
              <Legend />
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

      <section className="rounded-2xl border border-neutral-200 bg-white/60 backdrop-blur p-4">
        <h3 className="font-medium mb-2">
          Engagement / jour (Likes, Commentaires)
        </h3>
        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={daily}>
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
              <Legend />
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
      <section className="rounded-2xl border border-neutral-200 bg-white/60 backdrop-blur p-4">
        <h3 className="font-medium mb-2">Vues / heure</h3>
        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={hourly}>
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
              <Legend />
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

      <section className="rounded-2xl border border-neutral-200 bg-white/60 backdrop-blur p-4">
        <h3 className="font-medium mb-2">
          Engagement / heure (Likes, Commentaires)
        </h3>
        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={hourly}>
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
              <Legend />
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
