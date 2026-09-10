// app/delete-data/page.tsx
// Page d'instructions de suppression des données (exigée par la config Meta).
type Search = Record<string, string | string[] | undefined>;

export const metadata = {
  title: "Suppression des données — Social Hub",
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
          <strong>Demande enregistrée.</strong> Code de confirmation :{" "}
          <code>{code}</code>. Vos comptes liés associés à cette autorisation ont
          été supprimés de nos serveurs.
        </p>
      )}

      <p>
        Social Hub ne stocke que le minimum nécessaire pour afficher vos vidéos et
        leurs statistiques&nbsp;: des jetons d&apos;accès (chiffrés) aux API des
        plateformes que vous connectez, et des instantanés horaires de métriques
        publiques (vues, likes, commentaires, partages) par vidéo.
      </p>

      <h2>Révoquer l&apos;accès</h2>
      <p>
        Vous pouvez à tout moment déconnecter une plateforme depuis la page{" "}
        <a href="/settings/linked-accounts">Comptes liés</a>, ou retirer
        l&apos;autorisation directement depuis les réglages de votre compte
        Google, TikTok, Facebook ou Instagram. La déconnexion supprime
        immédiatement les jetons correspondants.
      </p>

      <h2>Demander la suppression complète</h2>
      <p>
        Pour demander la suppression de l&apos;ensemble des données vous
        concernant (jetons et historique de métriques), écrivez à{" "}
        <a href="mailto:paulwoisard@gmail.com">paulwoisard@gmail.com</a> depuis
        l&apos;adresse associée à votre compte, ou avec l&apos;identifiant du
        compte concerné. La suppression est effectuée sous 30&nbsp;jours et une
        confirmation vous est envoyée.
      </p>
      </div>
    </main>
  );
}
