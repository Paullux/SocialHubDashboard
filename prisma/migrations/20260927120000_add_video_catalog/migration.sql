-- Cache du catalogue vidéo par utilisateur et plateforme : sert les tris par
-- vues / likes / commentaires sur toutes les vidéos, pas seulement les 60
-- dernières. Rempli par /api/cron/snapshot et, au besoin, par /api/videos.
CREATE TABLE "VideoCatalog" (
    "userId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "latestVideoId" TEXT,
    "items" JSONB NOT NULL,
    "refreshedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VideoCatalog_pkey" PRIMARY KEY ("userId","platform")
);
