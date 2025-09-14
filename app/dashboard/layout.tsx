// app/dashboard/layout.tsx
import { ReactNode } from "react";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  // Tu peux laisser ces logs en dev
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  console.log("User:", user?.given_name, user?.family_name);

  // Pas de gros padding ici : le spacing est géré par la page
  return (
    <section className="mx-auto max-w-7xl px-4">
      {children}
    </section>
  );
}
