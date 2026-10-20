-- Session 100: a seller's per-size height and weight ("身高 160-180 / 体重 50-65"),
-- read as a weak signal for a wearer with no chest of their own. Additive only.
ALTER TABLE "SizeOption" ADD COLUMN "bodyHeightMinCm" DOUBLE PRECISION;
ALTER TABLE "SizeOption" ADD COLUMN "bodyHeightMaxCm" DOUBLE PRECISION;
ALTER TABLE "SizeOption" ADD COLUMN "bodyWeightMinKg" DOUBLE PRECISION;
ALTER TABLE "SizeOption" ADD COLUMN "bodyWeightMaxKg" DOUBLE PRECISION;
