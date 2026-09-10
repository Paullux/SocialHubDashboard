// app/delete-data/page.tsx
// Page d'instructions de suppression des données (exigée par la config Meta).
import type { Metadata } from "next";

type Search = Record<string, string | string[] | undefined>;

export const metadata: Metadata = {
  title: "Suppression des données — Social Hub",
  description:
    "Comment révoquer l'accès de Social Hub et faire supprimer vos données.",
};

export default async function DeleteDataPage({
  searchParams,
}: {
  searchParams?: Promise<Search>;
}) {
  const sp = (await (searchParams ?? Promise.resolve({}))) as Search;
  const code = typeof sp.code === "string" ? sp.code : null;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="text-2xl font-semibold text-neutral-100 sm:text-3xl">
        Suppression de vos données
      </h1>

      <div className="legal-prose mt-4">
        {code && (
          <p>
            <strong>Demande enregistrée.</strong> Code de confirmation&nbsp;:{" "}
            <code>{code}</code>. Les comptes liés associés à cette autorisation ont été
            supprimés de nos serveurs.
          </p>
        )}

        <h2>Ce que nous conservons</h2>
        <ul>
          <li>
            les <strong>jetons d’accès</strong>{" "}
            aux API des plateformes que vous connectez, <strong>chiffrés</strong>{" "}
            au repos (AES-256-GCM)&nbsp;;
          </li>
          <li>
            l’identifiant et le nom du compte connecté, les autorisations accordées&nbsp;;
          </li>
          <li>
            des <strong>instantanés horaires</strong>{" "}
            d’indicateurs publics (vues,
            «&nbsp;j’aime&nbsp;», commentaires, partages) par vidéo. Ces enregistrements ne
            contiennent que des données publiques (plateforme, identifiant de vidéo,
            horodatage, compteurs) et ne sont pas rattachés à votre identité.
          </li>
        </ul>
        <p>
          Détails complets dans notre <a href="/privacy">politique de confidentialité</a>.
        </p>

        <h2>1. Révoquer l’accès d’une plateforme</h2>
        <p>
          Depuis la page <a href="/settings/linked-accounts">Comptes liés</a>, cliquez sur
          «&nbsp;Déconnecter&nbsp;» pour la plateforme concernée. Vous pouvez aussi retirer
          l’autorisation directement dans les réglages de votre compte Google, TikTok,
          Facebook ou Instagram. Dans les deux cas, les{" "}
          <strong>jetons correspondants et le lien de compte sont supprimés immédiatement</strong>{" "}
          de nos serveurs&nbsp;; nous n’appelons plus aucune API en votre nom.
        </p>

        <h2>2. Tout déconnecter et supprimer vos statistiques</h2>
        <p>
          Toujours sur la page <a href="/settings/linked-accounts">Comptes liés</a>, la{" "}
          <strong>zone de danger</strong>{" "}
          propose un bouton «&nbsp;Tout déconnecter et supprimer mes données&nbsp;». Après
          avoir recopié la phrase de confirmation <code>tout effacer</code>, nous supprimons{" "}
          <strong>immédiatement</strong>&nbsp;: tous vos comptes liés (jetons inclus) et
          l’<strong>historique de statistiques</strong>{" "}
          des vidéos rattachées à ces comptes. Cette action est{" "}
          <strong>irréversible</strong>. Votre compte (identité gérée par Kinde) n’est pas
          supprimé — voir le point suivant.
        </p>

        <h2>3. Supprimer votre compte</h2>
        <p>
          Pour supprimer l’ensemble de votre compte (identité gérée par Kinde et tous les
          comptes liés), écrivez à{" "}
          <a href="mailto:paulwoisard@gmail.com">paulwoisard@gmail.com</a>{" "}
          depuis l’adresse associée à votre compte, ou en indiquant l’identifiant du compte
          concerné. La suppression est effectuée sous 30&nbsp;jours et une confirmation vous
          est envoyée.
        </p>

        <h2>4. Historique de statistiques</h2>
        <p>
          L’historique d’indicateurs n’étant pas relié à votre identité (ni à votre compte),
          il n’est pas supprimé automatiquement à la clôture d’un compte&nbsp;; il est
          conservé au maximum <strong>25&nbsp;mois</strong>{" "}
          puis effacé. Vous pouvez l’effacer vous-même immédiatement via la zone de danger
          de la page{" "}
          <a href="/settings/linked-accounts">Comptes liés</a>{" "}
          (point&nbsp;2 ci-dessus), ou en demander la suppression à la même adresse en
          fournissant les identifiants ou les liens des vidéos concernées.
        </p>
      </div>
    </main>
  );
}
