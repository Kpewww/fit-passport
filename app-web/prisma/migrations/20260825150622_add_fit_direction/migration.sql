-- AlterTable
ALTER TABLE "User" ADD COLUMN     "fitScaleMode" TEXT NOT NULL DEFAULT 'descriptive';

-- AlterTable
ALTER TABLE "KnownGoodItem" ADD COLUMN     "fitDirection" INTEGER;

-- AlterTable
ALTER TABLE "ComfortCheck" ADD COLUMN     "direction" INTEGER;

