// Closet-item "evidence" attachments for Ask & Answer.
//
// This is the feature that makes our Q&A different from a forum: an answer can
// point at a garment the answerer ACTUALLY OWNS, so the reader gets brand, size,
// how well it fits, and the owner's coarse body type.
//
// PRIVACY: everything here is the same class of data /api/view/[code] already
// exposes publicly — brand / category / size / fit rating / coarse body type.
// Precise measurements live on FitProfile and are never selected. Attachments
// from deactivated accounts resolve to nothing, like every other external read.

import { prisma } from "./db";

export type EvidenceView = {
  id: string;
  brand: string;
  displayName: string | null;
  category: string;
  gender: string | null;
  size: string;
  region: string | null;
  fitRating: number;
  color: string | null;
  /** The owner's coarse body type — the whole point of "fits a body like mine". */
  ownerBodyType: string | null;
};

/**
 * Resolve many attachments in one query. Returns a map so callers can look up by
 * id; ids that no longer exist (item deleted, owner deactivated) are simply
 * absent, which the UI renders as "attachment no longer available".
 */
export async function loadEvidence(
  ids: Array<string | null | undefined>,
): Promise<Map<string, EvidenceView>> {
  const unique = [...new Set(ids.filter((v): v is string => !!v))];
  if (unique.length === 0) return new Map();

  const items = await prisma.knownGoodItem.findMany({
    where: { id: { in: unique } },
    select: {
      id: true,
      brand: true,
      displayName: true,
      category: true,
      gender: true,
      size: true,
      region: true,
      fitRating: true,
      color: true,
      // Coarse only, and only if the owner shows it.
      user: { select: { bodyType: true, showBodyType: true, deactivated: true } },
    },
  });

  const map = new Map<string, EvidenceView>();
  for (const it of items) {
    if (it.user.deactivated) continue;
    map.set(it.id, {
      id: it.id,
      brand: it.brand,
      displayName: it.displayName,
      category: it.category,
      gender: it.gender,
      size: it.size,
      region: it.region,
      fitRating: it.fitRating,
      color: it.color,
      ownerBodyType: it.user.showBodyType ? it.user.bodyType : null,
    });
  }
  return map;
}

/**
 * True if `knownGoodId` is a closet item belonging to `userId`. You may only
 * attach your OWN garments — otherwise "evidence" would be hearsay.
 */
export async function ownsClosetItem(knownGoodId: string, userId: string): Promise<boolean> {
  const hit = await prisma.knownGoodItem.findFirst({
    where: { id: knownGoodId, userId },
    select: { id: true },
  });
  return !!hit;
}
