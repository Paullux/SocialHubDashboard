// components/VideoAnalytics.tsx
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
  at: string; // ISO
  views: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
};

type DailyPoint = {
  day: string; // ISO
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

function formatDayLabel(iso: string) {
  const d = new Date(iso);
  // label court fr-FR
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
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

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
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

  const daily = useMemo(() => data?.daily ?? [], [data]);
  const hasShares =
    platform === "tiktok" && daily.some((d) => (d.shares ?? 0) > 0);

  return (
    <div className="space-y-6">
      <header className="flex items-baseline gap-3">
        <h2 className="text-xl font-semibold">
          Analytics — {platform} · {videoId}
        </h2>
        {loading && (
          <span className="text-sm text-neutral-500">Chargement…</span>
        )}
        {err && <span className="text-sm text-red-600">Erreur: {err}</span>}
      </header>

      {!loading && !err && daily.length === 0 && (
        <div className="text-sm text-neutral-500">
          Pas encore de données agrégées. Lance le cron de snapshots ou reviens
          plus tard.
        </div>
      )}

      {daily.length > 0 && (
        <>
          {/* VUES / JOUR */}
          <section className="rounded-2xl border border-neutral-200 bg-white/60 backdrop-blur p-4">
            <h3 className="font-medium mb-2">Vues / jour</h3>
            <div className="w-full h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={daily}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="day"
                    tickFormatter={formatDayLabel}
                    minTickGap={24}
                  />
                  <YAxis
                    tickFormatter={(v) => formatNumber(Number(v))}
                    width={70}
                    allowDecimals={false}
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
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* ENGAGEMENT / JOUR */}
          <section className="rounded-2xl border border-neutral-200 bg-white/60 backdrop-blur p-4">
            <h3 className="font-medium mb-2">
              Engagement / jour{" "}
              {hasShares
                ? "(Likes, Commentaires, Partages)"
                : "(Likes, Commentaires)"}
            </h3>
            <div className="w-full h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={daily}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="day"
                    tickFormatter={formatDayLabel}
                    minTickGap={24}
                  />
                  <YAxis
                    tickFormatter={(v) => formatNumber(Number(v))}
                    width={70}
                    allowDecimals={false}
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
                  />
                  <Line
                    type="monotone"
                    dataKey="comments"
                    name="Commentaires"
                    dot={false}
                    strokeWidth={2}
                  />
                  {hasShares && (
                    <Line
                      type="monotone"
                      dataKey="shares"
                      name="Partages"
                      dot={false}
                      strokeWidth={2}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
