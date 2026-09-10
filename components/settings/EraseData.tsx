// components/settings/EraseData.tsx
"use client";

import { useState } from "react";

const CONFIRM_PHRASE = "tout effacer";

type Result = {
  ok: true;
  code: string;
  deletedLinks: number;
  deletedMetrics: number;
  metricsScope: "partial" | "complete";
};

/**
 * Zone de danger : déconnecte toutes les plateformes et supprime l'historique
 * de métriques (VideoMetric) des vidéos de l'utilisateur. Irréversible.
 * L'utilisateur doit recopier « tout effacer » avant que le bouton s'active.
 */
export default function EraseData() {
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
            ? "La phrase de confirmation ne correspond pas."
            : data?.error === "unauthorized"
              ? "Votre session a expiré. Reconnectez-vous."
              : "Échec de la suppression. Réessayez dans un instant.",
        );
        return;
      }
      setResult(data as Result);
    } catch {
      setError("Échec de la suppression. Vérifiez votre connexion et réessayez.");
    } finally {
      setBusy(false);
    }
  }

  if (result) {
    return (
      <section className="rounded-2xl border border-red-900/60 bg-red-950/20 p-4">
        <h2 className="text-lg font-medium text-red-200">Données supprimées</h2>
        <p className="mt-2 text-sm text-neutral-300">
          {result.deletedLinks} compte(s) déconnecté(s) et {result.deletedMetrics}{" "}
          enregistrement(s) de statistiques effacé(s) de la base.
          {result.metricsScope === "partial" && (
            <>
              {" "}
              Certaines plateformes n’ont pas pu être interrogées&nbsp;; il peut
              rester des statistiques de vidéos non listées. Écrivez à{" "}
              <a className="underline" href="mailto:paulwoisard@gmail.com">
                paulwoisard@gmail.com
              </a>{" "}
              pour un effacement complet.
            </>
          )}
        </p>
        <p className="mt-2 text-xs text-neutral-500">
          Code de confirmation&nbsp;: <code>{result.code}</code>
        </p>
        <p className="mt-3 text-sm">
          <a className="underline" href="/delete-data">
            En savoir plus sur la suppression des données
          </a>
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-red-900/60 bg-red-950/10 p-4">
      <h2 className="text-lg font-medium text-red-200">Zone de danger</h2>
      <p className="mt-1 text-sm text-neutral-400">
        Déconnecte <strong>toutes</strong> les plateformes et supprime
        définitivement l’historique de statistiques de vos vidéos dans notre base.
        Votre compte (identité Kinde) n’est pas supprimé&nbsp;: voir la page{" "}
        <a className="underline" href="/delete-data">
          Suppression des données
        </a>
        .
      </p>

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-3 inline-flex items-center rounded-lg border border-red-800 px-3 py-2 text-sm text-red-200 hover:bg-red-950/40"
        >
          Tout déconnecter et supprimer mes données
        </button>
      ) : (
        <div className="mt-3 space-y-3">
          <label className="block text-sm text-neutral-300">
            Pour confirmer, recopiez&nbsp;: <strong>tout effacer</strong>
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
              {busy ? "Suppression…" : "Supprimer définitivement"}
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
              Annuler
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
