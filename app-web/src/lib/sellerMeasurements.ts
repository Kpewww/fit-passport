// Measurements a seller wrote on a one-off listing (eBay and similar) — Session 80.
//
// A second-hand listing has no size chart. What it often has is a seller's tape
// measure, written into the title ("24\" Pit To Pit 30\" Long"), the item specifics
// ("Chest Size: 25\" Pit to Pit") or the description. Measured on five real eBay
// shirts (2026-09-30): four carried pit-to-pit in the title, one in the specifics,
// one had a length in the description, and the page also listed OTHER sellers'
// items with their own pit-to-pit — which is why this reads only the listing's own
// title, its specifics, and its description frame, never the page's free text.
//
// The one conversion that matters: pit to pit is the garment laid FLAT, armpit to
// armpit — half its circumference. Doubled, it is the garment's chest all the way
// round. It is never the wearer's chest and is never compared with one directly
// (invariant ㊿: a body range and a garment measurement never share a field).
//
// What is not certain is not used:
//   - a bare "Chest 22" could be flat or all the way round, garment or body — it is
//     returned as ambiguous for the user to confirm, never guessed;
//   - two numbers after one label ("Pit to Pit 29x20") — which is which? skipped;
//   - two readings of the same measurement that disagree — both shown, neither used;
//   - a number with no unit is read by the range it falls in, and marked inferred;
//     a number plausible in neither unit is dropped.

export type MeasureField = "chest" | "waist" | "shoulder" | "length" | "sleeve" | "inseam";
export type SellerSource = "title" | "specs" | "description" | "you";

export type SellerMeasurement = {
  field: MeasureField;
  /** The garment's measurement in cm; for chest and waist, all the way round. */
  cm: number;
  /** The number as written, and its unit. */
  value: number;
  unit: "in" | "cm";
  /** True when the listing gave no unit and it was read from the number's range. */
  unitInferred: boolean;
  /** True when the listing gave a laid-flat width, doubled into `cm`. */
  flat: boolean;
  source: SellerSource;
  /** The words it was read from, for the reader to check. */
  raw: string;
};

export type AmbiguousMeasurement = {
  field: MeasureField;
  raw: string;
  source: SellerSource;
  reason: "flat-or-around" | "two-numbers" | "conflict";
};

export type SellerReading = {
  measurements: SellerMeasurement[];
  ambiguous: AmbiguousMeasurement[];
  /** The size printed on the listing ("L", "2XL"), when it says one. */
  sizeLabel: string | null;
};

export const INCH_CM = 2.54;

// Plausible garment measurements per field, in each unit — a reading outside both
// is not a measurement of an adult garment. Flat and round are separate ranges.
const RANGE: Record<string, { in: [number, number]; cm: [number, number] }> = {
  chestFlat: { in: [14, 35], cm: [36, 89] },
  chestRound: { in: [28, 70], cm: [71, 178] },
  waistFlat: { in: [11, 30], cm: [28, 76] },
  waistRound: { in: [22, 60], cm: [56, 152] },
  length: { in: [15, 45], cm: [38, 115] },
  shoulder: { in: [12, 28], cm: [30, 71] },
  sleeve: { in: [6, 40], cm: [15, 102] },
  inseam: { in: [20, 40], cm: [50, 102] },
};

const NUM = String.raw`(\d{1,3}(?:[.,]\d{1,2})?(?:\s*(?:½|1\/2|¼|1\/4|¾|3\/4))?)`;
const UNIT = String.raw`(?:\s*(inch(?:es)?|in\b|"|cm\b|厘米|公分))?`;
const UNIT_REQUIRED = String.raw`\s*(inch(?:es)?|in\b|"|cm\b|厘米|公分)`;
const SEP = String.raw`\s*(?:[:=：\-–]|is|of)?\s*(?:approx(?:imately|\.)?|about|around|~|≈)?\s*`;

