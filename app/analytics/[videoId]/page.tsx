// app/analytics/[videoId]/page.tsx
import VideoAnalytics from "@/components/VideoAnalytics";

type Params = { videoId: string };

export default async function AnalyticsPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { videoId } = await params;

  return (
    <main className="p-6 max-w-7xl mx-auto">
      <VideoAnalytics videoId={videoId} platform="youtube" />
    </main>
  );
}
