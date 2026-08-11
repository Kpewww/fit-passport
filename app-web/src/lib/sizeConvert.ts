// Size converter — enter a size in ANY common scale and see the equivalents.
//
// Founder's ask: "I wear a 43 shoe — let me pick that scale and see what it is
// in EU / US / cm." And: explain what the pants numbers mean.
//
// Scope is honest: cross-scale sizing is approximate (brands vary), so we round
// to the nearest common rung and label everything "≈". The tables here are the
// widely-published men's conversions; women's/kids' can be added later as extra
// scale sets keyed by the same domain.
//
// Design: each size DOMAIN (from sizeSystems) has a set of SCALES. A scale knows
// how to parse a raw string into a canonical numeric "rung", and how to render a
// rung back into a label. Conversion = parse in the chosen scale → canonical
// rung → render in every scale.

import type { SizeDomain } from "./sizeSystems";

export type Scale = {
  id: string; // "EU" | "US" | "UK" | "CM" | "ALPHA" | "WAIST_IN" | "WAIST_CM"
  label: string; // shown to the user, e.g. "EU"
  // Parse a raw user string into a canonical rung number for this domain.
  // Returns null if the string isn't in this scale.
  parse: (raw: string) => number | null;
  // Render a canonical rung as a label in this scale.
  render: (rung: number) => string;
};

// ---------------- SHOES ----------------
// Canonical rung = EU size (the most granular common scale for shoes).
// Men's approximations: US = EU − 33 (roughly), UK = US − 1, cm = EU-based last.
// These are standard published men's conversions, good to ±1 rung.
const SHOE_EU_TO_CM: Record<number, number> = {
  39: 24.5, 40: 25, 41: 25.5, 42: 26.5, 43: 27, 44: 28, 45: 28.5, 46: 29.5, 47: 30,
};

const shoeScales: Scale[] = [
  {
    id: "EU",
    label: "EU",
    parse: (raw) => {
      const m = raw.trim().match(/^(?:EU\s*)?(\d{2}(?:\.5)?)$/i);
      return m ? Number(m[1]) : null;
    },
    render: (eu) => `EU ${trimNum(eu)}`,
  },
  {
    id: "US",
    label: "US (men's)",
    parse: (raw) => {
      const m = raw.trim().match(/^US\s*(\d{1,2}(?:\.5)?)$/i);
      return m ? usMenToEu(Number(m[1])) : null;
    },
    render: (eu) => `US ${trimNum(euToUsMen(eu))}`,
  },
  {
    id: "UK",
    label: "UK",
    parse: (raw) => {
      const m = raw.trim().match(/^UK\s*(\d{1,2}(?:\.5)?)$/i);
      return m ? usMenToEu(Number(m[1]) + 1) : null; // UK = US − 1 (men's)
    },
    render: (eu) => `UK ${trimNum(euToUsMen(eu) - 1)}`,
  },
  {
    id: "CM",
    label: "cm (foot)",
    parse: (raw) => {
      const m = raw.trim().match(/^(\d{2}(?:\.5)?)\s*cm$/i);
      if (!m) return null;
      const cm = Number(m[1]);
      // nearest EU rung by the cm table
      let bestEu = 42;
      let bestD = Infinity;
      for (const [eu, c] of Object.entries(SHOE_EU_TO_CM)) {
        const d = Math.abs(c - cm);
        if (d < bestD) { bestD = d; bestEu = Number(eu); }
      }
      return bestEu;
    },
    render: (eu) => {
      const cm = SHOE_EU_TO_CM[Math.round(eu)] ?? Math.round((eu - 33 + 24) * 10) / 10;
      return `${trimNum(cm)} cm`;
    },
  },
];

// Men's US ↔ EU (published): EU ≈ US + 33 for whole sizes around the mid-range.
function usMenToEu(us: number): number { return us + 33; }
function euToUsMen(eu: number): number { return eu - 33; }

// ---------------- TOPS ----------------
// Canonical rung = alpha ladder index (XXS=0 … XXXL=7). EU numeric maps in.
const ALPHA = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL"];
const EU_TOP_TO_ALPHA_IDX: Record<number, number> = {
  42: 1, 44: 2, 46: 2, 48: 3, 50: 3, 52: 4, 54: 4, 56: 5, 58: 5, 60: 6,
};
const ALPHA_IDX_TO_EU: Record<number, number> = {
  0: 42, 1: 44, 2: 46, 3: 48, 4: 52, 5: 56, 6: 60, 7: 62,
};

