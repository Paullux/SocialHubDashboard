// app/demo/analytics/page.tsx
import Link from "next/link";
import DemoVideoAnalytics from "@/components/DemoVideoAnalyticsClient";

export default function DemoAnalyticsPage() {
  return (
    <main className="pt-24 px-4 sm:px-6 max-w-7xl mx-auto space-y-4">
      <div className="sticky top-16 z-10">
        <Link
          href="/demo"
          className="inline-flex items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-800/90 backdrop-blur px-3 py-1.5 text-sm text-white hover:bg-neutral-700"
          aria-label="Retour à la démo"
        >
          <span aria-hidden>←</span>
          <span className="hidden xs:inline">Démo</span>
          <span className="xs:hidden">Retour</span>
        </Link>
      </div>

      <DemoVideoAnalytics />
    </main>
  );
}
