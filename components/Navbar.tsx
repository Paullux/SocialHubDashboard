// components/Navbar.tsx
"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Button from "./Button";
import { SocialIcon } from "./SocialIcon";
import { FaYoutube, FaTiktok, FaInstagram, FaFacebook } from "react-icons/fa";

type Status = {
  youtube: boolean | null;
  tiktok: boolean | null;
  instagram: boolean | null;
  facebook: boolean | null;
};

export default function Navbar() {
  const [status, setStatus] = useState<Status>({
    youtube: false,
    tiktok: false,
    instagram: false,
    facebook: false,
  });

  useEffect(() => {
    fetch("/api/auth/status")
      .then((res) => res.json())
      .then(setStatus)
      .catch(() =>
        setStatus({
          youtube: false,
          tiktok: false,
          instagram: false,
          facebook: false,
        })
      );
  }, []);

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
          <SocialIcon
            href="/api/auth/youtube"
            icon={<FaYoutube size={24} className="text-red-500" />}
            connected={status.youtube}
            label="YouTube"
          />
          <SocialIcon
            href="/api/auth/tiktok"
            icon={<FaTiktok size={24} className="text-white" />}
            connected={status.tiktok}
            label="TikTok"
          />
          <SocialIcon
            href="/api/auth/instagram"
            icon={<FaInstagram size={24} className="text-pink-500" />}
            connected={status.instagram}
            label="Instagram"
          />
          <SocialIcon
            href="/api/auth/facebook"
            icon={<FaFacebook size={24} className="text-blue-500" />}
            connected={status.facebook}
            label="Facebook"
          />
          <Button className="text-sm">
            <Link href="/auth/login">Connexion / Créer un compte</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
