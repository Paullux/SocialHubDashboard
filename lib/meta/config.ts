// lib/meta/config.ts
// Constantes partagées pour l'intégration Instagram (Instagram API with Instagram
// Login — graph.instagram.com). Remplace l'ancien flux Facebook Login for Business
// depuis le 2026-09-11 : plus de Page Facebook requise pour les insights.

export const IG_LOGIN_GRAPH_VERSION = "v23.0";

export const IG_LOGIN_GRAPH = `https://graph.instagram.com/${IG_LOGIN_GRAPH_VERSION}`;
export const IG_LOGIN_OAUTH_AUTHORIZE = "https://www.instagram.com/oauth/authorize";
export const IG_LOGIN_OAUTH_TOKEN = "https://api.instagram.com/oauth/access_token";
export const IG_LOGIN_EXCHANGE_TOKEN = `https://graph.instagram.com/${IG_LOGIN_GRAPH_VERSION}/access_token`;
export const IG_LOGIN_REFRESH_TOKEN = `https://graph.instagram.com/${IG_LOGIN_GRAPH_VERSION}/refresh_access_token`;

// Lecture seule : profil + médias + insights. On ne demande PAS
// instagram_business_content_publish / _manage_comments / _manage_messages :
// inutiles pour Social Hub (dashboard) et motif de refus à l'App Review.
export const IG_LOGIN_SCOPES = [
  "instagram_business_basic",
  "instagram_business_manage_insights",
] as const;

export const IG_LOGIN_SCOPE_PARAM = IG_LOGIN_SCOPES.join(",");
