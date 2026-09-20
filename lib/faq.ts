// lib/faq.ts

/** `a` reste du texte brut : c'est lui qui part dans le balisage FAQPage, où
 *  le HTML n'a pas sa place. Les liens éventuels s'ajoutent à côté, sous la
 *  réponse — Google demande que la réponse balisée soit visible, il n'interdit
 *  pas d'en afficher davantage. */
export type FaqEntry = {
  q: string;
  a: string;
  links?: readonly { label: string; href: string }[];
};

/** Questions fréquentes, formulées comme les gens les tapent plutôt qu'avec
 *  le vocabulaire du produit — personne ne cherche « Social Hub Dashboard »,
 *  on cherche « voir mes stats YouTube et TikTok au même endroit ».
 *
 *  Cette liste sert deux fois : à l'affichage sur l'accueil et au balisage
 *  FAQPage (app/page.tsx). Google exige que les deux coïncident, d'où la
 *  source unique. Toute modification d'une réponse vaut donc pour les deux.
 */
export const faq: Record<"fr" | "en", readonly FaqEntry[]> = {
  fr: [
    {
      q: "Comment voir mes statistiques YouTube, TikTok et Instagram au même endroit ?",
      a: "Tu connectes tes comptes une seule fois, en lecture seule, et toutes tes vidéos apparaissent dans une grille unique : vues, likes, commentaires et partages côte à côte, triables par date ou par performance. Plus besoin d'ouvrir les trois applications l'une après l'autre.",
    },
    {
      q: "Est-ce que l'application publie ou modifie quelque chose sur mes comptes ?",
      a: "Non. Social Hub Dashboard est strictement en lecture seule : il consulte tes statistiques, il ne publie, ne modifie et ne supprime jamais rien. Les autorisations demandées sont uniquement des accès en lecture (youtube.readonly, video.list, instagram_business_basic…).",
    },
    {
      q: "Faut-il payer ou donner une carte bancaire ?",
      a: "Non. La bêta est gratuite et ne demande aucun moyen de paiement. Créer un compte suffit pour connecter tes plateformes et voir tes chiffres.",
    },
    {
      q: "Puis-je suivre l'évolution de mes statistiques dans le temps ?",
      a: "Oui. Les chiffres sont relevés automatiquement heure par heure et conservés, ce qui permet d'afficher les courbes de chaque vidéo et de voir ce qui progresse après la publication.",
    },
    {
      q: "Comment déconnecter un compte ou faire supprimer mes données ?",
      a: "Depuis la page Comptes liés, à tout moment et sans justification. Pour Google, l'accès se révoque aussi depuis myaccount.google.com/permissions. La page Suppression des données détaille la marche à suivre.",
      links: [{ label: "Suppression des données", href: "/delete-data" }],
    },
  ],
  en: [
    {
      q: "How do I see my YouTube, TikTok and Instagram statistics in one place?",
      a: "You connect your accounts once, read-only, and all your videos appear in a single grid: views, likes, comments and shares side by side, sortable by date or performance. No more opening three apps one after another.",
    },
    {
      q: "Does the app post or change anything on my accounts?",
      a: "No. Social Hub Dashboard is strictly read-only: it reads your statistics, it never posts, edits or deletes anything. The scopes requested are read-only ones (youtube.readonly, video.list, instagram_business_basic…).",
    },
    {
      q: "Is there anything to pay, or a card to enter?",
      a: "No. The beta is free and asks for no payment method. Creating an account is enough to connect your platforms and see your numbers.",
    },
    {
      q: "Can I track how my statistics change over time?",
      a: "Yes. Numbers are collected automatically every hour and kept, so each video gets a curve showing what keeps growing after publication.",
    },
    {
      q: "How do I disconnect an account or have my data deleted?",
      a: "From the Linked accounts page, at any time and without justification. For Google, access can also be revoked from myaccount.google.com/permissions. The Data deletion page explains the procedure.",
      links: [{ label: "Data deletion", href: "/delete-data" }],
    },
  ],
};
