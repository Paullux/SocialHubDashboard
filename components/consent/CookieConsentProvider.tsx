// components/consent/CookieConsentProvider.tsx
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  CONSENT_EVENT,
  CONSENT_VERSION,
  DEFAULT_CONSENT,
  isDecided,
  readConsentClient,
  writeConsentClient,
  type ConsentState,
} from "@/lib/consent";

type ConsentContextValue = {
  /** État courant (valeurs par défaut tant que rien n'est décidé). */
  consent: ConsentState;
  /** true une fois la valeur lue côté client (évite un flash du bandeau). */
  ready: boolean;
  /** true si l'utilisateur a déjà fait un choix pour la version courante. */
  decided: boolean;
  /** Ouvre le panneau de préférences. */
  openPreferences: () => void;
  /** Ferme le panneau de préférences. */
  closePreferences: () => void;
  /** true si le panneau de préférences est ouvert. */
  preferencesOpen: boolean;
  /** Accepte toutes les catégories. */
  acceptAll: () => void;
  /** Refuse toutes les catégories non essentielles. */
  rejectAll: () => void;
  /** Enregistre un choix granulaire. */
  save: (partial: Partial<Omit<ConsentState, "v" | "ts">>) => void;
};

const ConsentContext = createContext<ConsentContextValue | null>(null);

export function useConsent(): ConsentContextValue {
  const ctx = useContext(ConsentContext);
  if (!ctx) throw new Error("useConsent must be used within <CookieConsentProvider>");
  return ctx;
}

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsent] = useState<ConsentState>(DEFAULT_CONSENT);
  const [ready, setReady] = useState(false);
  const [preferencesOpen, setPreferencesOpen] = useState(false);

  // Lecture initiale + synchronisation entre onglets.
  useEffect(() => {
    const load = () => {
      const stored = readConsentClient();
      setConsent(stored ?? DEFAULT_CONSENT);
      setReady(true);
    };
    load();

    const onExternal = () => load();
    window.addEventListener(CONSENT_EVENT, onExternal as EventListener);
    window.addEventListener("storage", onExternal);
    return () => {
      window.removeEventListener(CONSENT_EVENT, onExternal as EventListener);
      window.removeEventListener("storage", onExternal);
    };
  }, []);

  const persist = useCallback((next: Omit<ConsentState, "v" | "ts">) => {
    const state: ConsentState = {
      ...next,
      v: CONSENT_VERSION,
      ts: new Date().toISOString(),
    };
    writeConsentClient(state);
    setConsent(state);
    setPreferencesOpen(false);
  }, []);

  const acceptAll = useCallback(() => persist({ analytics: true }), [persist]);
  const rejectAll = useCallback(() => persist({ analytics: false }), [persist]);
  const save = useCallback(
    (partial: Partial<Omit<ConsentState, "v" | "ts">>) =>
      persist({ analytics: partial.analytics ?? consent.analytics }),
    [persist, consent.analytics],
  );

  const value = useMemo<ConsentContextValue>(
    () => ({
      consent,
      ready,
      // Vrai seulement après lecture client ET si un choix a déjà été enregistré.
      decided: ready && isDecided(consent),
      openPreferences: () => setPreferencesOpen(true),
      closePreferences: () => setPreferencesOpen(false),
      preferencesOpen,
      acceptAll,
      rejectAll,
      save,
    }),
    [consent, ready, preferencesOpen, acceptAll, rejectAll, save],
  );

  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
}
