-- Construction du catalogue en plusieurs passages du cron (TikTok, jusqu'à
-- 3 000 vidéos) : pages déjà lues et curseur de reprise. Colonnes nullables,
-- sans effet sur les lignes existantes.
ALTER TABLE "VideoCatalog" ADD COLUMN "pendingItems" JSONB,
ADD COLUMN "pendingCursor" TEXT;
