// app/layout.tsx
import type { Metadata } from "next";
import "@/styles/globals.css";
import { Suspense, type ReactNode } from "react";
import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";
import { AuthProvider } from "./providers/AuthProviders";
import { CookieConsentProvider } from "@/components/consent/CookieConsentProvider";
import CookieBanner from "@/components/consent/CookieBanner";
import Matomo from "@/components/analytics/Matomo";

// Aperçus de lien (Facebook, LinkedIn, WhatsApp, X…). L'image doit être servie
// en absolu : `metadataBase` préfixe les chemins relatifs ci-dessous. Le
// middleware (proxy.ts) laisse passer les fichiers image sans authentification,
// les crawlers peuvent donc récupérer /og.jpg.
// Volontairement en dur, et non `NEXT_PUBLIC_BASE_URL` : cette variable vaut
// l'URL Vercel de préproduction (social-hub-seven.vercel.app) et ferait annoncer
// ce domaine dans les aperçus et la balise canonique.
const SITE_URL = "https://social-hub.fr";

// Deux longueurs, deux usages. Le titre du document vise les 50-60 caractères
// utiles dans les résultats de recherche ; les titres sociaux restent sous 60
// (Facebook, LinkedIn) et sous 70 (X), seuils au-delà desquels ils tronquent.
const PAGE_TITLE = "Social Hub — stats YouTube, TikTok et Instagram réunies";
const SOCIAL_TITLE = "Tes stats YouTube, TikTok et Instagram sur un écran";

// Même logique : la meta description exploite ses ~155 caractères, alors que
// les aperçus sociaux n'en affichent souvent que ~125 sur mobile.
const SEO_DESCRIPTION =
  "Réunis tes vidéos YouTube, TikTok et Instagram dans un seul tableau de bord : vues, likes, commentaires et leur évolution. En lecture seule.";
const SOCIAL_DESCRIPTION =
  "Toutes tes vidéos et leurs statistiques au même endroit. Lecture seule : rien n'est publié ni modifié.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: PAGE_TITLE,
  description: SEO_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "/",
    siteName: "Social Hub",
    title: SOCIAL_TITLE,
    description: SOCIAL_DESCRIPTION,
    images: [
      {
        url: "/og.jpg",
        width: 1200,
        height: 630,
        alt: "Le tableau de bord Social Hub : des vidéos YouTube et TikTok côte à côte avec leurs vues, likes et commentaires, et le bouton « Essayer la démo ».",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SOCIAL_TITLE,
    description: SOCIAL_DESCRIPTION,
    images: ["/og.jpg"],
  },
};

// La CSP (proxy.ts) utilise un nonce + 'strict-dynamic' : Next doit poser ce
// nonce sur ses <script> à chaque requête, ce qui impose un rendu dynamique.
// Sans cela, les pages prérendues statiquement (/terms, /privacy, /demo…)
// servent des scripts sans nonce → tout le JS client est bloqué (bandeau
// cookies, sélecteur FR/EN, Matomo…).
export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className="h-full" suppressHydrationWarning>
      <body
        className="min-h-screen bg-neutral-800 text-neutral-100"
        style={{ ["--nav-h" as any]: "56px" }}
      >
        <AuthProvider>
          <CookieConsentProvider>
            <Navbar />
            {/* relative z-10 : le contenu passe devant le motif « pellicule »
                (body::before, z-0) mais reste sous la navbar (z-30) et le
                pied de page (z-20). */}
            <div className="relative z-10 min-h-screen pt-[var(--nav-h)] pb-20 sm:pb-14">
              {children}
            </div>

            <SiteFooter />
            <CookieBanner />

            <Suspense fallback={null}>
              <Matomo />
            </Suspense>
          </CookieConsentProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
