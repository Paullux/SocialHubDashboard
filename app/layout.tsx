// app/layout.tsx
import type { Metadata } from "next";
import "@/styles/globals.css";
import Navbar from "@/components/Navbar";
import { AuthProvider } from "./providers/AuthProviders";

export const metadata: Metadata = {
  title: "Social-Hub",
  description: "Dashboard vidéos & KPIs",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="h-full" suppressHydrationWarning>
      <body className="min-h-screen bg-neutral-800 text-neutral-100" style={{ ["--nav-h" as any]: "56px" }}>
        {/* ✅ Le provider englobe la Navbar ET le contenu */}
        <AuthProvider>
          <Navbar />
          <div className="pt-[var(--nav-h)]">{children}</div>
        </AuthProvider>
      </body>
    </html>
  );
}
