"use client";

import { useEffect, useMemo, useState } from "react";

type Mode = "auto" | "date" | "datetime" | "relative";

export default function FormatDate({
  iso,
  mode = "auto",
}: {
  iso: string;
  mode?: Mode;
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

        if (diffSec < 60) formatted = `il y a ${diffSec}s`;
        else if (diffMin < 60) formatted = `il y a ${diffMin}min`;
        else if (diffH < 24) formatted = `il y a ${diffH}h`;
        else formatted = `il y a ${diffD}j`;
      } else if (resolvedMode === "datetime") {
        formatted = d.toLocaleString("fr-FR", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        });
      } else {
        // "date"
        formatted = d.toLocaleDateString("fr-FR", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        });
      }
      setText(formatted);
    } catch {
      // garde la valeur initiale si parsing invalide
    }
  }, [iso, resolvedMode]);

  return (
    <time dateTime={iso} suppressHydrationWarning>
      {text}
    </time>
  );
}
