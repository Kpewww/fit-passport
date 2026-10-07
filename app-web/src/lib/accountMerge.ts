// One browser, one account — Session 92b.
//
// After the move to www.fitpassport.fit a browser can hold one account at the old
// address and another at the new one: the store's 0.7.1 extension calls the old
// address's API with the old cookie while the website runs on the new cookie. The
// founder's test found exactly that: measurements typed into the website, and the
// extension still "can't tell these sizes apart", because it was asking about the
// other account.
//
// So when the session hand-over (lib/sessionCarry.ts) finds two different accounts in
// one browser, they become one:
//   - which one stays: a claimed account (it has a password) over an unclaimed one;
//     otherwise the one at the new address, unless it is empty and the other is not;
//   - the other, if unclaimed, is FOLDED into it: its closet, folders, saved
//     products, checks, outcomes, outfits and pets move over, and its profile fills
//     the gaps in the staying one's — never overwriting anything already there;
//   - the folded account keeps a pointer (User.mergedIntoId), and getCurrentUser()
//     follows it, so a cookie that still names it — the old address's, used by an
//     older extension — lands on the staying account from its next request on.
// Two claimed accounts are never folded: each has a password and may be open on
// another device. Community activity (posts, answers, likes, follows, blocks,
// reports) is not moved; an unclaimed account cannot be listed, and moving
// authorship between accounts is not ours to decide.

import { prisma } from "./db";

type Side = { id: string; claimed: boolean; hasData: boolean };

export type MergePlan =
  | { kind: "same"; keep: string }
  | { kind: "fold"; keep: string; fold: string }
  /** Both claimed: the browser's address keeps its own, nothing moves. */
  | { kind: "keep-both"; keep: string };

/** Which account a browser keeps when its two addresses hold different ones. */
export function mergePlan(here: Side, carried: Side): MergePlan {
  if (here.id === carried.id) return { kind: "same", keep: here.id };
  if (here.claimed && carried.claimed) return { kind: "keep-both", keep: here.id };
  if (here.claimed !== carried.claimed) {
    const [keep, fold] = here.claimed ? [here, carried] : [carried, here];
    return { kind: "fold", keep: keep.id, fold: fold.id };
  }
  const keepHere = here.hasData || !carried.hasData;
  return keepHere ? { kind: "fold", keep: here.id, fold: carried.id } : { kind: "fold", keep: carried.id, fold: here.id };
}

/** Where an account id leads once folds are followed (a short chain at most). */
export async function resolveAccount(userId: string): Promise<string> {
  let id = userId;
  for (let hop = 0; hop < 5; hop++) {
    const u = await prisma.user.findUnique({ where: { id }, select: { mergedIntoId: true } });
    if (!u?.mergedIntoId || u.mergedIntoId === id) return id;
    id = u.mergedIntoId;
  }
  return id;
}

/** Fields of a profile that are not the person's: never copied. */
const PROFILE_SKIP = new Set(["id", "userId", "createdAt", "updatedAt"]);

/**
 * Move everything an unclaimed account holds into another, and point it there.
 * One transaction: either all of it moves or none of it does. Refuses a claimed
 * account, which only a password should ever reach.
 */
export async function foldAccount(foldId: string, keepId: string): Promise<void> {
  if (foldId === keepId) return;
  await prisma.$transaction(async (tx) => {
    const fold = await tx.user.findUnique({ where: { id: foldId }, include: { fitProfile: true } });
    if (!fold || fold.claimed) return;
    const keep = await tx.user.findUnique({ where: { id: keepId }, include: { fitProfile: true } });
    if (!keep) return;
    const from = { where: { userId: foldId }, data: { userId: keepId } };

    // Closet folders: one of the same name becomes the staying account's.
    const keepFolders = await tx.collection.findMany({ where: { userId: keepId }, select: { id: true, name: true } });
    const byName = new Map(keepFolders.map((c) => [c.name.trim().toLowerCase(), c.id]));
    for (const c of await tx.collection.findMany({ where: { userId: foldId }, select: { id: true, name: true } })) {
      const same = byName.get(c.name.trim().toLowerCase());
      if (!same) continue;
      await tx.knownGoodItem.updateMany({ where: { collectionId: c.id }, data: { collectionId: same } });
      await tx.collection.delete({ where: { id: c.id } });
    }
    await tx.collection.updateMany(from);
    await tx.knownGoodItem.updateMany(from);
    await tx.product.updateMany(from);
    await tx.fitRecommendation.updateMany(from);
    await tx.fitOutcome.updateMany(from);
    await tx.outfit.updateMany(from);
    await tx.petProfile.updateMany(from);
    await tx.comfortCheck.updateMany(from);
    // A product saved in both stays saved once.
    const saved = await tx.savedItem.findMany({ where: { userId: keepId }, select: { urlKey: true } });
    await tx.savedItem.updateMany({ where: { userId: foldId, urlKey: { notIn: saved.map((s) => s.urlKey) } }, data: { userId: keepId } });

    // The profile fills the staying one's gaps, and overwrites nothing.
    if (fold.fitProfile && !keep.fitProfile) {
      await tx.fitProfile.update({ where: { id: fold.fitProfile.id }, data: { userId: keepId } });
    } else if (fold.fitProfile && keep.fitProfile) {
      const gaps: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(fold.fitProfile)) {
        if (PROFILE_SKIP.has(k) || v == null) continue;
        if ((keep.fitProfile as Record<string, unknown>)[k] == null) gaps[k] = v;
      }
      if (Object.keys(gaps).length) await tx.fitProfile.update({ where: { id: keep.fitProfile.id }, data: gaps });
    }
    if (keep.bodyType == null && fold.bodyType != null) {
      await tx.user.update({ where: { id: keepId }, data: { bodyType: fold.bodyType } });
    }
    await tx.user.update({ where: { id: foldId }, data: { mergedIntoId: keepId } });
  });
}
