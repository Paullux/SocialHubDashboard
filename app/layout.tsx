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

export const metadata: Metadata = {
  title: "Social-Hub",
  description: "Dashboard vidéos & KPIs",
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
