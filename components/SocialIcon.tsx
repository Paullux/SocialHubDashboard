// components/SocialIcon.tsx
"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

export function SocialIcon({
  href,
  icon,
  connected,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  connected: boolean | null; // null = en cours de chargement
  label: string;
}) {
  return (
    <Link
      href={href}
      className="relative flex items-center justify-center w-10 h-10 transition-transform hover:scale-110"
      aria-label={label}
      title={label}
    >
      {icon}
      <span
        className={cn(
          "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-black transition-colors",
          connected === null
            ? "bg-yellow-400" // état indéfini → pastille jaune
            : connected
            ? "bg-green-500" // connecté
            : "bg-red-500" // déconnecté
        )}
      />
    </Link>
  );
}
