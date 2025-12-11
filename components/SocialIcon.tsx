// components/SocialIcon.tsx
"use client";
import React from "react";

export function SocialIcon({
  icon,
  label,
  connected,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  connected?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={connected ? `${label} connecté` : `Connecter ${label}`}
      className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5
        ${connected ? "border-green-600/60 bg-green-600/10" : "border-neutral-700 bg-neutral-800 hover:bg-neutral-700"}`}
    >
      {icon}
      <span className="sr-only">{label}</span>
      <span aria-hidden className={`h-2 w-2 rounded-full ${connected ? "bg-green-500" : "bg-neutral-500/60"}`} />
    </button>
  );
}
