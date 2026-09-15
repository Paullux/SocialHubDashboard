"use client";

import { useMemo } from "react";
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

/** Données 100% fictives, générées côté client (pas d'appel API). Sert de
 *  page "Stats" identique pour toutes les vidéos de la démo /demo. */

type DailyPoint = {
  day: string;
  views: number;
  likes: number;
  comments: number;
};
type HourlyPoint = {
  at: string;
  views: number;
  likes: number;
  comments: number;
};

function buildDemoDaily(): DailyPoint[] {
  const today = new Date();
  return Array.from({ length: 14 }).map((_, i) => {
    const day = new Date(today);
    day.setDate(day.getDate() - (13 - i));
    const views = Math.round(650 + i * 95 + (i % 3 === 0 ? 60 : i % 2 === 0 ? -30 : 15));
    return {
      day: day.toISOString(),
      views,
      likes: Math.round(views * 0.09),
      comments: Math.round(views * 0.02),
    };
  });
}

function buildDemoHourly(): HourlyPoint[] {
  const now = new Date();
  return Array.from({ length: 24 }).map((_, i) => {
    const at = new Date(now);
    at.setHours(at.getHours() - (23 - i), 0, 0, 0);
    const hour = at.getHours();
    const wave = Math.sin(((hour - 6) / 24) * Math.PI * 2);
    const views = Math.max(5, Math.round(45 + wave * 30 + (i % 4 === 0 ? 8 : 0)));
    return {
      at: at.toISOString(),
      views,
      likes: Math.round(views * 0.09),
      comments: Math.round(views * 0.02),
    };
  });
}

function formatDayLabel(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
}
function formatHourLabel(iso: string) {
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}
function formatNumber(n: number) {
  return new Intl.NumberFormat("fr-FR").format(n);
}

const COLOR_VIEWS = "#16a34a";
const COLOR_LIKES = "#dc2626";
const COLOR_COMMS = "#2563eb";

export default function DemoVideoAnalytics() {
  const isXs = useIsXs();
  const daily = useMemo(buildDemoDaily, []);
  const hourly = useMemo(buildDemoHourly, []);

  const chartMargin = isXs
    ? ({ top: 8, right: 8, bottom: 20, left: 0 } as const)
    : ({ top: 12, right: 16, bottom: 24, left: 12 } as const);

  const legendProps = isXs
    ? {
        align: "left" as const,
        verticalAlign: "bottom" as const,
        wrapperStyle: { paddingLeft: 4 },
      }
    : { align: "center" as const, verticalAlign: "bottom" as const };

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-xl font-semibold">Vidéo de démonstration — exemple de stats</h2>
        <p className="mt-1 text-sm text-neutral-400">
          Données fictives à titre d’illustration : voici le type de suivi que tu obtiens
          une fois ton compte connecté.
        </p>
      </header>

      <section className="rounded-2xl border border-neutral-700 bg-neutral-800/60 backdrop-blur p-4 xs:p-2">
        <h3 className="font-medium mb-2 text-neutral-200">Vues / jour</h3>
        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 800, height: 288 }}>
            <LineChart data={daily} margin={chartMargin}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" tickFormatter={formatDayLabel} />
              <YAxis tickFormatter={(v) => formatNumber(Number(v))} width={70} />
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
              <Line type="monotone" dataKey="views" name="Vues" dot={false} strokeWidth={2} stroke={COLOR_VIEWS} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-700 bg-neutral-800/60 backdrop-blur p-4 xs:p-2">
        <h3 className="font-medium mb-2 text-neutral-200">Engagement / jour (Likes, Commentaires)</h3>
        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 800, height: 288 }}>
            <LineChart data={daily} margin={chartMargin}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" tickFormatter={formatDayLabel} />
              <YAxis tickFormatter={(v) => formatNumber(Number(v))} width={70} />
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
              <Line type="monotone" dataKey="likes" name="Likes" dot={false} strokeWidth={2} stroke={COLOR_LIKES} />
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

      <section className="rounded-2xl border border-neutral-700 bg-neutral-800/60 backdrop-blur p-4 xs:p-2">
        <h3 className="font-medium mb-2 text-neutral-200">Vues / heure</h3>
        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 800, height: 288 }}>
            <LineChart data={hourly} margin={chartMargin}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="at" tickFormatter={formatHourLabel} />
              <YAxis tickFormatter={(v) => formatNumber(Number(v))} width={70} />
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
              <Line type="monotone" dataKey="views" name="Vues" dot={false} strokeWidth={2} stroke={COLOR_VIEWS} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-700 bg-neutral-800/60 backdrop-blur p-4 xs:p-2">
        <h3 className="font-medium mb-2 text-neutral-200">Engagement / heure (Likes, Commentaires)</h3>
        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 800, height: 288 }}>
            <LineChart data={hourly} margin={chartMargin}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="at" tickFormatter={formatHourLabel} />
              <YAxis tickFormatter={(v) => formatNumber(Number(v))} width={70} />
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
              <Line type="monotone" dataKey="likes" name="Likes" dot={false} strokeWidth={2} stroke={COLOR_LIKES} />
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
