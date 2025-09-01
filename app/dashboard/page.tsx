// app/dashboard/page.tsx
import Image from "next/image";

type VideoItem = {
  id: string;
  platform: "youtube" | "tiktok";
  title: string;
  thumbnail: string;
  url: string;
  publishedAt: string;
};

async function getVideos() {
  const base = process.env.NEXT_PUBLIC_BASE_URL!;
  const res = await fetch(`${base}/api/videos`, { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json();
  return data.videos ?? [];
}

const KPI = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-2xl bg-neutral-800/70 backdrop-blur-md border border-white/10 p-6 text-center shadow-lg">
    <div className="text-sm text-neutral-400">{label}</div>
    <div className="text-2xl font-semibold">{value}</div>
  </div>
);

export default async function Dashboard() {
  const videos = await getVideos();

  const kpis = [
    { label: "Total vidéos", value: String(videos.length || "—") },
    { label: "YT récents", value: String(videos.filter(v => v.platform === "youtube").length || "—") },
    { label: "TT récents", value: String(videos.filter(v => v.platform === "tiktok").length || "—") },
    { label: "Articles WordPress", value: "—" },
  ];

  return (
    <section className="space-y-8">
      <h2 className="text-3xl font-semibold text-center">Dashboard</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((k) => <KPI key={k.label} {...k} />)}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {videos.slice(0, 9).map((v) => (
          <a
            key={`${v.platform}-${v.id}`}
            href={v.url}
            target="_blank"
            rel="noreferrer"
            className="rounded-2xl overflow-hidden bg-neutral-800/70 backdrop-blur-md border border-white/10 shadow-lg"
          >
            <div className="relative w-full aspect-video">
              {v.thumbnail ? (
                <Image src={v.thumbnail} alt={v.title} fill className="object-cover" />
              ) : (
                <div className="w-full h-full bg-neutral-900" />
              )}
            </div>
            <div className="p-4">
              <div className="font-medium line-clamp-2">{v.title}</div>
              <div className="text-sm text-neutral-400">
                {v.platform.toUpperCase()} • {new Date(v.publishedAt).toLocaleDateString()}
              </div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
