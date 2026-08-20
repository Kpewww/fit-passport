// Product-page extractor — URL-aware, fixture-backed.
//
// Per the proposal (§16 Risks — "Product-data availability"), automated scraping
// of retailer pages is unreliable and sometimes prohibited. The semester goal is
// FEASIBILITY, not internet-scale crawling. So this extractor works in layers:
//
//   1. CURATED FIXTURES for a few known demo products (exact, hand-verified).
//   2. URL-DERIVED extraction for everything else: we parse the real URL to
//      recover the retailer (from the domain), the product name (from the URL
//      slug), and the category (from keywords), and we synthesize a plausible
//      size chart that VARIES by brand + product. This makes it obvious the tool
//      is reading the URL the user pasted — different links produce different
//      brands, names, categories, and size charts.
//
// Everything the extractor returns is shown to the user for confirmation on the
// /check screen ("we read this — is it right?"), which is the mitigation the
// proposal calls for. Real LLM/VLM extraction can later replace layer 2 without
// changing this interface.

export type ExtractedSize = {
  label: string;
  region?: string;
  chestCm?: number;
  waistCm?: number;
  shoulderCm?: number;
  sleeveCm?: number;
  lengthCm?: number;
  bodyChestMinCm?: number;
  bodyChestMaxCm?: number;
};

export type Gender = "mens" | "womens" | "unisex";

export type ExtractedProduct = {
  retailer: string;
  brand: string;
  productName: string;
  category: string;
  gender?: Gender;
  material?: string;
  fitNotes?: string;
  modelInfo?: { heightCm?: number; wearsSize?: string };
  sizes: ExtractedSize[];
  // Provenance so the UI can prove it read THIS page.
  source: {
    url: string;
    host: string;
    derived: boolean; // true = layer-2 URL-derived, false = curated fixture
    slug?: string;
    // Where the SIZE CHART specifically came from — this is what the audit cared
    // about, and what /check surfaces so a user knows whether to trust the sizes:
    //   "fixture"   — hand-verified demo product
    //   "page"      — read off the real product page (JSON-LD/table or LLM)
    //   "estimated" — synthesized from the brand + category (no real chart found)
    sizesFrom?: "fixture" | "page" | "estimated";
  };
};

// ------------ Layer 1: curated fixtures (demo-safe) ------------

const FIXTURES: Array<{ match: RegExp; data: Omit<ExtractedProduct, "source"> }> = [
  {
    match: /uniqlo.*airism|uniqlo.*t-?shirt|airism-cotton/i,
    data: {
      retailer: "Uniqlo",
      brand: "Uniqlo",
      productName: "Uniqlo AIRism Cotton Crew Neck T-Shirt",
      category: "tshirt",
      material: "Cotton 60% / Polyester 40%",
      fitNotes: "Regular fit through the body and shoulders.",
      modelInfo: { heightCm: 183, wearsSize: "M" },
      sizes: [
        { label: "XS", chestCm: 92, shoulderCm: 41, sleeveCm: 19, lengthCm: 66 },
        { label: "S", chestCm: 96, shoulderCm: 43, sleeveCm: 20, lengthCm: 68 },
        { label: "M", chestCm: 100, shoulderCm: 44, sleeveCm: 21, lengthCm: 70 },
        { label: "L", chestCm: 104, shoulderCm: 46, sleeveCm: 22, lengthCm: 72 },
        { label: "XL", chestCm: 110, shoulderCm: 48, sleeveCm: 23, lengthCm: 74 },
      ],
    },
  },
  {
    match: /cos\.com.*shirt|cos.*oxford|oxford-shirt/i,
    data: {
      retailer: "COS",
      brand: "COS",
      productName: "COS Oxford Cotton Shirt",
      category: "shirt",
      material: "100% Cotton",
      fitNotes: "Regular fit. Slightly relaxed through the chest.",
      modelInfo: { heightCm: 187, wearsSize: "M" },
      sizes: [
        { label: "EU 44", region: "EU", chestCm: 102, shoulderCm: 44, sleeveCm: 63 },
        { label: "EU 46", region: "EU", chestCm: 106, shoulderCm: 45, sleeveCm: 64 },
        { label: "EU 48", region: "EU", chestCm: 110, shoulderCm: 46, sleeveCm: 65 },
        { label: "EU 50", region: "EU", chestCm: 114, shoulderCm: 47, sleeveCm: 66 },
        { label: "EU 52", region: "EU", chestCm: 118, shoulderCm: 48, sleeveCm: 67 },
      ],
    },
  },
  {
    match: /levi.*trucker|levi.*jacket|vintage-fit-trucker/i,
    data: {
      retailer: "Levi's",
      brand: "Levi's",
      productName: "Levi's Vintage Fit Trucker Jacket",
      category: "jacket",
      material: "100% Cotton denim, non-stretch",
      fitNotes: "Vintage fit — slightly boxier than a slim jacket.",
      modelInfo: { heightCm: 185, wearsSize: "M" },
      sizes: [
        { label: "XS", bodyChestMinCm: 86, bodyChestMaxCm: 92, chestCm: 106 },
        { label: "S", bodyChestMinCm: 92, bodyChestMaxCm: 98, chestCm: 112 },
        { label: "M", bodyChestMinCm: 98, bodyChestMaxCm: 104, chestCm: 118 },
        { label: "L", bodyChestMinCm: 104, bodyChestMaxCm: 110, chestCm: 124 },
        { label: "XL", bodyChestMinCm: 110, bodyChestMaxCm: 116, chestCm: 130 },
      ],
    },
  },
];

