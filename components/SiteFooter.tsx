// components/SiteFooter.tsx
"use client";

import Link from "next/link";
import { useConsent } from "@/components/consent/CookieConsentProvider";
import { useUiLang } from "@/lib/uiLang";

const T = {
  fr: {
    terms: "Mentions légales & CGU",
    privacy: "Confidentialité",
    deleteData: "Suppression des données",
    cookies: "Gérer les cookies",
  },
  en: {
    terms: "Legal notice & Terms",
    privacy: "Privacy",
    deleteData: "Data deletion",
    cookies: "Manage cookies",
  },
} as const;

export default function SiteFooter() {
  const { openPreferences } = useConsent();
  const year = new Date().getFullYear();
  const [lang] = useUiLang();
  const t = T[lang];

  return (
    <footer className="fixed inset-x-0 bottom-0 z-20 border-t border-neutral-800 bg-neutral-900/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-1 px-4 py-2 text-xs text-neutral-400 sm:flex-row sm:justify-between sm:py-3 sm:text-sm">
        <p className="hidden sm:block">© {year} Social Hub Dashboard — Paul Woisard</p>
        <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          <Link href="/terms" className="hover:text-neutral-200 hover:underline">
            {t.terms}
          </Link>
          <Link href="/privacy" className="hover:text-neutral-200 hover:underline">
            {t.privacy}
          </Link>
          <Link href="/delete-data" className="hover:text-neutral-200 hover:underline">
            {t.deleteData}
          </Link>
          <button
            type="button"
            onClick={openPreferences}
            className="hover:text-neutral-200 hover:underline"
          >
            {t.cookies}
          </button>
        </nav>
      </div>
    </footer>
  );
}
