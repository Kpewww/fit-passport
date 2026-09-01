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
 * Whether the engine has a body measurement to compare against a size chart.
 * Narrower than `hasStatedProfile` on purpose — it drives the accuracy tier and
 * the "add your measurements" nudge, which are claims about the engine, not
 * about whether the user filled a form in.
 *
 * KNOWN GAP, preserved deliberately: this is chest/height/waist, but
 * `scoreMeasurementFit` scores chest/waist/**shoulder** and never reads height.
 * So a user who entered only a shoulder is told they have no measurements while
 * the engine happily uses it, and one who entered only a height is told the
 * opposite. Left as-is because changing it moves the displayed accuracy tier for
 * existing users, which is a product decision and not part of the fix this file
 * was written for. It should be decided, not drifted into.
 */
export function hasBodyMeasurement(p: ProfileCompletenessInput | null | undefined): boolean {
  if (!p) return false;
  return p.chestCm != null || p.heightCm != null || p.waistCm != null;
}