// ------------ Layer 2: URL-derived extraction ------------

// Known retailers → display name + how their sizing tends to run.
// `chestBase` = garment chest (cm) for the ladder's middle size (M / EU 48);
// `stepCm` = increment per size. Different brands => different charts.
type BrandProfile = {
  brand: string;
  system: "alpha" | "eu";
  chestBaseCm: number;
  stepCm: number;
  fitNotes: string;
};

const BRAND_TABLE: Record<string, BrandProfile> = {
  uniqlo: { brand: "Uniqlo", system: "alpha", chestBaseCm: 100, stepCm: 4, fitNotes: "Runs slightly slim; regular fit." },
  cos: { brand: "COS", system: "eu", chestBaseCm: 110, stepCm: 4, fitNotes: "Relaxed, boxy cut." },
  levi: { brand: "Levi's", system: "alpha", chestBaseCm: 112, stepCm: 6, fitNotes: "Structured, non-stretch." },
  zara: { brand: "Zara", system: "alpha", chestBaseCm: 98, stepCm: 4, fitNotes: "Runs small; European sizing." },
  hm: { brand: "H&M", system: "alpha", chestBaseCm: 102, stepCm: 5, fitNotes: "Inconsistent by line; often runs small." },
  gap: { brand: "Gap", system: "alpha", chestBaseCm: 104, stepCm: 5, fitNotes: "Relaxed American fit." },
  nike: { brand: "Nike", system: "alpha", chestBaseCm: 106, stepCm: 5, fitNotes: "Athletic cut; standard fit." },
  adidas: { brand: "Adidas", system: "alpha", chestBaseCm: 106, stepCm: 5, fitNotes: "Regular sport fit." },
  jcrew: { brand: "J.Crew", system: "alpha", chestBaseCm: 103, stepCm: 5, fitNotes: "Classic fit runs true to size." },
  muji: { brand: "MUJI", system: "alpha", chestBaseCm: 101, stepCm: 4, fitNotes: "Relaxed, simple cut." },
  everlane: { brand: "Everlane", system: "alpha", chestBaseCm: 104, stepCm: 5, fitNotes: "True to size, slightly relaxed." },
  arcteryx: { brand: "Arc'teryx", system: "alpha", chestBaseCm: 105, stepCm: 5, fitNotes: "Trim technical fit." },
  patagonia: { brand: "Patagonia", system: "alpha", chestBaseCm: 108, stepCm: 5, fitNotes: "Regular outdoor fit." },
};

