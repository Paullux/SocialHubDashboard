import type { ReactNode } from "react";
import { requireDashboardUser } from "@/lib/auth";

export default async function AnalyticsLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireDashboardUser();
  return children;
}