// Label vocabularies. Order matters where they overlap: "shoulder to hem" is a
// length, "chest pocket" is not a chest, "Long Sleeve" carries no number.
const LABELS: Array<{ key: string; field: MeasureField; flat: boolean | null; re: string }> = [
  { key: "chestFlat", field: "chest", flat: true, re: String.raw`(?:pit\s*(?:to|2|-)\s*pit|armpit\s*(?:to|-)\s*armpit|p\s*2\s*p|ptp|across\s+(?:the\s+)?chest|chest\s*\(?\s*(?:flat|laid\s+flat|across)\s*\)?|腋下(?:平铺)?(?:宽度?)?|胸宽|平铺胸围)` },
  { key: "waistFlat", field: "waist", flat: true, re: String.raw`(?:waist\s*\(?\s*(?:flat|laid\s+flat|across)\s*\)?|腰宽|平铺腰围)` },
  { key: "length", field: "length", flat: null, re: String.raw`(?:(?:back\s+|body\s+|total\s+)?length|collar\s+to\s+hem|shoulder\s+to\s+hem|top\s+to\s+bottom|衣长|后中长)` },
  { key: "inseam", field: "inseam", flat: null, re: String.raw`(?:inseam|内长|内侧裤长)` },
  { key: "shoulder", field: "shoulder", flat: null, re: String.raw`(?:shoulders?(?:\s+to\s+shoulder)?(?:\s+width)?|肩宽)` },
  { key: "sleeve", field: "sleeve", flat: null, re: String.raw`(?:sleeves?(?:\s+length)?|袖长)` },
  { key: "chestAmbig", field: "chest", flat: null, re: String.raw`(?:chest|bust|胸围)(?!\s*(?:size|pocket))` },
  { key: "waistAmbig", field: "waist", flat: null, re: String.raw`(?:waist|腰围)(?!\s*size)` },
];

function parseNum(s: string): number | null {
  const m = s.replace(",", ".").match(/^(\d{1,3}(?:\.\d{1,2})?)\s*(½|1\/2|¼|1\/4|¾|3\/4)?$/);
  if (!m) return null;
  const frac = { "½": 0.5, "1/2": 0.5, "¼": 0.25, "1/4": 0.25, "¾": 0.75, "3/4": 0.75 }[m[2] ?? ""] ?? 0;
  return Number(m[1]) + frac;
}

function unitOf(tok: string | undefined): "in" | "cm" | null {
  if (!tok) return null;
  return /cm|厘米|公分/i.test(tok) ? "cm" : "in";
}

/** Decide the unit (explicit, else by range) and whether the number is plausible at all. */
function resolveUnit(value: number, explicit: "in" | "cm" | null, range: { in: [number, number]; cm: [number, number] }) {
  const within = (u: "in" | "cm") => value >= range[u][0] && value <= range[u][1];
  if (explicit) return within(explicit) ? { unit: explicit, inferred: false } : null;
  const inOk = within("in");
  const cmOk = within("cm");
  if (inOk && !cmOk) return { unit: "in" as const, inferred: true };
  if (cmOk && !inOk) return { unit: "cm" as const, inferred: true };
  return null; // plausible in both or neither — not something to guess
}

