// app/delete-data/page.tsx
// Page d'instructions de suppression des données (exigée par la config Meta/TikTok).
import type { Metadata } from "next";
import LegalDoc from "@/components/legal/LegalDoc";

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
    <LegalDoc
      title={{ fr: "Suppression de vos données", en: "Deleting your data" }}
      updated={{
        fr: "Dernière mise à jour : 10 septembre 2026",
        en: "Last updated: 10 September 2026",
      }}
      fr={<Fr code={code} />}
      en={<En code={code} />}
    />
  );
}

/* ------------------------------- Français ------------------------------- */

function Fr({ code }: { code: string | null }) {
  return (
    <>
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
          d’indicateurs publics (vues, «&nbsp;j’aime&nbsp;», commentaires, partages) par
          vidéo. Ces enregistrements ne contiennent que des données publiques (plateforme,
          identifiant de vidéo, horodatage, compteurs) et ne sont pas rattachés à votre
          identité.
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
    </>
  );
}

/* -------------------------------- English -------------------------------- */

function En({ code }: { code: string | null }) {
  return (
    <>
      {code && (
        <p>
          <strong>Request recorded.</strong> Confirmation code:{" "}
          <code>{code}</code>. The linked accounts tied to this authorization have been
          removed from our servers.
        </p>
      )}

      <h2>What we keep</h2>
      <ul>
        <li>
          the <strong>access tokens</strong>{" "}
          for the APIs of the platforms you connect, <strong>encrypted</strong>{" "}
          at rest (AES-256-GCM);
        </li>
        <li>
          the identifier and name of the connected account, and the granted permissions;
        </li>
        <li>
          <strong>hourly snapshots</strong>{" "}
          of public metrics (views, likes, comments, shares) per video. These records
          contain public data only (platform, video identifier, timestamp, counters) and
          are not linked to your identity.
        </li>
      </ul>
      <p>
        Full details in our <a href="/privacy">privacy policy</a>.
      </p>

      <h2>1. Revoke a platform’s access</h2>
      <p>
        From the <a href="/settings/linked-accounts">Linked accounts</a> page, click{" "}
        “Disconnect” for the platform concerned. You can also remove the authorization
        directly in your Google, TikTok, Facebook or Instagram account settings. In both
        cases, the{" "}
        <strong>corresponding tokens and the account link are deleted immediately</strong>{" "}
        from our servers; we no longer call any API on your behalf.
      </p>

      <h2>2. Disconnect everything and delete your statistics</h2>
      <p>
        Still on the <a href="/settings/linked-accounts">Linked accounts</a> page, the{" "}
        <strong>danger zone</strong>{" "}
        offers a “Disconnect everything and delete my data” button. After you retype the
        confirmation phrase <code>tout effacer</code>, we immediately delete: all your
        linked accounts (tokens included) and the{" "}
        <strong>statistics history</strong>{" "}
        of the videos tied to those accounts. This action is{" "}
        <strong>irreversible</strong>. Your account (identity managed by Kinde) is not
        deleted — see the next section.
      </p>

      <h2>3. Delete your account</h2>
      <p>
        To delete your whole account (identity managed by Kinde and all linked accounts),
        write to{" "}
        <a href="mailto:paulwoisard@gmail.com">paulwoisard@gmail.com</a>{" "}
        from the address associated with your account, or stating the identifier of the
        account concerned. Deletion is carried out within 30 days and a confirmation is
        sent to you.
      </p>

      <h2>4. Statistics history</h2>
      <p>
        As the metrics history is not tied to your identity (nor to your account), it is
        not deleted automatically when an account is closed; it is kept for a maximum of{" "}
        <strong>25 months</strong>{" "}
        then erased. You can nonetheless erase it yourself immediately via the danger zone
        of the{" "}
        <a href="/settings/linked-accounts">Linked accounts</a>{" "}
        page (section 2 above), or request its deletion at the same address by providing
        the identifiers or links of the videos concerned.
      </p>
    </>
  );
}
