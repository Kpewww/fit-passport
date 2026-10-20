// Units a wearer types in, and the ranges a body can measure (Session 100).
//
// The live walk found a US shopper typing their chest, 40, into a centimetre-only
// onboarding field and being told "Something went wrong." Measurements are stored in
// centimetres and kilograms; this is how they are typed and checked:
//   - the display unit: cm/in and kg/lb, inches and pounds by default for the US,
//     remembered in this browser once chosen;
//   - one set of ranges, the same the API enforces (`/api/profile`);
//   - a value that is out of range in centimetres but makes sense in inches is
//     probably inches — say so, rather than refuse.

export type LengthUnit = "cm" | "in";
export type WeightUnit = "kg" | "lb";
export type Units = { length: LengthUnit; weight: WeightUnit };

const KEY = "fp-units";
const IN = 2.54;
const LB = 2.2046;

/** What this browser chose, else what the wearer's region uses. */
export function preferredUnits(region?: string | null): Units {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "null");
    if (v && (v.length === "cm" || v.length === "in") && (v.weight === "kg" || v.weight === "lb")) return v;
  } catch { /* storage blocked: the region's default */ }
  return region === "US" ? { length: "in", weight: "lb" } : { length: "cm", weight: "kg" };
}

export function saveUnits(u: Units): void {
  try { localStorage.setItem(KEY, JSON.stringify(u)); } catch { /* not kept; still used */ }
}

const r1 = (n: number) => Math.round(n * 10) / 10;
export const cmFrom = (v: number, unit: LengthUnit) => r1(unit === "in" ? v * IN : v);
export const cmTo = (cm: number, unit: LengthUnit) => r1(unit === "in" ? cm / IN : cm);
export const kgFrom = (v: number, unit: WeightUnit) => r1(unit === "lb" ? v / LB : v);
export const kgTo = (kg: number, unit: WeightUnit) => r1(unit === "lb" ? kg * LB : kg);

/** The ranges `/api/profile` accepts, in cm and kg. One home for both. */
export const PROFILE_RANGES = {
  heightCm: [80, 260],
  weightKg: [20, 300],
  chestCm: [50, 200],
  waistCm: [40, 200],
  hipCm: [40, 200],
  shoulderCm: [20, 80],
  sleeveCm: [20, 100],
  inseamCm: [40, 120],
} as const;
export type RangedField = keyof typeof PROFILE_RANGES;

export type RangeIssue = { field: RangedField; value: number; min: number; max: number; looksLikeInches: boolean; looksLikePounds: boolean };

/** Every stored value outside its range, and whether the number fits as inches or pounds. */
export function rangeIssues(p: Partial<Record<RangedField, number | null | undefined>>): RangeIssue[] {
  const out: RangeIssue[] = [];
  for (const field of Object.keys(PROFILE_RANGES) as RangedField[]) {
    const v = p[field];
    if (v == null) continue;
    const [min, max] = PROFILE_RANGES[field];
    if (v >= min && v <= max) continue;
    const inCm = v * IN;
    const inKg = v / LB;
    out.push({
      field, value: v, min, max,
      looksLikeInches: field !== "weightKg" && inCm >= min && inCm <= max,
      looksLikePounds: field === "weightKg" && inKg >= min && inKg <= max,
    });
  }
  return out;
}