function normalise(text: string): string {
  return text
    .replace(/[“”″]|''|’’/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

type Found = { m?: SellerMeasurement; a?: AmbiguousMeasurement };

/** Every measurement written in one piece of text. */
export function measurementsInText(text: string, source: SellerSource): Found[] {
  const t = normalise(text);
  const out: Found[] = [];
  const taken: Array<[number, number]> = [];
  const free = (a: number, b: number) => taken.every(([x, y]) => b <= x || a >= y);
  // Two passes. First "number + unit + label" ("24\" Pit To Pit 30\" Long"): a seller
  // who puts the number first writes its unit, and without this order the label
  // before the second number would take it ("Pit To Pit 30\"" — measured on a real
  // title). Then "label + number", with or without a unit ("Pit to Pit: 22").
  const passes: Array<(L: (typeof LABELS)[number]) => RegExp> = [
    (L) => new RegExp(String.raw`${NUM}${UNIT_REQUIRED}\s*(?:-\s*)?(${L.key === "length" ? String.raw`long\b(?!\s*-?\s*sleeve)|length` : L.re})`, "gi"),
    (L) => new RegExp(String.raw`(${L.re})${SEP}${NUM}${UNIT}(\s*[x×]\s*\d{1,3})?`, "gi"),
  ];
  passes.forEach((make, pi) => {
    for (const L of LABELS) {
      for (const hit of t.matchAll(make(L))) {
        const start = hit.index ?? 0;
        const end = start + hit[0].length;
        if (!free(start, end)) continue;
        const numStr = pi === 0 ? hit[1] : hit[2];
        const unitTok = pi === 0 ? hit[2] : hit[3];
        const raw = hit[0].trim();
        if (pi === 1 && hit[4]) {
          taken.push([start, end]);
          out.push({ a: { field: L.field, raw, source, reason: "two-numbers" } });
          continue;
        }
        const value = parseNum(numStr);
        if (value == null) continue;
        taken.push([start, end]);
        if (L.flat === null && (L.field === "chest" || L.field === "waist")) {
          // "Chest 22" / "Waist 16": flat or all the way round, garment or body —
          // the listing does not say, so the reader decides.
          out.push({ a: { field: L.field, raw, source, reason: "flat-or-around" } });
          continue;
        }
        const range = RANGE[L.key] ?? RANGE[L.field];
        const u = resolveUnit(value, unitOf(unitTok), range);
        if (!u) continue;
        const cmOnce = u.unit === "in" ? value * INCH_CM : value;
        const cm = Math.round((L.flat ? cmOnce * 2 : cmOnce) * 10) / 10;
        out.push({ m: { field: L.field, cm, value, unit: u.unit, unitInferred: u.inferred, flat: L.flat === true, source, raw } });
      }
    }
  });
  return out;
}

const WORD_SIZE: Record<string, string> = {
  "xx-small": "XXS", "x-small": "XS", small: "S", sm: "S", medium: "M", med: "M", large: "L", lg: "L", lrg: "L",
  "x-large": "XL", xlarge: "XL", "xx-large": "XXL", xxlarge: "XXL", "xxx-large": "XXXL",
};
const ALPHA = String.raw`XXXL|XXL|XL|XXS|XS|S|M|L|[2-5]XL|[2-5]X|x{1,3}-?large|x{1,2}-?small|small|medium|large|lrg|lg|med|sm`;

/** A size label as the listing prints it, normalised to the letters the engine reads. */
export function normaliseSizeLabel(raw: string): string | null {
  const s = raw.trim().replace(/\s*\((?:men'?s|women'?s|unisex)\)\s*/i, "").trim();
  if (!s || s.length > 12) return null;
  const w = WORD_SIZE[s.toLowerCase()];
  if (w) return w;
  const m = s.match(/^([2-5])\s*X(?:L)?$/i);
  if (m) return `${m[1]}XL`;
  if (/^(XXXL|XXL|XL|XXS|XS|S|M|L)$/i.test(s)) return s.toUpperCase();
  if (/^\d{2}(?:\s?[RSL])?$/i.test(s)) return s.toUpperCase().replace(/\s/g, "");
  return null;
}

/** The size in a title: "Size Large", "Mens XXL", "Men's L". */
export function sizeInTitle(title: string): string | null {
  const t = normalise(title);
  const m =
    t.match(new RegExp(String.raw`\bsize\s*[:\-]?\s*(${ALPHA})\b`, "i")) ??
    t.match(new RegExp(String.raw`\b(?:men'?s|mens|women'?s|womens|unisex)\s+(${ALPHA})\b`, "i"));
  return m ? normaliseSizeLabel(m[1]) : null;
}

const SIZE_SPEC = /^size(?:\s*\((?:men'?s|women'?s|unisex)\))?$/i;

/**
 * Everything a listing says about its measurements and size.
 * `specs` are the item-specifics pairs; `lines` are description lines.
 */
export function readSeller(input: { title?: string | null; specs?: Array<[string, string]>; lines?: string[] }): SellerReading {
  const found: Found[] = [];
  let sizeLabel: string | null = null;
  for (const [label, value] of input.specs ?? []) {
    const l = label.trim().replace(/:$/, "");
    if (SIZE_SPEC.test(l)) {
      sizeLabel ??= normaliseSizeLabel(value);
      continue;
    }
    // "Chest Size: 42" names a size; "Chest Size: 25\" Pit to Pit" holds a measurement.
    if (/^chest\s+size$/i.test(l) && !/pit|p2p|ptp|across|flat/i.test(value)) continue;
    found.push(...measurementsInText(`${l}: ${value}`, "specs"));
  }
  if (input.title) {
    found.push(...measurementsInText(input.title, "title"));
    sizeLabel ??= sizeInTitle(input.title);
  }
  for (const line of input.lines ?? []) found.push(...measurementsInText(line, "description"));
  return reconcile(found, sizeLabel);
}

const PRIORITY: Record<SellerSource, number> = { you: 0, specs: 1, title: 2, description: 3 };
/** Readings of one measurement closer than this are the same measurement. */
const SAME_CM = 2.6;

function reconcile(found: Found[], sizeLabel: string | null): SellerReading {
  const byField = new Map<MeasureField, SellerMeasurement[]>();
  const ambiguous: AmbiguousMeasurement[] = [];
  for (const f of found) {
    if (f.a) ambiguous.push(f.a);
    if (f.m) byField.set(f.m.field, [...(byField.get(f.m.field) ?? []), f.m]);
  }
  const measurements: SellerMeasurement[] = [];
  for (const [field, list] of byField) {
    const sorted = [...list].sort((a, b) => PRIORITY[a.source] - PRIORITY[b.source]);
    const disagree = sorted.some((m) => Math.abs(m.cm - sorted[0].cm) > SAME_CM);
    if (disagree) {
      for (const m of sorted) ambiguous.push({ field, raw: m.raw, source: m.source, reason: "conflict" });
      continue;
    }
    measurements.push(sorted[0]);
  }
  // A measurement already read cleanly is not also "ambiguous" from a vaguer line.
  const clean = new Set(measurements.map((m) => m.field));
  return {
    measurements,
    ambiguous: ambiguous.filter((a) => a.reason === "conflict" || !clean.has(a.field)),
    sizeLabel,
  };
}

/** Measurements the user typed from the listing (the manual form). Always win. */
export type TypedMeasurement = { field: MeasureField; value: number; unit: "in" | "cm"; flat: boolean };

export function typedMeasurements(typed: TypedMeasurement[]): SellerMeasurement[] {
  const out: SellerMeasurement[] = [];
  for (const t of typed) {
    const key = t.field === "chest" ? (t.flat ? "chestFlat" : "chestRound") : t.field === "waist" ? (t.flat ? "waistFlat" : "waistRound") : t.field;
    const range = RANGE[key];
    if (!range || t.value < range[t.unit][0] || t.value > range[t.unit][1]) continue;
    const once = t.unit === "in" ? t.value * INCH_CM : t.value;
    const cm = Math.round((t.flat ? once * 2 : once) * 10) / 10;
    out.push({ field: t.field, cm, value: t.value, unit: t.unit, unitInferred: false, flat: t.flat, source: "you", raw: "" });
  }
  return out;
}

/** Merge typed measurements over read ones: what the user typed replaces the same field. */
export function withTyped(reading: SellerReading, typed: SellerMeasurement[]): SellerReading {
  const fields = new Set(typed.map((m) => m.field));
  return {
    measurements: [...typed, ...reading.measurements.filter((m) => !fields.has(m.field))],
    ambiguous: reading.ambiguous.filter((a) => !fields.has(a.field)),
    sizeLabel: reading.sizeLabel,
  };
}

// Marketplaces where a listing is one garment from one seller. eBay is the one
// measured (Session 80); the others are listed because they share the shape —
// one item, one size, a seller's tape measure — and are untested.
const RESALE_HOST = /(?:^|\.)(?:ebay\.[a-z.]+|poshmark\.[a-z.]+|depop\.com|grailed\.com|vinted\.[a-z.]+|mercari\.com|thredup\.com)$/i;
export function isResaleHost(host: string | null | undefined): boolean {
  return !!host && RESALE_HOST.test(host);
}
