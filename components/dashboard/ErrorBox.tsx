// components/dashboard/ErrorBox.tsx
"use client";

import type { Lang } from "@/lib/uiLang";

export default function ErrorBox({ message, lang = "fr" }: { message: string; lang?: Lang }) {
  return (
    <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800">
      {lang === "fr" ? "Erreur :" : "Error:"} {message}
    </div>
  );
}
