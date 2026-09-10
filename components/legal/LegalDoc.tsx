// components/legal/LegalDoc.tsx
"use client";

import type { ReactNode } from "react";
import { useUiLang } from "@/lib/uiLang";
import LangToggle from "./LangToggle";

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
  const [lang, setLang] = useUiLang();

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
        <LangToggle
          lang={lang}
          onChange={setLang}
          label={lang === "fr" ? "Langue du document" : "Document language"}
        />
      </div>

      <article className="legal-prose">{lang === "fr" ? fr : en}</article>
    </main>
  );
}
