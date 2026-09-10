// app/dashboard/layout.tsx
import { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  // Pas de gros padding ici : le spacing est géré par la page.
  // L'accès est déjà gardé par le middleware (`proxy.ts`, permission `read:dashboard`).
  return (
    <section className="mx-auto max-w-7xl px-4">
      {children}
    </section>
  );
}
