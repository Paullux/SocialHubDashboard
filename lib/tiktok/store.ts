// lib/tiktok/store.ts
import { prisma } from "@/lib/db";
import { enc, dec } from "@/lib/accountLinks";

const PROVIDER = "tiktok";
// Remplace "me" si tu ajoutes une vraie gestion d'utilisateurs
const USER_ID = "me";

// Préfixe des jetons chiffrés (AES-256-GCM, clé TOKENS_AES_KEY).
// Les valeurs sans préfixe sont d'anciens enregistrements en clair : elles sont
// lues telles quelles puis ré-écrites chiffrées au prochain saveTikTokToken
// (rafraîchissement quotidien du token TikTok).
const ENC_PREFIX = "enc:v1:";

function encToken(plain: string): string {
  return ENC_PREFIX + enc(plain);
}

function decToken(stored: string): string {
  if (!stored) return "";
  if (stored.startsWith(ENC_PREFIX)) {
    return dec(stored.slice(ENC_PREFIX.length));
  }
  return stored; // legacy : valeur en clair
}

export async function getTikTokToken() {
  const row = await prisma.oAuthToken.findUnique({
    where: { provider_userId: { provider: PROVIDER, userId: USER_ID } },
  });
  if (!row) return null;

  try {
    return {
      accessToken: decToken(row.accessToken),
      refreshToken: decToken(row.refreshToken),
      expiresAt: Number(row.expiresAt),
    };
  } catch (e) {
    // Jeton illisible (clé changée, donnée corrompue) : on force une reconnexion.
    console.error("[tiktok/store] decrypt failed, dropping stored token", e);
    return null;
  }
}

export async function saveTikTokToken(tokens: {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // ms epoch
  openId?: string;
  scope?: string;
}) {
  const accessToken = encToken(tokens.accessToken);
  const refreshToken = encToken(tokens.refreshToken);

  await prisma.oAuthToken.upsert({
    where: { provider_userId: { provider: PROVIDER, userId: USER_ID } },
    update: {
      openId: tokens.openId ?? undefined,
      accessToken,
      refreshToken,
      scope: tokens.scope ?? undefined,
      expiresAt: BigInt(tokens.expiresAt),
      updatedAt: new Date(),
    },
    create: {
      provider: PROVIDER,
      userId: USER_ID,
      openId: tokens.openId ?? "",
      accessToken,
      refreshToken,
      scope: tokens.scope ?? "",
      expiresAt: BigInt(tokens.expiresAt),
    },
  });
}
