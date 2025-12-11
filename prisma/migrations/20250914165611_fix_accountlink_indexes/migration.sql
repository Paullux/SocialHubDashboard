-- CreateTable
CREATE TABLE "public"."AccountLink" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "externalUserId" TEXT NOT NULL,
    "username" TEXT,
    "accessTokenEnc" TEXT NOT NULL,
    "refreshTokenEnc" TEXT,
    "scope" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AccountLink_userId_idx" ON "public"."AccountLink"("userId");

-- CreateIndex
CREATE INDEX "AccountLink_externalUserId_idx" ON "public"."AccountLink"("externalUserId");

-- CreateIndex
CREATE UNIQUE INDEX "AccountLink_userId_provider_key" ON "public"."AccountLink"("userId", "provider");
