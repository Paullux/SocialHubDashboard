// app/analytics/[videoId]/page.tsx
import VideoAnalytics from "@/components/VideoAnalytics";

export default async function AnalyticsPage(props: any) {
  const { videoId } = await props.params; // params est un Promise en Next 15 canary
  return (
    <main className="p-6 max-w-7xl mx-auto">
      <VideoAnalytics videoId={videoId} platform="youtube" />
    </main>
  );
}
