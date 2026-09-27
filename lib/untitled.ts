// lib/untitled.ts
// Titre de remplacement d'une vidéo qui n'en a pas. TikTok et Instagram
// acceptent les publications sans description / légende — et chez nous le
// titre de ces plateformes EST la légende — : la carte affichait alors une
// ligne vide. YouTube impose un titre, mais on couvre le cas par sécurité.
// La date n'est pas répétée : la carte l'affiche déjà à côté du badge.
import type { Platform } from "@/lib/types";
import type { Lang } from "@/lib/uiLang";

const LABELS: Record<Lang, Record<Platform, string>> = {
  fr: {
    tiktok: "Vidéo TikTok sans description",
    instagram: "Publication Instagram sans légende",
    youtube: "Vidéo YouTube sans titre",
  },
  en: {
    tiktok: "TikTok video without a description",
    instagram: "Instagram post without a caption",
    youtube: "Untitled YouTube video",
  },
};

export function untitledLabel(platform: Platform, lang: Lang): string {
  return LABELS[lang][platform];
}