// category keyword detection from the URL slug / path.
// ORDER MATTERS — the first regex that matches wins, so the most specific /
// least ambiguous patterns come first. Insulated outerwear ("down hoody",
// "puffer") is matched as a jacket BEFORE the generic hoodie rule, since a
// down-hoody is an insulated jacket with a hood, not a fleece hoodie.
const CATEGORY_KEYWORDS: Array<{ cat: string; re: RegExp }> = [
  // Bottoms (before tops so "sweatpants" ≠ sweater, "board-shorts" ≠ shirt)
  { cat: "jeans", re: /\b(jeans?|denim)\b/i },
  { cat: "shorts", re: /\b(shorts?|boardshorts?|trunks)\b/i },
  { cat: "skirt", re: /\b(skirts?)\b/i },
  { cat: "pants", re: /\b(pants?|trousers?|chinos?|leggings?|joggers?|sweatpants?|slacks?|cargos?)\b/i },
  // Footwear
  { cat: "sneakers", re: /\b(sneakers?|trainers?|runners?)\b/i },
  { cat: "boots", re: /\b(boots?)\b/i },
  { cat: "shoes", re: /\b(shoes?|loafers?|sandals?|footwear|flats?|heels?|clogs?)\b/i },
  { cat: "socks", re: /\b(socks?)\b/i },
  // Accessories
  { cat: "hat", re: /\b(hat|caps?|beanie|beanies)\b/i },
  { cat: "belt", re: /\b(belts?)\b/i },
  { cat: "scarf", re: /\b(scarf|scarves|muffler)\b/i },
  // Tops — insulated outerwear first, then hoodie/sweater/jacket/shirt/tee
  { cat: "jacket", re: /\b(down|puffer|puffy|insulated|parka|anorak|windbreaker|gilet|shell)\b/i },
  { cat: "polo", re: /\bpolo\b/i },
  { cat: "hoodie", re: /\b(hoodie|hoody|hooded|sweatshirt)\b/i },
  { cat: "sweater", re: /\b(sweater|jumper|knit|cardigan|pullover|fleece|turtleneck)\b/i },
  { cat: "jacket", re: /\b(jacket|coat|trucker|blazer|outerwear|vest)\b/i },
  { cat: "shirt", re: /\b(shirt|oxford|flannel|button-?down|button-?up)\b/i },
  { cat: "tshirt", re: /\b(t-?shirt|tee|crew-?neck)\b/i },
];

