// Move closet photos already in the database to object storage (Session 100,
// todo/engineering/07). New photos go there by themselves once BLOB_READ_WRITE_TOKEN
// is set (src/lib/photoStore.ts); this moves the ones from before.
//
//   DATABASE_URL=… BLOB_READ_WRITE_TOKEN=… node scripts/photos-to-blob.mjs           # dry run: counts only
//   DATABASE_URL=… BLOB_READ_WRITE_TOKEN=… node scripts/photos-to-blob.mjs --apply   # move them
//
// Uses the Postgres client (prisma/schema.postgres.prisma, `npm run db:pg:generate`).
// Each photo is uploaded, then its row updated; a failure leaves that row as it was.

import { createHash } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { put } from "@vercel/blob";

const apply = process.argv.includes("--apply");
if (!process.env.BLOB_READ_WRITE_TOKEN) { console.error("BLOB_READ_WRITE_TOKEN is not set"); process.exit(1); }
const prisma = new PrismaClient();
let moved = 0, failed = 0, bytes = 0;
for (let cursor; ;) {
  const rows = await prisma.knownGoodItem.findMany({
    where: { imageDataUrl: { startsWith: "data:" } },
    select: { id: true, userId: true, imageDataUrl: true },
    take: 50, orderBy: { id: "asc" }, ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
  });
  if (!rows.length) break;
  cursor = rows.at(-1).id;
  for (const r of rows) {
    const m = r.imageDataUrl.match(/^data:(image\/(?:png|jpeg|webp));base64,(.*)$/);
    if (!m) continue;
    const buf = Buffer.from(m[2], "base64");
    bytes += buf.length;
    if (!apply) { moved++; continue; }
    try {
      const owner = createHash("sha256").update(r.userId).digest("hex").slice(0, 16);
      const blob = await put(`closet/${owner}/photo.${m[1].split("/")[1].replace("jpeg", "jpg")}`, buf, { access: "public", contentType: m[1], addRandomSuffix: true });
      await prisma.knownGoodItem.update({ where: { id: r.id }, data: { imageDataUrl: "blob:" + blob.url } });
      moved++;
    } catch (e) {
      failed++;
      console.warn("left in place:", r.id, e instanceof Error ? e.message : e);
    }
  }
}
console.log(`${apply ? "moved" : "would move"} ${moved} photos (${(bytes / 1e6).toFixed(1)} MB)${failed ? `, ${failed} left in place` : ""}`);
await prisma.$disconnect();
