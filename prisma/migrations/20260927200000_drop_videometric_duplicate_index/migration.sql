-- Index identique à la clé primaire (platform, videoId, snapshotAt) : il
-- doublait l'espace occupé par la table sans servir aucune requête de plus
-- (111 Mo mesurés le 2026-09-27). La clé primaire couvre les mêmes recherches.
DROP INDEX IF EXISTS "VideoMetric_platform_videoId_snapshotAt_idx";
