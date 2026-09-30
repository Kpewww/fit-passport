// The demo links offered on /check ("Try:"), in one place (Session 80).
//
// Three of them are answered from a curated fixture in extractor.ts, which stands
// in for a page. A fixture used to match by URL substring — so any Uniqlo t-shirt
// link got the AIRism sample, and a J.Crew "oxford-shirt" link came back as "COS
// Oxford Cotton Shirt" (measured, Session 80). A sample must never answer for a
// real product, so a fixture now answers exactly these links and nothing else,
// and every screen that shows its numbers says they are a demo.
//
// Zara has no fixture on purpose: it demonstrates a refusal (the store blocks us).
//
// A leaf module: /check imports it, and it must not pull the extractor into the
// client bundle (the same reason as confidenceWeights.ts, invariant ㉟).

export const DEMO_PRODUCTS = [
  { label: "Uniqlo AIRism T-Shirt", url: "https://www.uniqlo.com/us/en/products/airism-cotton-t-shirt" },
  { label: "COS Oxford Shirt", url: "https://www.cos.com/en_usd/oxford-shirt" },
  { label: "Levi's Trucker Jacket", url: "https://www.levi.com/US/en_US/clothing/men/outerwear/vintage-fit-trucker-jacket" },
  { label: "Zara Knit Sweater", url: "https://www.zara.com/us/en/wool-blend-knit-sweater-p12345.html" },
] as const;

/** A URL reduced to what identifies a page: host without www, path without a trailing slash. */
function pageKey(url: string): string | null {
  try {
    const u = new URL(url);
    return `${u.hostname.replace(/^www\./i, "").toLowerCase()}${u.pathname.replace(/\/+$/, "")}`;
  } catch {
    return null;
  }
}

/** True only for one of the demo links above (query and fragment ignored). */
export function isDemoUrl(url: string, demo: string): boolean {
  const k = pageKey(url);
  return k != null && k === pageKey(demo);
}
