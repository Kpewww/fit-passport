// Erasing an account, all of it (Session 100d/f): by its owner (/api/auth/delete) or by
// an admin (/api/admin/users). Gone with it: everything that cascades from User, its
// events and feedback, its photos in object storage, and accounts once folded into it.
// Reports, likes and votes it gave stay without its name (onDelete: SetNull).

import { prisma } from "./db";
import { dropPhotos } from "./photoStore";

export async function eraseAccount(userId: string): Promise<void> {
  const folded = await prisma.user.findMany({ where: { mergedIntoId: userId }, select: { id: true } });
  const ids = [userId, ...folded.map((f) => f.id)];
  // Photos in object storage go too; rows cascade, files do not.
  const photos = await prisma.knownGoodItem.findMany({ where: { userId: { in: ids } }, select: { imageDataUrl: true, cutoutPhoto: true } });
  // AI photos too (Session 104): try-on body photos and results.
  const aiPhotos = await prisma.aiPhoto.findMany({ where: { userId: { in: ids } }, select: { photo: true } });
  const aiResults = await prisma.mediaJob.findMany({ where: { userId: { in: ids }, result: { not: null } }, select: { result: true } });
  await prisma.$transaction([
    prisma.event.deleteMany({ where: { userId: { in: ids } } }),
    prisma.feedback.deleteMany({ where: { userId: { in: ids } } }),
    prisma.user.deleteMany({ where: { id: { in: folded.map((f) => f.id) } } }),
    prisma.user.delete({ where: { id: userId } }),
  ]);
  await dropPhotos([
    ...photos.flatMap((p) => [p.imageDataUrl, p.cutoutPhoto]),
    ...aiPhotos.map((p) => p.photo),
    ...aiResults.map((j) => j.result),
  ]);
}
