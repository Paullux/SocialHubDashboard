// lib/imageProbe.server.ts
import "server-only";
import probe from "probe-image-size";

export type ImageDimensions = { width: number; height: number };

// Cache mémoire des dimensions déjà sondées (une miniature donnée change rarement).
const cache = new Map<string, { data: ImageDimensions | null; exp: number }>();
const TTL_MS = 6 * 60 * 60 * 1000; // 6h

/** Sonde les dimensions d'une image distante en ne lisant que son en-tête
 *  (pas de téléchargement complet — `probe-image-size` coupe la connexion dès
 *  que la taille est connue). Best-effort : ne throw jamais, renvoie `null`
 *  si l'image est inaccessible, trop lente ou d'un format non reconnu. */
export async function probeImageSize(url: string): Promise<ImageDimensions | null> {
  if (!url) return null;

  const cached = cache.get(url);
  if (cached && cached.exp > Date.now()) return cached.data;

  let result: ImageDimensions | null;
  try {
    const r = await probe(url, {
      open_timeout: 4000,
      response_timeout: 4000,
      read_timeout: 4000,
    });
    result = { width: r.width, height: r.height };
  } catch {
    result = null;
  }

  cache.set(url, { data: result, exp: Date.now() + TTL_MS });
  return result;
}

/** Exécute `fn` sur chaque élément avec au plus `limit` appels en vol. */
async function mapWithConcurrency<T>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<void>
): Promise<void> {
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      await fn(items[idx]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
}

/** Complète `thumbnailWidth`/`thumbnailHeight` sur les vidéos qui n'ont pas
 *  déjà cette info (typiquement TikTok/Instagram — YouTube la fournit dans
 *  son propre payload, voir `fetchVideos.ts`). Best-effort, mute la liste en
 *  place, ne fait jamais échouer l'appelant si une sonde échoue. */
export async function attachThumbnailDimensions<
  T extends { thumbnail?: string; thumbnailWidth?: number; thumbnailHeight?: number }
>(items: T[], concurrency = 12): Promise<void> {
  await mapWithConcurrency(items, concurrency, async (v) => {
    if (!v.thumbnail || (v.thumbnailWidth && v.thumbnailHeight)) return;
    const size = await probeImageSize(v.thumbnail);
    if (size) {
      v.thumbnailWidth = size.width;
      v.thumbnailHeight = size.height;
    }
  });
}
