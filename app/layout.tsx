// app/layout.tsx
import type { Metadata } from "next";
import "@/styles/globals.css";
import Navbar from "@/components/Navbar";
import { AuthProvider } from "./providers/AuthProviders";
import { headers } from "next/headers";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Social-Hub",
  description: "Dashboard vidéos & KPIs",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const nonce = headers().get("x-nonce") ?? undefined;

  return (
    <html lang="fr" className="h-full" suppressHydrationWarning>
      <body className="min-h-screen bg-neutral-800 text-neutral-100" style={{ ["--nav-h" as any]: "56px" }}>
        <AuthProvider>
          <Navbar />
          {/* Exemple si tu utilises un inline Script un jour : */}
          {/* <Script id="boot" nonce={nonce} strategy="afterInteractive">{`console.log("boot")`}</Script> */}
          <div className="pt-[var(--nav-h)]">{children}</div>
        </AuthProvider>
      </body>
    </html>
  );
}

