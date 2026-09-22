// app/demo/analytics/page.tsx
import BackLink from "@/components/BackLink";
import DemoVideoAnalytics from "@/components/DemoVideoAnalyticsClient";

export default function DemoAnalyticsPage() {
  return (
    <main className="pt-24 px-4 sm:px-6 max-w-7xl mx-auto space-y-4">
      <div className="sticky top-16 z-10">
        <BackLink href="/demo" label={{ fr: "Démo", en: "Demo" }} />
      </div>

      <DemoVideoAnalytics />
    </main>
  );
}
