// lib/uiLang.ts
// Langue de l'interface pour les contenus bilingues (pages légales, bandeau
// cookies). Source de vérité : localStorage `sh_legal_lang` ; à défaut, la
// langue du navigateur ; sinon français.

import { useCallback, useEffect, useState } from "react";

export type Lang = "fr" | "en";

export const LANG_KEY = "sh_legal_lang";
/** Émis quand la langue change (écouté par tous les composants bilingues). */
export const LANG_EVENT = "sh:lang-change";

export function readLang(): Lang {
  if (typeof window !== "undefined") {
    try {
      const stored = window.localStorage.getItem(LANG_KEY);
      if (stored === "fr" || stored === "en") return stored;
    } catch {
      /* stockage indisponible */
    }
    if (
      typeof navigator !== "undefined" &&
      navigator.language?.toLowerCase().startsWith("en")
    ) {
      return "en";
    }
  }
  return "fr";
}

export function writeLang(lang: Lang): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LANG_KEY, lang);
  } catch {
    /* non bloquant */
  }
  window.dispatchEvent(new CustomEvent<Lang>(LANG_EVENT, { detail: lang }));
}

/**
 * Hook client : renvoie la langue courante + un setter. Se resynchronise sur
 * l'événement `sh:lang-change` et sur `storage` (autres onglets).
 * Rend `"fr"` au premier rendu (SSR) puis la vraie valeur après montage.
 */
export function useUiLang(): [Lang, (lang: Lang) => void] {
  const [lang, setLang] = useState<Lang>("fr");

  useEffect(() => {
    setLang(readLang());
    const sync = () => setLang(readLang());
    window.addEventListener(LANG_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(LANG_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const set = useCallback((next: Lang) => {
    writeLang(next);
    setLang(next);
  }, []);

  return [lang, set];
}
