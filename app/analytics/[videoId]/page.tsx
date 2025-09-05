// app/analytics/[videoId]/page.tsx
import VideoAnalytics from "@/components/VideoAnalyticsClient";

export default function AnalyticsPage({ params }: { params: { videoId: string } }) {
  return (
    <main className="p-6 max-w-7xl mx-auto">
      <VideoAnalytics videoId={params.videoId} platform="youtube" />
    </main>
  );
}
