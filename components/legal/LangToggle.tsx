// components/legal/LangToggle.tsx
"use client";

import type { Lang } from "@/lib/uiLang";

/** Bascule FR / EN réutilisée par les pages légales et le bandeau cookies. */
export default function LangToggle({
  lang,
  onChange,
  label,
  className = "",
}: {
  lang: Lang;
  onChange: (lang: Lang) => void;
  /** Libellé accessible du groupe. */
  label: string;
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={`inline-flex shrink-0 self-start rounded-lg border border-neutral-700 bg-neutral-900 p-0.5 ${className}`}
    >
      {(["fr", "en"] as const).map((l) => (
        <button
          key={l}
          type="button"
          aria-pressed={lang === l}
          onClick={() => onChange(l)}
          className={`rounded-md px-2.5 py-1 text-xs font-semibold uppercase transition-colors ${
            lang === l ? "bg-brand text-white" : "text-neutral-300 hover:text-white"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
