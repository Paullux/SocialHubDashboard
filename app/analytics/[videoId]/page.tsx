// app/analytics/[videoId]/page.tsx
import Link from "next/link";
import VideoAnalytics from "@/components/VideoAnalytics";

type Params = { videoId: string };
type Search = Record<string, string | string[] | undefined>;

export default async function AnalyticsPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams?: Promise<Search>;
}) {
  const { videoId } = await params;
  const sp = (await (searchParams ?? Promise.resolve({}))) as Search;

  const rawPlatform = Array.isArray(sp.platform) ? sp.platform[0] : sp.platform;
  const platform =
    rawPlatform === "tiktok" || rawPlatform === "instagram"
      ? rawPlatform
      : "youtube";

  return (
    <main className="pt-24 px-4 sm:px-6 max-w-7xl mx-auto space-y-4">
      <div className="sticky top-16 z-10">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-800/90 backdrop-blur px-3 py-1.5 text-sm text-white hover:bg-neutral-700"
          aria-label="Retour au dashboard"
        >
          <span aria-hidden>←</span>
          <span className="hidden xs:inline">Dashboard</span>
          <span className="xs:hidden">Retour</span>
        </Link>
      </div>

      <VideoAnalytics videoId={videoId} platform={platform} />
    </main>
  );
}
