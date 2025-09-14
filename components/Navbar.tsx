// components/Navbar.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { LogIn, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { SocialIcon } from "./SocialIcon";
import { FaYoutube, FaTiktok, FaInstagram } from "react-icons/fa";
import { useKindeAuth } from "@kinde-oss/kinde-auth-nextjs";
import { LoginLink, LogoutLink } from "@kinde-oss/kinde-auth-nextjs/components";

type Status = { youtube: boolean | null; tiktok: boolean | null; instagram: boolean | null };

export default function Navbar() {
  const [status, setStatus] = useState<Status>({ youtube: false, tiktok: false, instagram: false });
  const { isAuthenticated, isLoading } = useKindeAuth();

  useEffect(() => {
    fetch("/api/auth/status")
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => setStatus({ youtube: false, tiktok: false, instagram: false }));
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-30 bg-neutral-900/90 backdrop-blur border-b border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex h-14 items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/social_hub_icon.svg" alt="Social Hub" width={28} height={28} className="rounded-md" priority />
            <span className="font-semibold text-neutral-100">Social Hub</span>
          </Link>

          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2">
              <SocialIcon href="/api/auth/youtube"   icon={<FaYoutube size={20} className="text-red-500" />}   connected={status.youtube}   label="YouTube" />
              <SocialIcon href="/api/auth/tiktok"    icon={<FaTiktok  size={20} className="text-white" />}      connected={status.tiktok}    label="TikTok" />
              <SocialIcon href="/api/auth/instagram" icon={<FaInstagram size={20} className="text-pink-500" />} connected={status.instagram} label="Instagram" />
            </div>

            {/* Auth CTA — sans props customs */}
            {isAuthenticated ? (
              <LogoutLink className="ml-1 px-3 py-2 rounded-lg border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-white disabled:opacity-50">
                <LogOut size={18} />
              </LogoutLink>
            ) : (
              <LoginLink className="ml-1 px-3 py-2 rounded-lg border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-white disabled:opacity-50">
                <LogIn size={18} />
              </LoginLink>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
