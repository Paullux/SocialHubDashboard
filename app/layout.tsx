// app/layout.tsx
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Social Hub",
  description: "Dashboard YouTube & TikTok",
  // ❌ ne pas mettre themeColor ici
};

export const viewport: Viewport = {
  // Une valeur simple :
  // themeColor: "#111111",

  // Ou bien réactif au scheme :
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#111111" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="dark" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
