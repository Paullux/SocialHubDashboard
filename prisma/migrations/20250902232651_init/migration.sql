-- CreateTable
CREATE TABLE "public"."OAuthToken" (
    "provider" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "openId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "expiresAt" BIGINT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OAuthToken_pkey" PRIMARY KEY ("provider","userId")
);

-- CreateIndex
CREATE INDEX "OAuthToken_expiresAt_idx" ON "public"."OAuthToken"("expiresAt");
