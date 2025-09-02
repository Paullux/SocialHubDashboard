// app/dashboard/page.tsx
// TODO: améliorer le design des cartes vidéos (ajouter avatar chaîne ?)
// TODO: ajouter pagination ou bouton "Voir plus"
// TODO: brancher les KPI "Articles WordPress" sur l’API WP
import Image from "next/image";
import { headers } from "next/headers";
import type { VideoItem } from "@/lib/fetchVideos";

const normalizeThumb = (u: string) =>
  u?.startsWith("//") ? `https:${u}` : u || "";

async function getBaseUrl() {
  const h = await headers(); // ← TS content
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto =
    h.get("x-forwarded-proto") ??
    (process.env.NODE_ENV === "production" ? "https" : "http");
  return `${proto}://${host}`;
}

async function getVideos(): Promise<VideoItem[]> {
  const base = await getBaseUrl();
  const res = await fetch(`${base}/api/videos`, { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json();
  return (data?.videos ?? []) as VideoItem[];
}

const KPI = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-2xl bg-neutral-800/70 backdrop-blur-md border border-white/10 p-6 text-center shadow-lg">
    <div className="text-sm text-neutral-300">{label}</div>
    <div className="text-2xl font-semibold">{value}</div>
  </div>
);

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(
    new Date(iso)
  );

export default async function Dashboard() {
  const videos = await getVideos().catch(() => []);
  const ytCount = videos.filter((v) => v.platform === "youtube").length;
  const ttCount = videos.filter((v) => v.platform === "tiktok").length;

  const kpis = [
    { label: "Total vidéos", value: String(videos.length || "—") },
    { label: "YT récents", value: String(ytCount || "—") },
    { label: "TT récents", value: String(ttCount || "—") },
    { label: "Articles WordPress", value: "—" },
  ];

  const loading = videos.length === 0;

  return (
    <section className="mx-auto max-w-6xl space-y-8">
      <h2 className="text-3xl font-semibold text-center">Dashboard</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 justify-center">
        {kpis.map((k) => (
          <KPI key={k.label} {...k} />
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-56 rounded-2xl bg-neutral-800/50 border border-white/10 animate-pulse"
              />
            ))
          : videos.slice(0, 9).map((v) => (
              <a
                key={`${v.platform}:${v.id}`}
                href={v.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-2xl overflow-hidden bg-neutral-800/70 backdrop-blur-md border border-white/10 shadow-lg"
              >
                <div className="relative w-full aspect-[16/9]">
                  {v.thumbnail ? (
                    <Image
                      src={normalizeThumb(v.thumbnail)}
                      alt={v.title}
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full bg-neutral-900" />
                  )}
                </div>
                <div className="p-4">
                  <div className="font-medium line-clamp-2">{v.title}</div>
                  <div className="text-sm text-neutral-400">
                    {v.platform.toUpperCase()} • {formatDate(v.publishedAt)}
                  </div>

                  {/* 👉 Bouton embed */}
                  {v.embedLink && (
                    <a
                      href={v.embedLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-blue-400 opacity-70 hover:opacity-100"
                    >
                      Ouvrir l’embed
                    </a>
                  )}
                </div>
              </a>
            ))}
      </div>
    </section>
  );
}
