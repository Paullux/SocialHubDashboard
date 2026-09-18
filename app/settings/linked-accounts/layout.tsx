import type { ReactNode } from "react";
import { requireDashboardUser } from "@/lib/auth";

export default async function LinkedAccountsLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireDashboardUser();
  return children;
}
