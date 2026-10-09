-- The signed fit scale takes one decimal place (Session 98): -10.0 .. +10.0.
-- AlterTable
ALTER TABLE "KnownGoodItem" ALTER COLUMN "fitDirection" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "ComfortCheck" ALTER COLUMN "direction" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "FitOutcome" ALTER COLUMN "fitDirection" SET DATA TYPE DOUBLE PRECISION;