const topScales: Scale[] = [
  {
    id: "ALPHA",
    label: "Alpha",
    parse: (raw) => {
      const s = raw.trim().toUpperCase();
      const i = ALPHA.indexOf(s);
      if (i >= 0) return i;
      // "M/L" → take first
      const first = s.split("/")[0];
      const j = ALPHA.indexOf(first);
      return j >= 0 ? j : null;
    },
    render: (idx) => ALPHA[clampIdx(idx)],
  },
  {
    id: "EU",
    label: "EU",
    parse: (raw) => {
      const m = raw.trim().match(/^(?:EU\s*)?(\d{2})$/i);
      if (!m) return null;
      return EU_TOP_TO_ALPHA_IDX[Number(m[1])] ?? null;
    },
    render: (idx) => `EU ${ALPHA_IDX_TO_EU[clampIdx(idx)]}`,
  },
];

// ---------------- BOTTOMS ----------------
// Canonical rung = waist in inches. Alpha & cm map in.
const WAIST_ALPHA: Array<{ in: number; alpha: string }> = [
  { in: 28, alpha: "XS" }, { in: 30, alpha: "S" }, { in: 32, alpha: "M" },
  { in: 34, alpha: "L" }, { in: 36, alpha: "XL" }, { in: 38, alpha: "XXL" },
];

const bottomScales: Scale[] = [
  {
    id: "WAIST_IN",
    label: "Waist (in)",
    parse: (raw) => {
      // "32", "32x34", "W32 L34" → take the waist
      const s = raw.trim();
      const wl = s.match(/^(\d{2})\s*[x×]\s*\d{2}$/i) || s.match(/^W\s*(\d{2})\s*L\s*\d{2}$/i);
      if (wl) return Number(wl[1]);
      const bare = s.match(/^(\d{2})$/);
      return bare ? Number(bare[1]) : null;
    },
    render: (inch) => `${Math.round(inch)}"`,
  },
  {
    id: "WAIST_CM",
    label: "Waist (cm)",
    parse: (raw) => {
      const m = raw.trim().match(/^(\d{2,3})\s*cm$/i);
      return m ? Math.round(Number(m[1]) / 2.54) : null;
    },
    render: (inch) => `${Math.round(inch * 2.54)} cm`,
  },
  {
    id: "ALPHA",
    label: "Alpha",
    parse: (raw) => {
      const s = raw.trim().toUpperCase();
      const found = WAIST_ALPHA.find((w) => w.alpha === s);
      return found ? found.in : null;
    },
    render: (inch) => {
      // nearest alpha rung
      let best = WAIST_ALPHA[0];
      let bestD = Infinity;
      for (const w of WAIST_ALPHA) {
        const d = Math.abs(w.in - inch);
        if (d < bestD) { bestD = d; best = w; }
      }
      return best.alpha;
    },
  },
];

const DOMAIN_SCALES: Partial<Record<SizeDomain, Scale[]>> = {
  shoe: shoeScales,
  top: topScales,
  bottom: bottomScales,
};

export function scalesForDomain(domain: SizeDomain): Scale[] {
  return DOMAIN_SCALES[domain] ?? [];
}

export type Conversion = { scaleId: string; scaleLabel: string; value: string };

/**
 * Given a raw size string and the scale it's expressed in, return the size
 * rendered in every scale for that domain. Returns [] if the domain has no
 * conversion table (socks/accessories) or the value can't be parsed.
 */
export function convert(domain: SizeDomain, raw: string, fromScaleId: string): Conversion[] {
  const scales = scalesForDomain(domain);
  const from = scales.find((s) => s.id === fromScaleId);
  if (!from) return [];
  const rung = from.parse(raw);
  if (rung == null) return [];
  return scales.map((s) => ({
    scaleId: s.id,
    scaleLabel: s.label,
    value: s.render(rung),
  }));
}

/** Best-guess which scale a raw string is in (for auto-detecting free text). */
export function detectScale(domain: SizeDomain, raw: string): string | null {
  for (const s of scalesForDomain(domain)) {
    if (s.parse(raw) != null) return s.id;
  }
  return null;
}

// ---- helpers ----
function trimNum(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}
function clampIdx(i: number): number {
  return Math.max(0, Math.min(ALPHA.length - 1, Math.round(i)));
}
