-- CreateTable
CREATE TABLE "public"."VideoMetric" (
    "platform" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "snapshotAt" TIMESTAMP(3) NOT NULL,
    "views" BIGINT NOT NULL DEFAULT 0,
    "likes" BIGINT NOT NULL DEFAULT 0,
    "comments" BIGINT NOT NULL DEFAULT 0,
    "shares" BIGINT,

    CONSTRAINT "VideoMetric_pkey" PRIMARY KEY ("platform","videoId","snapshotAt")
);

-- CreateIndex
CREATE INDEX "VideoMetric_platform_videoId_snapshotAt_idx" ON "public"."VideoMetric"("platform", "videoId", "snapshotAt");
