// components/Navbar.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import Button from "./Button";

export default function Navbar() {
  return (
    <header className="border-b border-white/10">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/social_hub_icon.svg"
            alt="Social Hub"
            width={36}
            height={36}
            className="rounded-md"
            priority
          />
          <span className="font-semibold tracking-wide">Social Hub</span>
        </Link>

        <nav className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="text-sm text-neutral-300 hover:text-white"
          >
            Dashboard
          </Link>

          <Link href="/api/auth/tiktok" className="text-sm text-neutral-300 hover:text-white">
            Connecter / Reconnecter TikTok
          </Link>

          <Button asChild className="text-sm">
            <Link href="/auth/login">Connexion / Créer un compte</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
