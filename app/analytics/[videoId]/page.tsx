// app/analytics/[videoId]/page.tsx
import Link from "next/link";
import VideoAnalytics from "@/components/VideoAnalytics";

type Params = { videoId: string };
type Search = { platform?: "youtube" | "tiktok" };

export default async function AnalyticsPage({
  params,
  searchParams,
}: {
  params: Promise<Params>; // Next 15 canary : Promise
  searchParams?: Promise<Search> | Search;
}) {
  const { videoId } = await params;
  const sp = await Promise.resolve(searchParams ?? {});
  const platform = (sp.platform === "tiktok" ? "tiktok" : "youtube") as
    | "youtube"
    | "tiktok";

  return (
    <main className="p-6 max-w-7xl mx-auto space-y-4">
      {/* Bouton retour */}
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border border-neutral-700 bg-neutral-800 text-white hover:bg-neutral-700"
        >
          <span aria-hidden>←</span> Dashboard
        </Link>
      </div>

      {/* Graphes */}
      <VideoAnalytics videoId={videoId} platform={platform} />
    </main>
  );
}
