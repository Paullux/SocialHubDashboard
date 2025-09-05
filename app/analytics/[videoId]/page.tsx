// app/analytics/[videoId]/page.tsx
import VideoAnalytics from "@/components/VideoAnalytics";

type P = { videoId: string };

export default async function AnalyticsPage({
  params,
}: {
  params: P | Promise<P>;
}) {
  const { videoId } = await Promise.resolve(params);

  return (
    <main className="p-6 max-w-7xl mx-auto">
      <VideoAnalytics videoId={videoId} platform="youtube" />
    </main>
  );
}

