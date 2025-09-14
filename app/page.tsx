// app/page.tsx
import Link from "next/link";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export default async function HomePage() {
  const { getPermission } = getKindeServerSession();
  const access = await getPermission("read:dashboard");
  const canSeeDashboard = !!access?.isGranted;

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <div className="rounded-2xl p-8 border border-neutral-800 bg-neutral-900/60 backdrop-blur">
        <h1 className="text-2xl font-semibold mb-3 text-neutral-100">Bienvenue sur Social-Hub</h1>
        <p className="opacity-80 text-neutral-300 mb-6">
          Agrégateur de vidéos et KPIs multi-plateformes (YouTube, TikTok…).
        </p>

        <div className="flex gap-3">
          {canSeeDashboard ? (
            <Link
              href="/dashboard"
              className="rounded-md border border-neutral-700 bg-neutral-800 px-4 py-2 text-sm font-medium text-neutral-100 hover:bg-neutral-700"
            >
              Dashboard
            </Link>
          ) : (
            <Link
              href="/login"
              className="rounded-md border border-neutral-700 bg-neutral-800 px-4 py-2 text-sm font-medium text-neutral-100 hover:bg-neutral-700"
            >
              Se connecter
            </Link>
          )}

          <Link
            href="/demo"
            className="rounded-md border border-neutral-800 px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-900"
          >
            Voir la démo
          </Link>
        </div>
      </div>
    </main>
  );
}
