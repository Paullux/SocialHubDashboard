"use client";

import { useMemo } from "react";
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

/** Données 100% fictives, générées côté client (pas d'appel API). Sert de
 *  page "Stats" identique pour toutes les vidéos de la démo /demo. */

type DailyPoint = {
  day: string;
  views: number;
  likes: number;
  comments: number;
  engagement: number;
};
type HourlyPoint = {
  at: string;
  views: number;
  likes: number;
  comments: number;
  engagement: number;
};

/** Même calcul que `VideoAnalytics` : (likes + commentaires) / vues, en %. */
function engagementRate(views: number, likes: number, comments: number): number {
  return Math.round(((likes + comments) / views) * 1000) / 10;
}

function buildDemoDaily(): DailyPoint[] {
  const today = new Date();
  return Array.from({ length: 14 }).map((_, i) => {
    const day = new Date(today);
    day.setDate(day.getDate() - (13 - i));
    const views = Math.round(650 + i * 95 + (i % 3 === 0 ? 60 : i % 2 === 0 ? -30 : 15));
    // Ratios qui varient d'un jour à l'autre : à proportion fixe, la courbe du
    // taux d'engagement serait une droite horizontale.
    const likes = Math.round(views * (0.085 + 0.02 * Math.sin(i * 0.9)));
    const comments = Math.round(views * (0.018 + 0.006 * Math.cos(i * 1.3)));
    return {
      day: day.toISOString(),
      views,
      likes,
      comments,
      engagement: engagementRate(views, likes, comments),
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
    const likes = Math.round(views * (0.08 + 0.03 * Math.sin(i * 0.7)));
    const comments = Math.round(views * (0.02 + 0.01 * Math.cos(i * 1.1)));
    return {
      at: at.toISOString(),
      views,
      likes,
      comments,
      engagement: engagementRate(views, likes, comments),
    };
  });
}

function formatDayLabel(iso: string, locale: string) {
  return new Date(iso).toLocaleDateString(locale, { day: "2-digit", month: "2-digit" });
}
function formatHourLabel(iso: string, locale: string) {
  return new Date(iso).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
}
function formatNumber(n: number, locale: string) {
  return new Intl.NumberFormat(locale).format(n);
}
/** Le français sépare le signe % du nombre par une espace insécable, pas l'anglais. */
function percentSuffix(locale: string) {
  return locale.startsWith("fr") ? "\u00a0%" : "%";
}
function formatPercent(n: number, locale: string) {
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(n)}${percentSuffix(locale)}`;
}


const T = {
  fr: {
    views: "Vues",
    likes: "Likes",
    comments: "Commentaires",
    shares: "Partages",
    engagement: "Taux d’engagement",
    viewsDay: "Vues / jour",
    viewsHour: "Vues / heure",
    title: "Vidéo de démonstration — exemple de stats",
    intro:
      "Données fictives à titre d’illustration : voici le type de suivi que tu obtiens une fois ton compte connecté.",
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
    title: "Demo video — sample stats",
    intro:
      "Fictional data for illustration: this is the kind of tracking you get once your account is connected.",
    engagementDay: "Engagement / day — likes, comments and rate",
    engagementHour: "Engagement / hour — likes, comments and rate",
  },
} as const;

const COLOR_VIEWS = "#16a34a";
const COLOR_LIKES = "#dc2626";
const COLOR_COMMS = "#2563eb";
const COLOR_ENGAGE = "#a855f7"; // violet — axe de droite, en %

export default function DemoVideoAnalytics() {
  const isXs = useIsXs();
  const [lang] = useUiLang();
  const t = T[lang];
  const locale = LOCALE[lang];
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
        <h2 className="text-xl font-semibold">{t.title}</h2>
        <p className="mt-1 text-sm text-neutral-400">
          {t.intro}
        </p>
      </header>

      <section className="rounded-2xl border border-neutral-700 bg-neutral-800/60 backdrop-blur p-4 xs:p-2">
        <h3 className="font-medium mb-2 text-neutral-200">{t.viewsDay}</h3>
        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 800, height: 288 }}>
            <LineChart data={daily} margin={chartMargin}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" tickFormatter={(v) => formatDayLabel(v, locale)} />
              <YAxis tickFormatter={(v) => formatNumber(Number(v), locale)} width={70} />
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
              <Line type="monotone" dataKey="views" name={t.views} dot={false} strokeWidth={2} stroke={COLOR_VIEWS} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-700 bg-neutral-800/60 backdrop-blur p-4 xs:p-2">
        <h3 className="font-medium mb-2 text-neutral-200">{t.engagementDay}</h3>
        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 800, height: 288 }}>
            <LineChart data={daily} margin={chartMargin}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" tickFormatter={(v) => formatDayLabel(v, locale)} />
              <YAxis yAxisId="left" tickFormatter={(v) => formatNumber(Number(v), locale)} width={70} />
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
                    ? formatPercent(Number(value), locale)
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
              <Line yAxisId="left" type="monotone" dataKey="likes" name={t.likes} dot={false} strokeWidth={2} stroke={COLOR_LIKES} />
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
                stroke={COLOR_ENGAGE}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-700 bg-neutral-800/60 backdrop-blur p-4 xs:p-2">
        <h3 className="font-medium mb-2 text-neutral-200">{t.viewsHour}</h3>
        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 800, height: 288 }}>
            <LineChart data={hourly} margin={chartMargin}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="at" tickFormatter={(v) => formatHourLabel(v, locale)} />
              <YAxis tickFormatter={(v) => formatNumber(Number(v), locale)} width={70} />
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
              <Line type="monotone" dataKey="views" name={t.views} dot={false} strokeWidth={2} stroke={COLOR_VIEWS} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-700 bg-neutral-800/60 backdrop-blur p-4 xs:p-2">
        <h3 className="font-medium mb-2 text-neutral-200">{t.engagementHour}</h3>
        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 800, height: 288 }}>
            <LineChart data={hourly} margin={chartMargin}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="at" tickFormatter={(v) => formatHourLabel(v, locale)} />
              <YAxis yAxisId="left" tickFormatter={(v) => formatNumber(Number(v), locale)} width={70} />
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
                    ? formatPercent(Number(value), locale)
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
              <Line yAxisId="left" type="monotone" dataKey="likes" name={t.likes} dot={false} strokeWidth={2} stroke={COLOR_LIKES} />
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
                stroke={COLOR_ENGAGE}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
