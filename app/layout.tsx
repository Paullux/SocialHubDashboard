// app/layout.tsx
import type { Metadata } from "next";
import "./../styles/globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Social Hub",
  description: "Vous et vos réseaux",
  themeColor: "#111111", // correspond au theme_color du manifest
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/social_hub_icon.svg", type: "image/svg+xml" },
      { url: "/social_hub_icon.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: "/favicon.ico",
    apple: "/social_hub_icon.png",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="dark">
      <head>
        {/* Couleur de la barre d’adresse mobile */}
        <meta name="theme-color" content="#111111" />
      </head>
      <body className="overflow-x-hidden pt-16">
        <Navbar />
        <main className="container py-10">{children}</main>
      </body>
    </html>
  );
}
