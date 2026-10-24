-- Session 104: AI photo processing (consent per kind, try-on body photos, jobs) and closet cutouts. Additive only.
-- AlterTable
ALTER TABLE "KnownGoodItem" ADD COLUMN     "cutoutPhoto" TEXT,
ADD COLUMN     "photoView" TEXT;

-- CreateTable
CREATE TABLE "AiConsent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiConsent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiPhoto" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "photo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaJob" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerJobId" TEXT,
    "itemId" TEXT,
    "aiPhotoId" TEXT,
    "result" TEXT,
    "costUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MediaJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AiConsent_userId_kind_key" ON "AiConsent"("userId", "kind");

-- CreateIndex
CREATE INDEX "AiPhoto_userId_idx" ON "AiPhoto"("userId");

-- CreateIndex
CREATE INDEX "MediaJob_userId_createdAt_idx" ON "MediaJob"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "MediaJob_createdAt_idx" ON "MediaJob"("createdAt");

-- AddForeignKey
ALTER TABLE "AiConsent" ADD CONSTRAINT "AiConsent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiPhoto" ADD CONSTRAINT "AiPhoto_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaJob" ADD CONSTRAINT "MediaJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

