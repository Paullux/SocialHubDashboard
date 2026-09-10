// components/settings/EraseData.tsx
"use client";

import { useState } from "react";
import { useUiLang } from "@/lib/uiLang";

const CONFIRM_PHRASE = "tout effacer";

type Result = {
  ok: true;
  code: string;
  deletedLinks: number;
  deletedMetrics: number;
  metricsScope: "partial" | "complete";
};

const T = {
  fr: {
    doneTitle: "Données supprimées",
    done: (links: number, metrics: number) =>
      `${links} compte(s) déconnecté(s) et ${metrics} enregistrement(s) de statistiques effacé(s) de la base.`,
    partial:
      "Certaines plateformes n’ont pas pu être interrogées ; il peut rester des statistiques de vidéos non listées. Écrivez à",
    partialTail: "pour un effacement complet.",
    confirmCode: "Code de confirmation",
    moreLink: "En savoir plus sur la suppression des données",
    zoneTitle: "Zone de danger",
    openBtn: "Tout déconnecter et supprimer mes données",
    confirmLabel: "Pour confirmer, recopiez :",
    submitIdle: "Supprimer définitivement",
    submitBusy: "Suppression…",
    cancel: "Annuler",
    errMismatch: "La phrase de confirmation ne correspond pas.",
    errUnauth: "Votre session a expiré. Reconnectez-vous.",
    errGeneric: "Échec de la suppression. Réessayez dans un instant.",
    errNetwork: "Échec de la suppression. Vérifiez votre connexion et réessayez.",
  },
  en: {
    doneTitle: "Data deleted",
    done: (links: number, metrics: number) =>
      `${links} account(s) disconnected and ${metrics} statistics record(s) erased from the database.`,
    partial:
      "Some platforms could not be queried; statistics for unlisted videos may remain. Write to",
    partialTail: "for a full erasure.",
    confirmCode: "Confirmation code",
    moreLink: "Learn more about data deletion",
    zoneTitle: "Danger zone",
    openBtn: "Disconnect everything and delete my data",
    confirmLabel: "To confirm, retype:",
    submitIdle: "Delete permanently",
    submitBusy: "Deleting…",
    cancel: "Cancel",
    errMismatch: "The confirmation phrase does not match.",
    errUnauth: "Your session has expired. Please sign in again.",
    errGeneric: "Deletion failed. Try again in a moment.",
    errNetwork: "Deletion failed. Check your connection and try again.",
  },
} as const;

function Intro({
  lang,
}: {
  lang: "fr" | "en";
}) {
  if (lang === "fr") {
    return (
      <>
        Déconnecte <strong>toutes les plateformes</strong>{" "}
        et supprime définitivement l’historique de statistiques de vos vidéos dans notre
        base. Votre compte (identité Kinde) n’est pas supprimé&nbsp;: voir la page{" "}
        <a className="underline" href="/delete-data">
          Suppression des données
        </a>
        .
      </>
    );
  }
  return (
    <>
      Disconnects <strong>every platform</strong>{" "}
      and permanently deletes your videos’ statistics history from our database. Your
      account (Kinde identity) is not deleted — see the{" "}
      <a className="underline" href="/delete-data">
        Data deletion
      </a>{" "}
      page.
    </>
  );
}

/**
 * Zone de danger : déconnecte toutes les plateformes et supprime l'historique
 * de métriques (VideoMetric) des vidéos de l'utilisateur. Irréversible.
 * L'utilisateur doit recopier « tout effacer » avant que le bouton s'active.
 */
export default function EraseData() {
  const [lang] = useUiLang();
  const t = T[lang];
  const [open, setOpen] = useState(false);
  const [phrase, setPhrase] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  const phraseOk = phrase.trim().toLowerCase() === CONFIRM_PHRASE;

  async function submit() {
    if (!phraseOk || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/account/erase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: phrase.trim() }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        setError(
          data?.error === "confirmation_mismatch"
            ? t.errMismatch
            : data?.error === "unauthorized"
              ? t.errUnauth
              : t.errGeneric,
        );
        return;
      }
      setResult(data as Result);
    } catch {
      setError(t.errNetwork);
    } finally {
      setBusy(false);
    }
  }

  if (result) {
    return (
      <section className="rounded-2xl border border-red-900/60 bg-red-950/20 p-4">
        <h2 className="text-lg font-medium text-red-200">{t.doneTitle}</h2>
        <p className="mt-2 text-sm text-neutral-300">
          {t.done(result.deletedLinks, result.deletedMetrics)}
          {result.metricsScope === "partial" && (
            <>
              {" "}
              {t.partial}{" "}
              <a className="underline" href="mailto:paulwoisard@gmail.com">
                paulwoisard@gmail.com
              </a>{" "}
              {t.partialTail}
            </>
          )}
        </p>
        <p className="mt-2 text-xs text-neutral-500">
          {t.confirmCode}&nbsp;: <code>{result.code}</code>
        </p>
        <p className="mt-3 text-sm">
          <a className="underline" href="/delete-data">
            {t.moreLink}
          </a>
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-red-900/60 bg-red-950/10 p-4">
      <h2 className="text-lg font-medium text-red-200">{t.zoneTitle}</h2>
      <p className="mt-1 text-sm text-neutral-400">
        <Intro lang={lang} />
      </p>

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-3 inline-flex items-center rounded-lg border border-red-800 px-3 py-2 text-sm text-red-200 hover:bg-red-950/40"
        >
          {t.openBtn}
        </button>
      ) : (
        <div className="mt-3 space-y-3">
          <label className="block text-sm text-neutral-300">
            {t.confirmLabel} <strong>tout effacer</strong>
            <input
              type="text"
              value={phrase}
              onChange={(e) => setPhrase(e.target.value)}
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="tout effacer"
              className="mt-1 w-full max-w-xs rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-red-700"
            />
          </label>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex gap-2">
            <button
              type="button"
              disabled={!phraseOk || busy}
              onClick={submit}
              className="inline-flex items-center rounded-lg bg-red-700 px-3 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {busy ? t.submitBusy : t.submitIdle}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setOpen(false);
                setPhrase("");
                setError(null);
              }}
              className="inline-flex items-center rounded-lg border border-neutral-700 px-3 py-2 text-sm hover:bg-neutral-900 disabled:opacity-40"
            >
              {t.cancel}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
