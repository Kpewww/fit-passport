// Women's clothing sizes across countries — Session 88.
//
// Until now every numeric size was read on the MEN'S jacket ladder (sizing.ts
// EU_TO_ALPHA, sizeConvert.ts's top scales): a women's US XS showed as "EU 44",
// and a women's FR 34–40 label meant nothing to the engine.
//
// The canonical rung here is the US women's number (00, 0, 2, 4 …), the most
// granular common scale. Every other country is a fixed offset from it:
//
//   DE / EU = US + 30     FR = US + 32     IT = US + 36     UK = US + 4
//
// Sources (checked 2026-10-06), which agree row for row: blitzresults.com
// "Women's clothing sizes" (US 2 = XS = DE/EU 32 = FR 34 = IT 38 = UK 6; US 6 = S
// = 36 / 38 / 42 / 10; US 10 = M = 40 / 42 / 46 / 14) and sizechart.com's women's
// conversion (XS = US 0, UK 4, EU 32, FR 34 …). size.ly's single "Europe" column
// follows the FRENCH numbers (US 2 = 34) — which is exactly why "EU" is split
// into countries rather than trusted as one number. Letters span two US numbers
// (size.ly: XS = 0–2, S = 4–6, M = 8–10, L = 12–14, XL = 16–18, XXL = 20–22).
//
// Spain is left out: no source above lists it on its own, and a guess is not a
// conversion. Brand ladders (Maje/Sandro T0–T4) are not here either until read
// from the brands' own guides.

import type { AlphaSize } from "./sizing";

export type WomensCountry = "US" | "UK" | "EU" | "FR" | "IT";

/** Offset from the US women's number. EU means the German/EU numbering. */
export const WOMENS_OFFSET: Record<WomensCountry, number> = { US: 0, UK: 4, EU: 30, FR: 32, IT: 36 };

/** Lowest and highest US women's number covered (00 is −2). */
export const WOMENS_US_MIN = -2;
export const WOMENS_US_MAX = 22;

/** The letter a US women's number falls under (size.ly's bands). */
export function womensLetter(us: number): AlphaSize | null {
  if (us < WOMENS_US_MIN || us > WOMENS_US_MAX) return null;
  if (us < 0) return "XXS";
  if (us <= 2) return "XS";
  if (us <= 6) return "S";
  if (us <= 10) return "M";
  if (us <= 14) return "L";
  if (us <= 18) return "XL";
  return "XXL";
}

/**
 * The US women's numbers a letter covers, as the midpoint of its band (odd for a
 * two-number band: XS → 1, meaning 0–2). Renderers show an odd rung as a range.
 */
export const WOMENS_LETTER_RUNG: Partial<Record<AlphaSize, number>> = {
  XXS: -2, XS: 1, S: 5, M: 9, L: 13, XL: 17, XXL: 21,
};

/**
 * A women's size label as a US women's number, reading a country prefix when
 * there is one ("FR 38", "IT 42", "UK 10", "DE 36", "US 4", "EU 36") and taking a
 * bare number as EU/German. Null when the label is not a women's numeric size.
 *
 * "EU" and a bare number are read the German way (US + 30), as blitzresults labels
 * its EU column. size.ly's "Europe" and sizechart.com's "EU" columns are French-
 * style (US + 32), so a retailer's "EU 38" may mean either; the two readings land
 * on the same letter except at band edges (38: S by French, M by German). A label
 * with a country prefix is exact. This is a choice, not a fact — revisit with
 * real women's charts read off the brands' pages.
 */
export function womensUsNumber(raw: string): number | null {
  const s = raw.trim().toUpperCase();
  const m = s.match(/^(US|UK|EU|DE|FR|F|IT|I)?\s*(00|\d{1,2})$/);
  if (!m) return null;
  const n = m[2] === "00" ? -2 : Number(m[2]);
  const country = m[1] === "DE" ? "EU" : m[1] === "F" ? "FR" : m[1] === "I" ? "IT" : ((m[1] ?? "EU") as WomensCountry);
  const us = country === "US" ? n : n - WOMENS_OFFSET[country];
  // Women's numbers are even; an odd one is not on this ladder.
  if (us % 2 !== 0 || us < WOMENS_US_MIN || us > WOMENS_US_MAX) return null;
  return us;
}

/** A US women's rung rendered in a country's numbers; an odd rung is a range. */
export function renderWomens(us: number, country: WomensCountry): string {
  const at = (u: number) => (country === "US" && u === -2 ? "00" : String(u + WOMENS_OFFSET[country]));
  const n = Math.round(us);
  return n % 2 === 0 ? at(n) : `${at(n - 1)}–${at(n + 1)}`;
}

/** The one department a wearer shops (profile `shopsFor`), when they named exactly one. */
export function soleDepartment(shopsFor: string | null | undefined): "mens" | "womens" | null {
  const parts = (shopsFor ?? "").split(",").map((p) => p.trim()).filter(Boolean);
  return parts.length === 1 && (parts[0] === "mens" || parts[0] === "womens") ? parts[0] : null;
}
