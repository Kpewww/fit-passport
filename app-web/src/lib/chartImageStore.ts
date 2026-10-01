// The database behind chartImage.ts's cache — kept apart so the reader can be
// tested without one.

import { prisma } from "./db";
import type { ChartImageStore } from "./chartImage";

export const prismaChartImageStore: ChartImageStore = {
  async get(imageKey) {
    const row = await prisma.chartImageRead.findUnique({ where: { imageKey } });
    return row ? { sizesJson: row.sizesJson, header: row.header } : null;
  },
  async put(imageKey, imageUrl, read, model) {
    await prisma.chartImageRead.upsert({
      where: { imageKey },
      create: { imageKey, imageUrl, sizesJson: read.sizesJson, header: read.header, model },
      update: {},
    });
  },
};
