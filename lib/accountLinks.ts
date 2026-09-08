// lib/accountLinks.ts
import { prisma } from "@/lib/prisma";
import crypto from "node:crypto";

// -- clé AES obligatoire (32 octets base64)
function getKey(): Buffer {
  const raw = process.env.TOKENS_AES_KEY;
  if (!raw) throw new Error("[TOKENS_AES_KEY] missing (base64 32B)");
  let key: Buffer;
  try { key = Buffer.from(raw, "base64"); } catch { throw new Error("[TOKENS_AES_KEY] not base64"); }
  if (key.length !== 32) throw new Error(`[TOKENS_AES_KEY] must decode to 32 bytes, got ${key.length}`);
  return key;
}
const KEY = getKey();

// -- util crypto
export function enc(plaintext: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", KEY, iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ct]).toString("base64");
}

export function dec(payloadB64: string): string {
  const buf = Buffer.from(payloadB64, "base64");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const ct = buf.subarray(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", KEY, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8");
}

// -- lecture + déchiffrement d'un compte lié
export async function getAccountLink(
  userId: string,
  provider: "google-youtube" | "tiktok" | "instagram" | "facebook"
) {
  const row = await prisma.accountLink.findUnique({
    where: { userId_provider: { userId, provider } },
  });
  if (!row) return null;
  return {
    id: row.id,
    provider: row.provider,
    externalUserId: row.externalUserId,
    username: row.username,
    accessToken: dec(row.accessTokenEnc),
    refreshToken: row.refreshTokenEnc ? dec(row.refreshTokenEnc) : null,
    scope: row.scope,
    expiresAt: row.expiresAt,
    meta: (row.meta ?? {}) as Record<string, any>,
  };
}

// -- export nommé attendu par tes routes OAuth
export async function upsertAccountLink(args: {
  userId: string;
  provider: "google-youtube" | "tiktok" | "instagram";
  externalUserId: string;
  username?: string | null;
  accessToken: string;
  refreshToken?: string | null;
  scope?: string;
  expiresAtSec?: number | null;
  meta?: any;
}) {
  const expiresAt = args.expiresAtSec ? new Date(Date.now() + args.expiresAtSec * 1000) : null;

  return prisma.accountLink.upsert({
    where: { userId_provider: { userId: args.userId, provider: args.provider } },
    update: {
      externalUserId: args.externalUserId,
      username: args.username ?? undefined,
      accessTokenEnc: enc(args.accessToken),
      refreshTokenEnc: args.refreshToken ? enc(args.refreshToken) : undefined,
      scope: args.scope ?? "",
      expiresAt,
      meta: args.meta ?? undefined,
    },
    create: {
      userId: args.userId,
      provider: args.provider,
      externalUserId: args.externalUserId,
      username: args.username ?? null,
      accessTokenEnc: enc(args.accessToken),
      refreshTokenEnc: args.refreshToken ? enc(args.refreshToken) : null,
      scope: args.scope ?? "",
      expiresAt,
      meta: args.meta ?? null,
    },
  });
}
