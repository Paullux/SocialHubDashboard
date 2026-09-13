// lib/owner.ts
// L'app n'est pas encore multi-tenant pour YouTube et TikTok : la chaîne
// YouTube est un ID de chaîne fixe (YT_CHANNEL_ID, clé API publique) et le
// jeton TikTok est stocké dans une table partagée unique (lib/tiktok/store.ts).
// Tant que ces deux intégrations ne sont pas migrées vers un stockage par
// utilisateur (comme Instagram, qui utilise déjà le token propre de chaque
// compte lié), on restreint leur affichage au seul propriétaire de l'app,
// identifié par email — sinon n'importe quel compte Kinde qui termine le flow
// OAuth (ex : un revieweur Google) voit les données du propriétaire.
import "server-only";

const FALLBACK_OWNER_EMAIL = "paulwoisard@gmail.com";

export function isOwnerEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const owner = (process.env.OWNER_EMAIL || FALLBACK_OWNER_EMAIL).trim().toLowerCase();
  return email.trim().toLowerCase() === owner;
}
