// lib/youtube/catalog.server.ts
// Catalogue YouTube complet d'un utilisateur, mis en cache dans VideoCatalog.
//
// Pourquoi : /api/videos ne lit que les N dernières vidéos publiées. Trier ce lot
// par vues donnait « les plus vues parmi les 60 dernières », pas le vrai top de
// la chaîne. On garde donc toute la liste publique (compteurs compris) en base,
// et les tris par métrique ne sont plus qu'un tri + slice sur ce cache.
//
// Coût : playlistItems + videos.list avec la clé API, 1 unité de quota par lot
// de 50 vidéos — environ 40 unités pour 1 000 vidéos. Pas besoin de l'API
// Analytics (retard de ~2 jours, un appel par métrique) : un seul parcours donne
// vues, likes et commentaires à jour.
import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { fetchYouTubeLatest } from "@/lib/fetchVideos";
import type { VideoItem } from "@/lib/types";

const PLATFORM = "youtube";
const MAX_VIDEOS = 1000; // borne le temps de reconstruction et la taille du JSON
// Sans nouvelle vidéo, les compteurs évoluent quand même : on reconstruit
// au-delà de cet âge pour que les classements ne se figent pas.
const MAX_AGE_MS = 6 * 3_600_000;

async function rebuild(userId: string, channelId: string, apiKey: string): Promise<VideoItem[]> {
  // fetchYouTubeLatest trie par date décroissante : items[0] est la plus récente.
  const items = await fetchYouTubeLatest(apiKey, channelId, MAX_VIDEOS);
  const data = {
    sourceId: channelId,
    latestVideoId: items[0]?.id ?? null,
    items: items as unknown as Prisma.InputJsonValue,
    refreshedAt: new Date(),
  };
  await prisma.videoCatalog.upsert({
    where: { userId_platform: { userId, platform: PLATFORM } },
    update: data,
    create: { userId, platform: PLATFORM, ...data },
  });
  return items;
}

/**
 * Lecture pour /api/videos. Sert le cache tel quel ; ne le calcule à la volée
 * que s'il n'existe pas encore (compte lié depuis le dernier cron) ou s'il
 * appartient à une autre chaîne (compte re-lié).
 */
export async function getYouTubeCatalog(
  userId: string,
  channelId: string,
  apiKey: string
): Promise<VideoItem[]> {
  const row = await prisma.videoCatalog.findUnique({
    where: { userId_platform: { userId, platform: PLATFORM } },
    select: { sourceId: true, items: true },
  });
  if (row && row.sourceId === channelId) return row.items as unknown as VideoItem[];
  return rebuild(userId, channelId, apiKey);
}

/**
 * Appelée par le cron horaire, qui connaît déjà la vidéo la plus récente (il
 * vient de lister les dernières pour le snapshot). Reconstruit seulement si une
 * vidéo est apparue ou a disparu en tête, si la chaîne a changé ou si le cache
 * a dépassé MAX_AGE_MS. Renvoie true si le cache a été reconstruit.
 */
export async function syncYouTubeCatalog(
  userId: string,
  channelId: string,
  apiKey: string,
  latestVideoId: string | null
): Promise<boolean> {
  const row = await prisma.videoCatalog.findUnique({
    where: { userId_platform: { userId, platform: PLATFORM } },
    select: { sourceId: true, latestVideoId: true, refreshedAt: true },
  });
  const upToDate =
    row !== null &&
    row.sourceId === channelId &&
    row.latestVideoId === latestVideoId &&
    Date.now() - row.refreshedAt.getTime() < MAX_AGE_MS;
  if (upToDate) return false;
  await rebuild(userId, channelId, apiKey);
  return true;
}

/** Déconnexion / effacement : le catalogue est rattaché à l'utilisateur. */
export async function deleteYouTubeCatalog(userId: string): Promise<void> {
  await prisma.videoCatalog.deleteMany({ where: { userId, platform: PLATFORM } });
}
