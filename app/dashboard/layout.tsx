// app/dashboard/layout.tsx
import type { ReactNode } from "react";
import { requireDashboardUser } from "@/lib/auth";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  // Défense en profondeur : le proxy filtre déjà le token, mais le rendu de
  // chaque page protégée exige aussi explicitement un user.id Kinde et la
  // permission read:dashboard côté serveur.
  await requireDashboardUser();

  // Pas de gros padding ici : le spacing est géré par la page.
  return (
    <section className="mx-auto max-w-7xl px-4">
      {children}
    </section>
  );
}
