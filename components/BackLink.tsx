// components/BackLink.tsx
"use client";

import Link from "next/link";
import { useUiLang } from "@/lib/uiLang";

/** Bouton « ← Retour » des pages de stats. Composant client pour suivre la
 *  langue choisie, les pages qui l'utilisent étant rendues côté serveur. */
export default function BackLink({
  href,
  label,
}: {
  href: string;
  /** Libellé affiché à partir de `xs` (« Dashboard », « Démo »…). */
  label: { fr: string; en: string };
}) {
  const [lang] = useUiLang();
  const back = lang === "fr" ? "Retour" : "Back";

  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-800/90 backdrop-blur px-3 py-1.5 text-sm text-white hover:bg-neutral-700"
      aria-label={`${back}${lang === "fr" ? " :" : ":"} ${label[lang]}`}
    >
      <span aria-hidden>←</span>
      <span className="hidden xs:inline">{label[lang]}</span>
      <span className="xs:hidden">{back}</span>
    </Link>
  );
}
