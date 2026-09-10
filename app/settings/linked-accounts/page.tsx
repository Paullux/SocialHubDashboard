// app/settings/linked-accounts/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import EraseData from "@/components/settings/EraseData";

type LinkData = {
  provider: string;
  username: string | null;
};

export default function LinkedAccountsPage() {
  const [links, setLinks] = useState<LinkData[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/linked-accounts")
      .then((res) => {
        if (!res.ok) throw new Error("Non autorisé");
        return res.json();
      })
      .then((data) => {
        setLinks(data.links);
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => setLoading(false));
  }, []);

  const byProvider = links
    ? Object.fromEntries(links.map((l) => [l.provider, l]))
    : {};

  if (loading) return <p>Chargement…</p>;
  if (!links) return <p>Impossible de récupérer les comptes.</p>;

  const Btn = ({
    href,
    children,
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a
      href={href}
      className="inline-flex items-center rounded-lg border px-3 py-2 hover:bg-neutral-900"
    >
      {children}
    </a>
  );

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-semibold">Comptes liés</h1>

      {/* YouTube */}
      <section className="rounded-2xl border p-4">
        <h2 className="text-lg font-medium">YouTube</h2>
        {byProvider["google-youtube"] ? (
          <div className="mt-2 flex items-center justify-between">
            <div className="text-sm opacity-80">
              Connecté en tant que{" "}
              <b>{byProvider["google-youtube"].username ?? "—"}</b>
            </div>
            <div className="flex gap-2">
              <Btn href="/api/oauth/google-youtube/start?reconnect=1">
                Reconnecter
              </Btn>
              <Btn href="/api/oauth/disconnect?provider=google-youtube">
                Déconnecter
              </Btn>
            </div>
          </div>
        ) : (
          <div className="mt-2">
            <Btn href="/api/oauth/google-youtube/start">Connecter</Btn>
          </div>
        )}
      </section>

      {/* TikTok */}
      <section className="rounded-2xl border p-4">
        <h2 className="text-lg font-medium">TikTok</h2>
        {byProvider["tiktok"] ? (
          <div className="mt-2 flex items-center justify-between">
            <div className="text-sm opacity-80">
              Connecté: <b>{byProvider["tiktok"].username ?? "—"}</b>
            </div>
            <div className="flex gap-2">
              <Btn href="/api/oauth/tiktok/start?reconnect=1">Reconnecter</Btn>
              <Btn href="/api/oauth/disconnect?provider=tiktok">
                Déconnecter
              </Btn>
            </div>
          </div>
        ) : (
          <div className="mt-2">
            <Btn href="/api/oauth/tiktok/start">Connecter</Btn>
          </div>
        )}
      </section>

      {/* Instagram */}
      <section className="rounded-2xl border p-4">
        <h2 className="text-lg font-medium">Instagram</h2>
        {byProvider["instagram"] ? (
          <div className="mt-2 flex items-center justify-between">
            <div className="text-sm opacity-80">
              Connecté: <b>{byProvider["instagram"].username ?? "—"}</b>
            </div>
            <div className="flex gap-2">
              <Btn href="/api/oauth/instagram/start?reconnect=1">
                Reconnecter
              </Btn>
              <Btn href="/api/oauth/disconnect?provider=instagram">
                Déconnecter
              </Btn>
            </div>
          </div>
        ) : (
          <div className="mt-2">
            <Btn href="/api/oauth/instagram/start">Connecter</Btn>
          </div>
        )}
      </section>

      <EraseData />

      <div className="pt-2">
        <Link href="/dashboard" className="underline">
          ← Retour au dashboard
        </Link>
      </div>
    </div>
  );
}

