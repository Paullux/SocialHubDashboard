// components/SiteFooter.tsx
"use client";

import Link from "next/link";
import { useConsent } from "@/components/consent/CookieConsentProvider";

export default function SiteFooter() {
  const { openPreferences } = useConsent();
  const year = new Date().getFullYear();

  return (
    <footer className="relative z-10 mt-16 border-t border-neutral-800 bg-neutral-900/70 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-sm text-neutral-400 sm:flex-row sm:items-center sm:justify-between">
        <p>© {year} Social Hub — Paul Woisard</p>
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Link href="/terms" className="hover:text-neutral-200 hover:underline">
            Mentions légales &amp; CGU
          </Link>
          <Link href="/privacy" className="hover:text-neutral-200 hover:underline">
            Confidentialité
          </Link>
          <Link href="/delete-data" className="hover:text-neutral-200 hover:underline">
            Suppression des données
          </Link>
          <button
            type="button"
            onClick={openPreferences}
            className="text-left hover:text-neutral-200 hover:underline"
          >
            Gérer les cookies
          </button>
        </nav>
      </div>
    </footer>
  );
}
