// app/analytics/[videoId]/page.tsx
import Link from "next/link";
import VideoAnalytics from "@/components/VideoAnalytics";

type Params = { videoId: string };
// Next 15 canary: searchParams est un Promise<Record<string, ...>>
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

  const raw = sp.platform;
  const platform =
    raw === "tiktok"
      ? "tiktok"
      : Array.isArray(raw)
      ? raw[0] === "tiktok"
        ? "tiktok"
        : "youtube"
      : "youtube";

  return (
    <main className="p-6 max-w-7xl mx-auto space-y-4">
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border border-neutral-700 bg-neutral-800 text-white hover:bg-neutral-700"
        >
          <span aria-hidden>←</span> Dashboard
        </Link>
      </div>

      <VideoAnalytics videoId={videoId} platform={platform} />
    </main>
  );
}