// Gender / department detection from the URL path. "women" first — note
// "\bmen\b" never matches inside "women" anyway (no word boundary), but ordering
// keeps the intent obvious. Single letters (m/w) are too noisy to trust.
function detectGender(text: string): Gender | undefined {
  const rules: Array<{ g: Gender; re: RegExp }> = [
    { g: "womens", re: /\b(womens?|women'?s|woman|ladies|female|girls?)\b/i },
    { g: "mens", re: /\b(mens?|men'?s|male|boys?)\b/i },
    { g: "unisex", re: /\b(unisex|all-?gender)\b/i },
  ];
  for (const { g, re } of rules) if (re.test(text)) return g;
  return undefined;
}

// gender words to strip from the FRONT of a derived product name
const GENDER_PREFIX_RE = /^(womens?|women'?s|woman|ladies|mens?|men'?s|male|unisex)\s+/i;

// CMS/path noise words that show up in slugs but aren't part of a product name.
const SLUG_NOISE = new Set([
  "productpage", "product", "products", "p", "prod", "dp", "item", "items",
  "en", "us", "en_us", "en-us", "shop", "buy", "detail", "details", "pd",
]);

/** Turn a URL slug into a human product name. */
function slugToName(slug: string): string {
  const base = slug
    .replace(/\.(html?|aspx|php|jsp)$/i, "")
    // Zara-style "…-p12345" or "…-pd12345", and bare id segments.
    .replace(/[-_.]p[a-z]?\d{3,}/gi, "")
    .replace(/[-_.]/g, " ");

  const words = base
    .split(/\s+/)
    .map((w) => w.trim())
    .filter(Boolean)
    // drop alphanumeric SKU-ish tokens and standalone ids
    .filter((w) => !/^\d+$/.test(w)) // pure numbers (sizes/color codes: "00", "42")
    .filter((w) => !/\d{3,}/.test(w)) // has a 3+ digit run → likely an id
    .filter((w) => !/^[a-z]{1,3}\d+$/i.test(w)) // e.g. "abc123", "p12"
    .filter((w) => !SLUG_NOISE.has(w.toLowerCase()));

  if (words.length === 0) return "";
  return words
    .map((w) => (w.length <= 2 ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1)))
    .join(" ");
}

/**
 * Many retailers put the SKU/id in the LAST path segment and the descriptive
 * slug earlier (e.g. Patagonia `/product/womens-fitz-roy-down-hoody/85506.html`).
 * So we score every path segment by how many real words it yields and pick the
 * richest one, instead of blindly taking the last segment.
 */
function pickNameSlug(parts: string[]): string {
  let best = "";
  let bestScore = 0;
  for (const p of parts) {
    const name = slugToName(p);
    if (!name) continue;
    const score = name.split(/\s+/).filter(Boolean).length;
    if (score > bestScore) {
      bestScore = score;
      best = name;
    }
  }
  return best;
}

function guessBrand(host: string): BrandProfile | null {
  const h = host.toLowerCase();
  for (const key of Object.keys(BRAND_TABLE)) {
    if (h.includes(key)) return BRAND_TABLE[key];
  }
  return null;
}

function detectCategory(text: string): string {
  for (const { cat, re } of CATEGORY_KEYWORDS) {
    if (re.test(text)) return cat;
  }
  return "tshirt"; // safest default for tops
}

/** Build a size ladder for a brand profile + category. */
function buildSizes(profile: BrandProfile, category: string): ExtractedSize[] {
  // jackets/coats have more ease baked in
  const catAdj = category === "jacket" || category === "hoodie" ? 8 : category === "sweater" ? 4 : 0;
  const base = profile.chestBaseCm + catAdj;
  const step = profile.stepCm;
  if (profile.system === "eu") {
    const labels = [44, 46, 48, 50, 52];
    return labels.map((n, i) => ({
      label: `EU ${n}`,
      region: "EU",
      chestCm: base + (i - 2) * step,
      shoulderCm: 44 + i,
      sleeveCm: 63 + i,
    }));
  }
  const labels = ["XS", "S", "M", "L", "XL"];
  return labels.map((lbl, i) => ({
    label: lbl,
    chestCm: base + (i - 2) * step,
    shoulderCm: 42 + i * 1.5,
    sleeveCm: 20 + i,
    lengthCm: 68 + i * 2,
  }));
}

function guessRetailerName(host: string): string {
  const core = host.replace(/^www\./, "").split(".")[0];
  return core ? core.charAt(0).toUpperCase() + core.slice(1) : "Unknown retailer";
}

// ------------ Public API ------------

export function extractFromUrl(url: string): ExtractedProduct {
  let host = "";
  let parts: string[] = [];
  try {
    const u = new URL(url);
    host = u.hostname.replace(/^www\./, "");
    parts = u.pathname.split("/").filter(Boolean).map((p) => decodeURIComponent(p));
  } catch {
    host = "";
  }
  const slug = parts[parts.length - 1] ?? "";

  // Layer 1: curated fixture (exact demo products).
  for (const f of FIXTURES) {
    if (f.match.test(url)) {
      return { ...f.data, source: { url, host, derived: false, slug, sizesFrom: "fixture" } };
    }
  }

  // Layer 2: URL-derived. Detect over the WHOLE path (all segments), not just
  // the last one — the descriptive slug is often not the final segment.
  const pathText = `${host} ${parts.join(" ")}`.replace(/[-_]/g, " ");
  const category = detectCategory(pathText);
  const gender = detectGender(pathText);
  const brandProfile = guessBrand(host);

  // Best human name from the richest path segment, with a leading gender word
  // stripped (we surface gender separately).
  const rawName = pickNameSlug(parts);
  const nameFromSlug = rawName.replace(GENDER_PREFIX_RE, "").trim();

  if (brandProfile) {
    const productName =
      nameFromSlug && nameFromSlug.toLowerCase() !== brandProfile.brand.toLowerCase()
        ? `${brandProfile.brand} ${nameFromSlug}`
        : `${brandProfile.brand} ${garmentNoun(category)}`;
    return {
      retailer: brandProfile.brand,
      brand: brandProfile.brand,
      productName,
      category,
      gender,
      material: "See product page",
      fitNotes: brandProfile.fitNotes,
      sizes: buildSizes(brandProfile, category),
      source: { url, host, derived: true, slug, sizesFrom: "estimated" },
    };
  }

  // Unknown brand: still derive as much as we can from the URL itself.
  const retailer = guessRetailerName(host) || "Unknown retailer";
  const genericProfile: BrandProfile = {
    brand: retailer,
    system: "alpha",
    chestBaseCm: 102,
    stepCm: 5,
    fitNotes: "Standard sizing assumed (brand not recognized). Confirm the chart below.",
  };
  return {
    retailer,
    brand: retailer,
    productName: nameFromSlug ? `${retailer} · ${nameFromSlug}` : `${retailer} ${garmentNoun(category)}`,
    category,
    gender,
    material: "Unknown",
    fitNotes: genericProfile.fitNotes,
    sizes: buildSizes(genericProfile, category),
    source: { url, host, derived: true, slug, sizesFrom: "estimated" },
  };
}

// Human noun for a category, used when we couldn't recover a real product name.
function garmentNoun(category: string): string {
  const nouns: Record<string, string> = {
    tshirt: "T-shirt", shirt: "shirt", polo: "polo", sweater: "sweater",
    hoodie: "hoodie", jacket: "jacket", pants: "pants", jeans: "jeans",
    shorts: "shorts", skirt: "skirt", shoes: "shoes", sneakers: "sneakers",
    boots: "boots", socks: "socks", hat: "hat", belt: "belt", scarf: "scarf",
  };
  return nouns[category] ?? "item";
}

export function listFixtures() {
  return FIXTURES.map((f) => ({ productName: f.data.productName, brand: f.data.brand }));
}
