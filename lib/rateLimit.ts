// lib/rateLimit.ts
const buckets = new Map<string, { ts: number; count: number }>();

const WINDOW = 60; // secondes
const MAX = 30; // max 30 requêtes par minute par IP

/**
 * Vérifie si une IP a dépassé la limite de requêtes dans la fenêtre de temps
 */
export function isRateLimited(ip: string) {
  const now = Math.floor(Date.now() / 1000);
  const bucket = buckets.get(ip) ?? { ts: now, count: 0 };

  // Réinitialise si la fenêtre est expirée
  if (now - bucket.ts >= WINDOW) {
    bucket.ts = now;
    bucket.count = 0;
  }

  bucket.count++;
  buckets.set(ip, bucket);

  return bucket.count > MAX;
}
