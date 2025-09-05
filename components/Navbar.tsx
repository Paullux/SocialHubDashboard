"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LogIn, LogOut } from "lucide-react"; // icônes connexion/déconnexion
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
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false); // ⚠️ à remplacer par ton vrai état auth

  return (
    <nav className="fixed top-0 left-0 right-0 z-30 bg-neutral-900/90 backdrop-blur border-b border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          {/* Logo / Titre */}
          <div className="flex items-center gap-2">
            {/* Icône/logo (toujours visible) */}
            <span className="text-xl">
              {" "}
              <Link href="/" className="flex items-center gap-3">
                <Image
                  src="/social_hub_icon.svg"
                  alt="Social Hub"
                  width={36}
                  height={36}
                  className="rounded-md"
                  priority
                />
                {/* Texte caché en XS */}
                <span className="font-semibold text-white xs:hidden">
                  Social Hub
                </span>
              </Link>
            </span>
          </div>

          {/* Liens au centre (TikTok, YouTube, etc.) */}
          <div className="flex items-center ml-auto">
            <div className="flex items-center gap-[5px]">
              <Link href="/dashboard" className="hidden">
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
            </div>
          </div>

          {/* Bouton login/logout */}
          <button
            onClick={() => {
              if (isLoggedIn) {
                setIsLoggedIn(false);
                // TODO: ajouter ta vraie logique logout
              } else {
                // Redirige vers la page login
                router.push("/auth/login");
              }
            }}
            className="ml-2 p-5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white"
            title={isLoggedIn ? "Déconnexion" : "Connexion"}
          >
            {isLoggedIn ? <LogOut size={20} /> : <LogIn size={20} />}
          </button>
        </div>
      </div>
    </nav>
  );
}
