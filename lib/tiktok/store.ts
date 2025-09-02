// lib/tiktok/store.ts
import { prisma } from "@/lib/db";

const PROVIDER = "tiktok";
// Remplace "me" si tu ajoutes une vraie gestion d'utilisateurs
const USER_ID = "me";

export async function getTikTokToken() {
  const row = await prisma.oAuthToken.findUnique({
    where: { provider_userId: { provider: PROVIDER, userId: USER_ID } },
  });
  if (!row) return null;
  return {
    accessToken: row.accessToken,
    refreshToken: row.refreshToken,
    expiresAt: Number(row.expiresAt),
  };
}

export async function saveTikTokToken(tokens: {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // ms epoch
  openId?: string;
  scope?: string;
}) {
  await prisma.oAuthToken.upsert({
    where: { provider_userId: { provider: PROVIDER, userId: USER_ID } },
    update: {
      openId: tokens.openId ?? undefined,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      scope: tokens.scope ?? undefined,
      expiresAt: BigInt(tokens.expiresAt),
      updatedAt: new Date(),
    },
    create: {
      provider: PROVIDER,
      userId: USER_ID,
      openId: tokens.openId ?? "",
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      scope: tokens.scope ?? "",
      expiresAt: BigInt(tokens.expiresAt),
    },
  });
}
