-- Session 104: the wear calendar (what was worn on a day) and seasons on closet items. Additive only.
-- AlterTable
ALTER TABLE "KnownGoodItem" ADD COLUMN     "seasons" TEXT;

-- CreateTable
CREATE TABLE "WearLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'worn',
    "outfitId" TEXT,
    "note" TEXT,
    "photo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WearLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WearLogItem" (
    "id" TEXT NOT NULL,
    "wearLogId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,

    CONSTRAINT "WearLogItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WearLog_userId_day_idx" ON "WearLog"("userId", "day");

-- CreateIndex
CREATE INDEX "WearLogItem_itemId_idx" ON "WearLogItem"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "WearLogItem_wearLogId_itemId_key" ON "WearLogItem"("wearLogId", "itemId");

-- AddForeignKey
ALTER TABLE "WearLog" ADD CONSTRAINT "WearLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WearLog" ADD CONSTRAINT "WearLog_outfitId_fkey" FOREIGN KEY ("outfitId") REFERENCES "Outfit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WearLogItem" ADD CONSTRAINT "WearLogItem_wearLogId_fkey" FOREIGN KEY ("wearLogId") REFERENCES "WearLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WearLogItem" ADD CONSTRAINT "WearLogItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "KnownGoodItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

