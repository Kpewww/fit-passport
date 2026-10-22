-- Session 101h: brands' own size guides, entered by an admin. Additive only.
CREATE TABLE "BrandChartEntry" (
    "id" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "line" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "units" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL,
    "enteredBy" TEXT,
    "rowsJson" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BrandChartEntry_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "BrandChartEntry_brand_idx" ON "BrandChartEntry"("brand");
