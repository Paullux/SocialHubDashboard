// components/home/HomeContent.tsx
"use client";

import Link from "next/link";
import { useUiLang } from "@/lib/uiLang";
import LangToggle from "@/components/legal/LangToggle";

const copy = {
  fr: {
    login: "Se connecter",
    dashboard: "Dashboard",
    demo: "Voir la démo du dashboard",
    demoCaption:
      "Aucune inscription requise : la démo montre exactement ce que les autorisations demandées permettent d'afficher.",
    hero: "Le tableau de bord unique pour suivre les statistiques de tes vidéos YouTube, TikTok et Instagram — vues, likes, commentaires, partages — sans jongler entre les apps.",
    howTitle: "Comment ça marche",
    howBody:
      "Un créateur qui publie sur plusieurs plateformes doit habituellement ouvrir chaque application pour connaître ses chiffres. Social-Hub rassemble tout au même endroit : un seul tableau de bord listant toutes tes vidéos, triable par date, vues, likes, commentaires et partages, avec un historique conservé automatiquement.",
    howReadOnly:
      "Social-Hub est strictement en lecture seule : le service consulte tes statistiques, il ne publie, ne modifie et ne supprime jamais rien sur tes comptes.",
    dataTitle: "Utilisation de tes données YouTube/TikTok/Instagram",
    dataBody: (
      <>
        Lorsque tu connectes un compte, Social-Hub demande uniquement des
        accès en lecture seule&nbsp;: pour YouTube{" "}
        <code className="text-neutral-200">youtube.readonly</code> et{" "}
        <code className="text-neutral-200">yt-analytics.readonly</code>, pour
        TikTok <code className="text-neutral-200">user.info.basic</code> et{" "}
        <code className="text-neutral-200">video.list</code>, pour Instagram{" "}
        <code className="text-neutral-200">instagram_basic</code> et{" "}
        <code className="text-neutral-200">instagram_manage_insights</code>.
        Ces accès servent uniquement à afficher la liste de tes vidéos et
        leurs statistiques publiques. Ces données ne sont jamais utilisées à
        des fins publicitaires, ni vendues ni transmises à des tiers. Tu peux
        révoquer ces accès à tout moment depuis la page{" "}
        <Link href="/settings/linked-accounts" className="underline hover:text-neutral-100">
          Comptes liés
        </Link>{" "}
        ou, pour Google, depuis{" "}
        <a
          href="https://myaccount.google.com/permissions"
          className="underline hover:text-neutral-100"
        >
          myaccount.google.com/permissions
        </a>
        .
      </>
    ),
    privacy: "Politique de confidentialité",
    terms: "Mentions légales & CGU",
    langLabel: "Langue de la page",
  },
  en: {
    login: "Log in",
    dashboard: "Dashboard",
    demo: "View the dashboard demo",
    demoCaption:
      "No sign-up needed: the demo shows exactly what the requested permissions let the app display.",
    hero: "The single dashboard to track your YouTube, TikTok and Instagram video stats — views, likes, comments, shares — without juggling between apps.",
    howTitle: "How it works",
    howBody:
      "Creators who publish across several platforms usually have to open each app separately to check their numbers. Social-Hub brings it all together in one place: a single dashboard listing all your videos, sortable by date, views, likes, comments and shares, with history kept automatically.",
    howReadOnly:
      "Social-Hub is strictly read-only: the service reads your statistics, it never posts, edits or deletes anything on your accounts.",
    dataTitle: "Use of your YouTube/TikTok/Instagram data",
    dataBody: (
      <>
        When you connect an account, Social-Hub only requests read-only
        scopes: for YouTube{" "}
        <code className="text-neutral-200">youtube.readonly</code> and{" "}
        <code className="text-neutral-200">yt-analytics.readonly</code>, for
        TikTok <code className="text-neutral-200">user.info.basic</code> and{" "}
        <code className="text-neutral-200">video.list</code>, for Instagram{" "}
        <code className="text-neutral-200">instagram_basic</code> and{" "}
        <code className="text-neutral-200">instagram_manage_insights</code>.
        These scopes are only used to display your video list and public
        statistics. This data is never used for advertising, sold, or shared
        with third parties. You can revoke this access at any time from the{" "}
        <Link href="/settings/linked-accounts" className="underline hover:text-neutral-100">
          Linked accounts
        </Link>{" "}
        page or, for Google, from{" "}
        <a
          href="https://myaccount.google.com/permissions"
          className="underline hover:text-neutral-100"
        >
          myaccount.google.com/permissions
        </a>
        .
      </>
    ),
    privacy: "Privacy Policy",
    terms: "Legal notice & Terms",
    langLabel: "Page language",
  },
} as const;

export default function HomeContent({ canSeeDashboard }: { canSeeDashboard: boolean }) {
  const [lang, setLang] = useUiLang();
  const t = copy[lang];

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 space-y-8">
      {/* Hero */}
      <div className="rounded-2xl p-8 border border-neutral-800 bg-neutral-900/60 backdrop-blur">
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <h1 className="text-2xl font-semibold text-neutral-100">Social-Hub</h1>
          <LangToggle lang={lang} onChange={setLang} label={t.langLabel} />
        </div>
        <p className="opacity-80 text-neutral-300 mb-6">{t.hero}</p>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/demo"
            className="inline-flex items-center gap-2 rounded-md bg-brand px-5 py-2.5 text-sm font-medium text-white shadow-md transition-transform duration-150 hover:scale-105 hover:bg-brand-dark"
          >
            {t.demo}
          </Link>

          {canSeeDashboard ? (
            <Link
              href="/dashboard"
              className="rounded-md border border-neutral-700 bg-neutral-800 px-4 py-2 text-sm font-medium text-neutral-100 hover:bg-neutral-700"
            >
              {t.dashboard}
            </Link>
          ) : (
            <Link
              href="/login"
              className="rounded-md border border-neutral-800 px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-900 hover:text-neutral-100"
            >
              {t.login}
            </Link>
          )}
        </div>
        <p className="mt-3 text-xs text-neutral-400">{t.demoCaption}</p>
      </div>

      {/* Fonctionnement */}
      <div className="rounded-2xl p-8 border border-neutral-800 bg-neutral-900/60 backdrop-blur">
        <h2 className="text-lg font-semibold mb-3 text-neutral-100">{t.howTitle}</h2>
        <p className="text-neutral-300 mb-4">{t.howBody}</p>
        <p className="text-neutral-300 font-medium">{t.howReadOnly}</p>
      </div>

      {/* Usage des données Google */}
      <div className="rounded-2xl p-8 border border-neutral-800 bg-neutral-900/60 backdrop-blur">
        <h2 className="text-lg font-semibold mb-3 text-neutral-100">{t.dataTitle}</h2>
        <p className="text-neutral-300 mb-4">{t.dataBody}</p>
        <div className="flex gap-4 text-sm">
          <Link href="/privacy" className="underline text-neutral-300 hover:text-neutral-100">
            {t.privacy}
          </Link>
          <Link href="/terms" className="underline text-neutral-300 hover:text-neutral-100">
            {t.terms}
          </Link>
        </div>
      </div>
    </main>
  );
}
