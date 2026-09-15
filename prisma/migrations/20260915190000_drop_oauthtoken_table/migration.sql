-- Drop the legacy shared TikTok token table (userId "me"), fully replaced by
-- per-user AccountLink linking. No remaining code reference (lib/tiktok/store.ts
-- deleted in the same change).
DROP TABLE "OAuthToken";
