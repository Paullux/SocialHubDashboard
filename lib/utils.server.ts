// lib/utils.server.ts
import "server-only";

export const ms = (n: number) => new Promise((r) => setTimeout(r, n));

export async function withTimeout<T>(p: Promise<T>, msLimit: number, label: string): Promise<T> {
  let to: any;
  const killer = new Promise<never>((_, rej) => {
    to = setTimeout(() => rej(new Error(`timeout:${label}`)), msLimit);
  });
  try { const res = await Promise.race([p, killer]); return res as T; }
  finally { clearTimeout(to); }
}

export function normalizeUrl(u?: string) {
  if (!u) return "";
  return u.startsWith("//") ? `https:${u}` : u;
}

// TODO: brancher un vrai KV/Redis
const mem = new Map<string, { data: any; ts: number }>();
export function cacheGet<T>(key: string, maxAgeMs: number): T | null {
  const x = mem.get(key); if (!x) return null;
  if (Date.now() - x.ts > maxAgeMs) return null; return x.data as T;
}
export function cacheSet(key: string, data: any) { mem.set(key, { data, ts: Date.now() }); }