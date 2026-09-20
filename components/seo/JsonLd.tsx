// components/seo/JsonLd.tsx
import { SITE_URL } from "@/lib/site";
import { faq } from "@/lib/faq";

/** Données structurées de l'accueil.
 *
 *  Un `<script type="application/ld+json">` est un bloc de données, pas un
 *  script exécutable : la CSP `script-src` du proxy ne s'y applique pas et il
 *  n'a donc pas besoin du nonce.
 *
 *  Le balisage reprend le français, langue du document (`<html lang="fr">`) ;
 *  le sélecteur FR/EN de la page ne change que l'affichage côté client, pas la
 *  langue déclarée, et Google indexe la version servie.
 */
export default function JsonLd() {
  const graph = [
    {
      "@type": "SoftwareApplication",
      "@id": `${SITE_URL}/#app`,
      name: "Social Hub Dashboard",
      url: SITE_URL,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      inLanguage: "fr",
      description:
        "Tableau de bord qui réunit les vidéos YouTube, TikTok et Instagram d'un créateur au même endroit : vues, likes, commentaires, partages et leur évolution heure par heure. Strictement en lecture seule.",
      featureList: [
        "Vidéos YouTube, TikTok et Instagram dans une seule grille",
        "Vues, likes, commentaires et partages côte à côte",
        "Tri par date, vues, likes, commentaires ou partages",
        "Historique relevé automatiquement heure par heure",
        "Accès en lecture seule : aucune publication ni modification",
      ],
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "EUR",
        availability: "https://schema.org/InStock",
        description: "Bêta gratuite, sans carte bancaire",
      },
    },
    {
      "@type": "FAQPage",
      "@id": `${SITE_URL}/#faq`,
      mainEntity: faq.fr.map(({ q, a }) => ({
        "@type": "Question",
        name: q,
        acceptedAnswer: { "@type": "Answer", text: a },
      })),
    },
  ];

  return (
    <script
      type="application/ld+json"
      // Le contenu vient de constantes du dépôt, jamais d'une saisie
      // utilisateur : il n'y a rien à échapper ici. `</` est neutralisé malgré
      // tout, seule séquence capable de fermer la balise par accident.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replace(
          /</g,
          "\\u003c",
        ),
      }}
    />
  );
}
