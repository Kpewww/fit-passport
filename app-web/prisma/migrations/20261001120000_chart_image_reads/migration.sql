-- CreateTable
CREATE TABLE "ChartImageRead" (
    "id" TEXT NOT NULL,
    "imageKey" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "sizesJson" TEXT NOT NULL,
    "header" TEXT,
    "model" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChartImageRead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ChartImageRead_imageKey_key" ON "ChartImageRead"("imageKey");
