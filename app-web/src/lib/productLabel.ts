/**
 * "Brand Product Name", without saying the brand twice.
 *
 * Product names come out of a page title far more often than out of a clean data
 * field, and a page title nearly always leads with the retailer. Printing brand
 * and name unconditionally gave the dashboard "M for **Uniqlo Uniqlo** AIRism
 * Cotton Crew Neck T-Shirt".
 *
 * Comparing case-insensitively on the leading token is enough: this is a display
 * label, not a matcher, and a name that mentions the brand somewhere in the
 * middle ("Collab tee made for Uniqlo") genuinely does want the prefix.
 *
 * It lives here rather than beside its caller because a Next App Router `page`
 * file may only export the framework's own symbols — exporting a helper from one
 * fails the build's generated type check.
 */
export function productLabel(
  brand: string | null | undefined,
  name: string | null | undefined,
): string {
  const b = (brand ?? "").trim();
  const n = (name ?? "").trim();
  if (!b) return n;
  if (!n) return b;
  return n.toLowerCase().startsWith(b.toLowerCase()) ? n : `${b} ${n}`;
}
