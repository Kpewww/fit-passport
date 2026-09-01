// Has the user actually told us anything about themselves?
//
// This is trickier than it looks, and got it wrong once. A FitProfile row is
// created alongside the User on the very first request — lib/session.ts seeds
// `preferredFit: "regular"` and `region: "US"` so the engine always has
// something to read. That means "does a profile row exist" is true before the
// visitor has touched a single control, and the guided checklist's "Set your
// fit preference" step read as DONE on a brand-new visit. Clearing cookies did
// not help: a fresh session minted a fresh, already-seeded, already-"done" row.
//
// So the question has to be "did the user state this", not "is there a row".
// Two signals answer it, and both are needed:
//
//   1. The row has been WRITTEN since it was created. Prisma sets @updatedAt
//      equal to @default(now()) on create — measured, exactly equal, delta 0 —
//      so any later save moves them apart. This is the only signal that catches
//      a user whose honest answer is the same as the seeded default ("regular",
//      "US") and who set nothing else.
//   2. A field we never seed has a value. Every one below is nullable with no
//      default, so a value in it can only have come from the user. This catches
//      rows written in a single create (the demo seeder does this), where the
//      timestamps match despite the values being real.

/** The subset of FitProfile this module reads. */
export type ProfileCompletenessInput = {
  createdAt: Date;
  updatedAt: Date;
  sex: string | null;
  shopsFor: string | null;
  notes: string | null;
  avatarDataUrl: string | null;
  heightCm: number | null;
  weightKg: number | null;
  chestCm: number | null;
  waistCm: number | null;
  hipCm: number | null;
  shoulderCm: number | null;
  sleeveCm: number | null;
  inseamCm: number | null;
};

/** Fields that are nullable with no default — a value can only be the user's. */
const USER_ONLY_FIELDS = [
  "sex", "shopsFor", "notes", "avatarDataUrl",
  "heightCm", "weightKg", "chestCm", "waistCm",
  "hipCm", "shoulderCm", "sleeveCm", "inseamCm",
] as const;

/** Was the row written after it was created? See note 1 above. */
export function profileWasEdited(p: ProfileCompletenessInput): boolean {
  return p.updatedAt.getTime() > p.createdAt.getTime();
}

/**
 * Whether the user has stated anything at all about their fit — the honest
 * answer to "Set your fit preference".
 *
 * Deliberately NOT `!!profile`: the row is seeded for everyone. Also
 * deliberately not a check on `preferredFit`/`region`, because their seeded
 * values are indistinguishable from a user who genuinely wants them.
 */
export function hasStatedProfile(p: ProfileCompletenessInput | null | undefined): boolean {
  if (!p) return false;
  if (profileWasEdited(p)) return true;
  return USER_ONLY_FIELDS.some((f) => p[f] != null);
}

/**
 * The three dimensions `scoreMeasurementFit` actually reads off the profile.
 * Everything else the profile holds — height, weight, hip, sleeve, inseam — is
 * stored, shown, and in height/weight's case feeds `deriveBodyType`, but none of
 * it reaches the sizing engine. `recommendService.ts` does not even pass them.
 */
export const ENGINE_SCORED_DIMENSIONS = ["chestCm", "waistCm", "shoulderCm"] as const;

/**
 * Whether the engine has any of its scored dimensions from the user.
 *
 * Drives the accuracy tier and the first-run nudges, which are claims about how
 * well we can size this person — so it asks about sizing inputs, not about
 * whether a form looks filled in.
 *
 * This was chest/height/waist until Session 64, which was wrong in both
 * directions: it counted height, which `scoreMeasurementFit` never reads, and
 * missed shoulder, which carries weight 0.18 in the score. A shoulder-only user
 * was told we had nothing while the engine was using their shoulder; a
 * height-only user was told the opposite. Height still matters to the passport's
 * body type — it just has nothing to do with picking a size.
 */
export function hasBodyMeasurement(p: ProfileCompletenessInput | null | undefined): boolean {
  if (!p) return false;
  return ENGINE_SCORED_DIMENSIONS.some((d) => p[d] != null);
}

/**
 * Whether the user has given us the one dimension that moves the confidence
 * NUMBER, as opposed to the score.
 *
 * `computeConfidence` adds `CONFIDENCE_WEIGHTS.measurements` for
 * `hasChest && size.chestCm != null` and for nothing else — waist and shoulder
 * change which size wins, never how sure we say we are. So any UI promising
 * "+35 points for adding your measurements" has to gate on this, not on
 * `hasBodyMeasurement`, or it promises points to someone who already has them
 * and stays silent for someone who could still collect them.
 *
 * Note this asks for the user's OWN chest. `recommendService.ts` fills a
 * regional prior when it is missing, but that is flagged `chestIsEstimated` and
 * deliberately caps confidence — a prior is not evidence about this person.
 */
export function hasChestMeasurement(p: ProfileCompletenessInput | null | undefined): boolean {
  return p?.chestCm != null;
}
