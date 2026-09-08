// lib/meta/config.ts
// Constantes partagées pour l'intégration Meta (Instagram Graph API via Facebook Login).

// ⚠️ v19 est dépréciée depuis le 21/05/2026, v20 le 24/09/2026.
// Bumper ici quand Meta déprécie (une seule source de vérité).
export const META_GRAPH_VERSION = "v23.0";

export const META_GRAPH = `https://graph.facebook.com/${META_GRAPH_VERSION}`;
export const META_OAUTH_TOKEN = `${META_GRAPH}/oauth/access_token`;
export const META_OAUTH_DIALOG = `https://www.facebook.com/${META_GRAPH_VERSION}/dialog/oauth`;

// Facebook Login for Business : le dialogue OAuth utilise config_id (PAS scope).
// ID de la configuration "Social Hub - lecture insights" (public, visible dans l'URL OAuth).
// Permissions portées par la config : instagram_basic, instagram_manage_insights,
// pages_show_list, pages_read_engagement + types d'actifs Pages/Instagram.
export const META_LOGIN_CONFIG_ID =
  process.env.META_LOGIN_CONFIG_ID || "1771703167309447";

// Lecture seule : médias + insights Instagram + vidéos/insights de la Page liée.
// (On ne demande PAS instagram_content_publishing / instagram_manage_messages :
//  inutiles pour Social Hub et motif de refus à l'App Review.)
export const META_SCOPES = [
  "instagram_basic",
  "instagram_manage_insights",
  "pages_show_list",
  "pages_read_engagement",
] as const;

export const META_SCOPE_PARAM = META_SCOPES.join(",");
