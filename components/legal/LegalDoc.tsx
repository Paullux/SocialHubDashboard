// components/legal/LegalDoc.tsx
"use client";

import { useEffect, useState, type ReactNode } from "react";

type Lang = "fr" | "en";
const STORAGE_KEY = "sh_legal_lang";

export default function LegalDoc({
  title,
  updated,
  fr,
  en,
}: {
  title: { fr: string; en: string };
  updated: { fr: string; en: string };
  fr: ReactNode;
  en: ReactNode;
}) {
  const [lang, setLang] = useState<Lang>("fr");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "fr" || stored === "en") setLang(stored);
      else if (navigator.language?.toLowerCase().startsWith("en")) setLang("en");
    } catch {
      /* défaut : fr */
    }
  }, []);

  const choose = (l: Lang) => {
    setLang(l);
    try {
      window.localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* non bloquant */
    }
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-100 sm:text-3xl">
            {lang === "fr" ? title.fr : title.en}
          </h1>
          <p className="mt-1 text-sm text-neutral-400">
            {lang === "fr" ? updated.fr : updated.en}
          </p>
        </div>
        <div
          role="group"
          aria-label={lang === "fr" ? "Langue du document" : "Document language"}
          className="inline-flex shrink-0 self-start rounded-lg border border-neutral-700 bg-neutral-900 p-0.5"
        >
          {(["fr", "en"] as const).map((l) => (
            <button
              key={l}
              type="button"
              aria-pressed={lang === l}
              onClick={() => choose(l)}
              className={`rounded-md px-3 py-1 text-xs font-semibold uppercase transition-colors ${
                lang === l
                  ? "bg-brand text-white"
                  : "text-neutral-300 hover:text-white"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <article className="legal-prose">{lang === "fr" ? fr : en}</article>
    </main>
  );
}
