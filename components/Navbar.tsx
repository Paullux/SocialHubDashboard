// components/Navbar.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { LogIn, LogOut } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { SocialIcon } from "./SocialIcon";
import { FaYoutube, FaTiktok, FaInstagram } from "react-icons/fa";
import { useKindeAuth, useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { LoginLink, LogoutLink } from "@kinde-oss/kinde-auth-nextjs/components";

type Status = { youtube: boolean; tiktok: boolean; instagram: boolean };

export default function Navbar() {
  const [status, setStatus] = useState<Status>({ youtube: false, tiktok: false, instagram: false });
  const { isAuthenticated, isLoading } = useKindeBrowserClient();

  useEffect(() => {
    fetch("/api/auth/status")
      .then((r) => r.json())
      .then((s) => setStatus({ youtube: !!s.youtube, tiktok: !!s.tiktok, instagram: !!s.instagram }))
      .catch(() => setStatus({ youtube: false, tiktok: false, instagram: false }));
  }, []);

  const go = useCallback((provider: "youtube" | "tiktok" | "instagram") => {
    if (!isAuthenticated && !isLoading) {
      window.location.href = "/login";
      return;
    }
    if (provider === "youtube") {
      window.location.href = status.youtube
        ? "/settings/linked-accounts"
        : "/api/oauth/google-youtube/start";
    } else if (provider === "tiktok") {
      window.location.href = status.tiktok
        ? "/settings/linked-accounts"
        : "/api/oauth/tiktok/start";
    } else {
      window.location.href = status.instagram
        ? "/settings/linked-accounts"
        : "/api/oauth/instagram/start";
    }
  }, [isAuthenticated, isLoading, status]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-30 bg-neutral-900/90 backdrop-blur border-b border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex h-14 items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/social_hub_icon.svg" alt="Social Hub Dashboard" width={28} height={28} className="rounded-md" priority />
            <span className="font-semibold text-neutral-100 sm:text-lg">
              Social Hub<span className="hidden sm:inline">&nbsp;Dashboard</span>
            </span>
          </Link>

          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2">
              <SocialIcon
                onClick={() => go("youtube")}
                icon={<FaYoutube size={20} className="text-red-500" />}
                connected={status.youtube}
                label="YouTube"
              />
              <SocialIcon
                onClick={() => go("tiktok")}
                icon={<FaTiktok size={20} className="text-white" />}
                connected={status.tiktok}
                label="TikTok"
              />
              <SocialIcon
                onClick={() => go("instagram")}
                icon={<FaInstagram size={20} className="text-pink-500" />}
                connected={status.instagram}
                label="Instagram"
              />
            </div>

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
