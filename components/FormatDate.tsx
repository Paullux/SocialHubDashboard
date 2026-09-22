"use client";

import { useEffect, useMemo, useState } from "react";
import { LOCALE, type Lang } from "@/lib/uiLang";

type Mode = "auto" | "date" | "datetime" | "relative";

export default function FormatDate({
  iso,
  mode = "auto",
  lang = "fr",
}: {
  iso: string;
  mode?: Mode;
  lang?: Lang;
}) {
  // Rendu SSR stable (évite l'hydratation foireuse)
  const [text, setText] = useState<string>(() => {
    try {
      return new Date(iso).toISOString().split("T")[0]; // YYYY-MM-DD
    } catch {
      return iso;
    }
  });

  const resolvedMode = useMemo<Exclude<Mode, "auto">>(() => {
    if (mode !== "auto") return mode;
    const d = new Date(iso);
    const now = new Date();
    const diffMs = Math.abs(now.getTime() - d.getTime());
    const within48h = diffMs <= 48 * 3600 * 1000;
    return within48h ? "relative" : "date";
  }, [iso, mode]);

  useEffect(() => {
    try {
      const d = new Date(iso);
      let formatted = "";
      if (resolvedMode === "relative") {
        const now = new Date();
        const diffMs = now.getTime() - d.getTime();
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffH = Math.floor(diffMin / 60);
        const diffD = Math.floor(diffH / 24);

        const ago = (n: number, unitFr: string, unitEn: string) =>
          lang === "fr" ? `il y a ${n}${unitFr}` : `${n}${unitEn} ago`;
        if (diffSec < 60) formatted = ago(diffSec, "s", "s");
        else if (diffMin < 60) formatted = ago(diffMin, "min", "min");
        else if (diffH < 24) formatted = ago(diffH, "h", "h");
        else formatted = ago(diffD, "j", "d");
      } else if (resolvedMode === "datetime") {
        formatted = d.toLocaleString(LOCALE[lang], {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        });
      } else {
        // "date"
        formatted = d.toLocaleDateString(LOCALE[lang], {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        });
      }
      setText(formatted);
    } catch {
      // garde la valeur initiale si parsing invalide
    }
  }, [iso, resolvedMode, lang]);

  return (
    <time dateTime={iso} suppressHydrationWarning>
      {text}
    </time>
  );
}
