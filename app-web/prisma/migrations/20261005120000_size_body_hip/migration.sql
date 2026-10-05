-- Session 84: dresses and jumpsuits are sized by hip. A body chart states the hip
-- a size is cut for as a range, like chest and waist; garment hip uses "hipCm".
ALTER TABLE "SizeOption" ADD COLUMN "bodyHipMinCm" DOUBLE PRECISION;
ALTER TABLE "SizeOption" ADD COLUMN "bodyHipMaxCm" DOUBLE PRECISION;
