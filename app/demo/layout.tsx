// app/demo/layout.tsx
import type { ReactNode } from "react";
import type { Metadata } from "next";

/** `page.tsx` est un composant client : il ne peut pas exporter `metadata`.
 *  D'où ce layout, dont c'est l'unique raison d'être — sans lui la démo
 *  hérite du titre de l'accueil, et deux pages portent le même. */
export const metadata: Metadata = {
  title: "Démo du dashboard — Social Hub Dashboard",
  description:
    "Aperçu du tableau de bord avec des données d'exemple : vidéos YouTube, TikTok et Instagram dans une seule grille, avec vues, likes et commentaires. Sans inscription.",
  alternates: { canonical: "/demo" },
};

export default function DemoLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
