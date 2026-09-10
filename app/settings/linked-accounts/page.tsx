// app/settings/linked-accounts/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import EraseData from "@/components/settings/EraseData";
import { useUiLang } from "@/lib/uiLang";
import LangToggle from "@/components/legal/LangToggle";

type LinkData = {
  provider: string;
  username: string | null;
};

const T = {
  fr: {
    title: "Comptes liés",
    langLabel: "Langue",
    loading: "Chargement…",
    loadError: "Impossible de récupérer les comptes.",
    connectedAs: "Connecté en tant que",
    connected: "Connecté",
    reconnect: "Reconnecter",
    disconnect: "Déconnecter",
    connect: "Connecter",
    back: "← Retour au dashboard",
  },
  en: {
    title: "Linked accounts",
    langLabel: "Language",
    loading: "Loading…",
    loadError: "Unable to load your accounts.",
    connectedAs: "Connected as",
    connected: "Connected",
    reconnect: "Reconnect",
    disconnect: "Disconnect",
    connect: "Connect",
    back: "← Back to the dashboard",
  },
} as const;

export default function LinkedAccountsPage() {
  const [lang, setLang] = useUiLang();
  const t = T[lang];
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
      <div className="flex items-start justify-between gap-3">
        <h1 className="text-2xl font-semibold">{t.title}</h1>
        <LangToggle lang={lang} onChange={setLang} label={t.langLabel} />
      </div>

      {loading ? (
        <p>{t.loading}</p>
      ) : !links ? (
        <p>{t.loadError}</p>
      ) : (
        <>
          {/* YouTube */}
          <section className="rounded-2xl border p-4">
            <h2 className="text-lg font-medium">YouTube</h2>
            {byProvider["google-youtube"] ? (
              <div className="mt-2 flex items-center justify-between">
                <div className="text-sm opacity-80">
                  {t.connectedAs}{" "}
                  <b>{byProvider["google-youtube"].username ?? "—"}</b>
                </div>
                <div className="flex gap-2">
                  <Btn href="/api/oauth/google-youtube/start?reconnect=1">
                    {t.reconnect}
                  </Btn>
                  <Btn href="/api/oauth/disconnect?provider=google-youtube">
                    {t.disconnect}
                  </Btn>
                </div>
              </div>
            ) : (
              <div className="mt-2">
                <Btn href="/api/oauth/google-youtube/start">{t.connect}</Btn>
              </div>
            )}
          </section>

          {/* TikTok */}
          <section className="rounded-2xl border p-4">
            <h2 className="text-lg font-medium">TikTok</h2>
            {byProvider["tiktok"] ? (
              <div className="mt-2 flex items-center justify-between">
                <div className="text-sm opacity-80">
                  {t.connected}: <b>{byProvider["tiktok"].username ?? "—"}</b>
                </div>
                <div className="flex gap-2">
                  <Btn href="/api/oauth/tiktok/start?reconnect=1">{t.reconnect}</Btn>
                  <Btn href="/api/oauth/disconnect?provider=tiktok">
                    {t.disconnect}
                  </Btn>
                </div>
              </div>
            ) : (
              <div className="mt-2">
                <Btn href="/api/oauth/tiktok/start">{t.connect}</Btn>
              </div>
            )}
          </section>

          {/* Instagram */}
          <section className="rounded-2xl border p-4">
            <h2 className="text-lg font-medium">Instagram</h2>
            {byProvider["instagram"] ? (
              <div className="mt-2 flex items-center justify-between">
                <div className="text-sm opacity-80">
                  {t.connected}: <b>{byProvider["instagram"].username ?? "—"}</b>
                </div>
                <div className="flex gap-2">
                  <Btn href="/api/oauth/instagram/start?reconnect=1">
                    {t.reconnect}
                  </Btn>
                  <Btn href="/api/oauth/disconnect?provider=instagram">
                    {t.disconnect}
                  </Btn>
                </div>
              </div>
            ) : (
              <div className="mt-2">
                <Btn href="/api/oauth/instagram/start">{t.connect}</Btn>
              </div>
            )}
          </section>

          <EraseData />
        </>
      )}

      <div className="pt-2">
        <Link href="/dashboard" className="underline">
          {t.back}
        </Link>
      </div>
    </div>
  );
}
