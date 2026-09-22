"use client";

import { useMemo } from "react";
import { useIsXs } from "@/utils/useIsXs";
import { LOCALE, useUiLang, type Lang } from "@/lib/uiLang";
import demoVideos, { type DemoVideo } from "@/data/demo-videos";
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

/** Données 100% fictives, générées côté client (pas d'appel API). La forme
 *  des courbes est arbitraire ; seules les échelles comptent : elles sont
 *  calées sur les chiffres de la vignette cliquée (`?v=<id>`), pour qu'un
 *  visiteur retrouve ici les vues, likes et commentaires vus sur la carte. */

type Targets = { views: number; likes: number; comments: number };

/** Repli quand aucune vidéo n'est désignée (accès direct à /demo/analytics). */
const DEFAULT_TARGETS: Targets = { views: 2000, likes: 180, comments: 40 };

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

/** Likes et commentaires d'un point, dans les proportions de la vignette mais
 *  avec une variation d'un point à l'autre : à proportion fixe, la courbe du
 *  taux d'engagement serait une droite horizontale. */
function interactions(views: number, targets: Targets, i: number) {
  const base = Math.max(1, targets.views);
  return {
    likes: Math.round(views * (targets.likes / base) * (1 + 0.18 * Math.sin(i * 0.9))),
    comments: Math.round(views * (targets.comments / base) * (1 + 0.25 * Math.cos(i * 1.3))),
  };
}

function buildDemoDaily(targets: Targets): DailyPoint[] {
  const today = new Date();
  return Array.from({ length: 14 }).map((_, i) => {
    const day = new Date(today);
    day.setDate(day.getDate() - (13 - i));
    // Montée régulière jusqu'au total de la vignette au dernier jour.
    const shape = 0.34 + (0.66 * i) / 13 + (i % 3 === 0 ? 0.03 : i % 2 === 0 ? -0.02 : 0.01);
    const views = Math.max(1, Math.round(targets.views * shape));
    const { likes, comments } = interactions(views, targets, i);
    return {
      day: day.toISOString(),
      views,
      likes,
      comments,
      engagement: engagementRate(views, likes, comments),
    };
  });
}

function buildDemoHourly(targets: Targets): HourlyPoint[] {
  const now = new Date();
  // Une heure pèse une fraction de la journée : l'échelle horaire reste
  // cohérente avec l'échelle journalière, donc avec la vignette.
  const peak = Math.max(1, targets.views / 18);
  return Array.from({ length: 24 }).map((_, i) => {
    const at = new Date(now);
    at.setHours(at.getHours() - (23 - i), 0, 0, 0);
    const hour = at.getHours();
    const wave = Math.sin(((hour - 6) / 24) * Math.PI * 2);
    const views = Math.max(1, Math.round(peak * (0.62 + 0.38 * wave) + (i % 4 === 0 ? peak * 0.06 : 0)));
    const { likes, comments } = interactions(views, targets, i);
    return {
      at: at.toISOString(),
      views,
      likes,
      comments,
      engagement: engagementRate(views, likes, comments),
    };
  });
}

/** Titre affiché : celui de la vignette cliquée, dans la langue courante. */
function videoTitle(v: DemoVideo, lang: Lang): string {
  const title = (lang === "en" && v.en?.title) || v.title;
  return title.replace(/[\r\n]+/g, " ").trim();
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

const PLATFORM_LABEL: Record<DemoVideo["platform"], string> = {
  youtube: "YouTube",
  tiktok: "TikTok",
  instagram: "Instagram",
};

const COLOR_VIEWS = "#16a34a";
const COLOR_LIKES = "#dc2626";
const COLOR_COMMS = "#2563eb";
const COLOR_ENGAGE = "#a855f7"; // violet — axe de droite, en %

export default function DemoVideoAnalytics({ videoId }: { videoId?: string }) {
  const isXs = useIsXs();
  const [lang] = useUiLang();
  const t = T[lang];
  const locale = LOCALE[lang];

  const video = useMemo(
    () => demoVideos.find((v) => v.id === videoId),
    [videoId],
  );
  const targets = useMemo<Targets>(
    () =>
      video
        ? { views: video.views, likes: video.likes, comments: video.comments }
        : DEFAULT_TARGETS,
    [video],
  );

  const daily = useMemo(() => buildDemoDaily(targets), [targets]);
  const hourly = useMemo(() => buildDemoHourly(targets), [targets]);

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
        <h2 className="text-xl font-semibold">
          {video ? `${videoTitle(video, lang)} — ${PLATFORM_LABEL[video.platform]}` : t.title}
        </h2>
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
