// app/analytics/[videoId]/page.tsx
import BackLink from "@/components/BackLink";
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
        <BackLink href="/dashboard" label={{ fr: "Dashboard", en: "Dashboard" }} />
      </div>

      <VideoAnalytics videoId={videoId} platform={platform} />
    </main>
  );
}
