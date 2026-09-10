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
            <div className="flex min-h-screen flex-col pt-[var(--nav-h)]">
              <div className="flex-1">{children}</div>
              <SiteFooter />
            </div>

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
