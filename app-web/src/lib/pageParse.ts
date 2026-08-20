// Deterministic product-page parsing — NO LLM, NO API key required.
//
// The audit (Session 39) found sizes were "derived" from the URL slug rather than
// read from the actual page. The biggest, cheapest fix is NOT the LLM — it's that
// a large share of real retail pages already carry machine-readable data we were
// throwing away:
//
//   • schema.org **Product** JSON-LD (`<script type="application/ld+json">`) —
//     brand, name, category, sometimes gender. Reliable and structured.
//   • **OpenGraph / meta** tags — title, description, product:brand.
//   • The **size chart itself, as an HTML <table>** — chest/waist/shoulder/sleeve
//     rows we can parse straight into measurements.
//
// This module reads all three deterministically. The LLM layer (extractorLLM.ts)
// then only has to handle the messy pages where the chart is rendered by client
// JS or hidden behind a tab — a much smaller, better-scoped job.
//
// Everything here is a PURE function over an HTML string, so it unit-tests without
// a network. No body measurements are involved; this only ever reads the product.

import type { ExtractedSize, Gender } from "./extractor";

export type ParsedPage = {
  brand?: string;
  productName?: string;
  category?: string;
  gender?: Gender;
  material?: string;
  fitNotes?: string;
  /** Sizes parsed from an on-page table, if one was found and understood. */
  sizes?: ExtractedSize[];
};

// ---------------------------------------------------------------------------
// small HTML helpers
// ---------------------------------------------------------------------------

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;|&rsquo;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)));
}

function stripTags(s: string): string {
  return decodeEntities(s.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

// ---------------------------------------------------------------------------
// 1. JSON-LD (schema.org Product)
// ---------------------------------------------------------------------------

/** Flatten the shapes JSON-LD comes in: a single node, an array, or an @graph. */
function jsonLdNodes(html: string): Record<string, unknown>[] {
  const nodes: Record<string, unknown>[] = [];
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    try {
      const parsed = JSON.parse(m[1].trim());
      const push = (v: unknown) => {
        if (v && typeof v === "object") nodes.push(v as Record<string, unknown>);
      };
      if (Array.isArray(parsed)) parsed.forEach(push);
      else {
        push(parsed);
        const graph = (parsed as { "@graph"?: unknown })["@graph"];
        if (Array.isArray(graph)) graph.forEach(push);
      }
    } catch {
      /* one malformed block shouldn't kill the rest */
    }
  }
  return nodes;
}

function typeMatches(node: Record<string, unknown>, want: string): boolean {
  const t = node["@type"];
  if (typeof t === "string") return t.toLowerCase() === want;
  if (Array.isArray(t)) return t.some((x) => String(x).toLowerCase() === want);
  return false;
}

function asString(v: unknown): string | undefined {
  if (typeof v === "string") return v.trim() || undefined;
  if (v && typeof v === "object") {
    // brand: { "@type":"Brand", "name":"COS" } etc.
    const name = (v as { name?: unknown }).name;
    if (typeof name === "string") return name.trim() || undefined;
  }
  return undefined;
}

function productFromJsonLd(html: string): ParsedPage {
  const node = jsonLdNodes(html).find((n) => typeMatches(n, "product"));
  if (!node) return {};
  const out: ParsedPage = {};
  out.brand = asString(node.brand);
  out.productName = asString(node.name);
  out.material = asString(node.material);
  const cat = asString(node.category);
  if (cat) out.category = cat;
  return out;
}

// ---------------------------------------------------------------------------
// 2. OpenGraph / meta
// ---------------------------------------------------------------------------

function metaContent(html: string, key: string): string | undefined {
  // matches property= or name=, in either attribute order
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${key}["'][^>]*content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${key}["']`, "i"),
  ];
  for (const p of patterns) {
    const m = html.match(p);
    if (m) return decodeEntities(m[1]).trim() || undefined;
  }
  return undefined;
}

function openGraph(html: string): ParsedPage {
  const out: ParsedPage = {};
  out.productName = metaContent(html, "og:title");
  out.brand = metaContent(html, "product:brand") || metaContent(html, "og:site_name");
  const desc = metaContent(html, "og:description") || metaContent(html, "description");
  if (desc) out.fitNotes = desc;
  return out;
}

// ---------------------------------------------------------------------------
// 3. Gender / category inference from visible text (fallback only)
// ---------------------------------------------------------------------------

export function inferGender(text: string): Gender | undefined {
  const t = text.toLowerCase();
  // Women before men: "women" contains "men", so the men test must exclude it.
  if (/\b(women|women's|womens|ladies|female)\b|女装|女士|女款/.test(t)) return "womens";
  if (/\b(men|men's|mens|male)\b|男装|男士|男款/.test(t)) return "mens";
  if (/\bunisex\b|中性|男女/.test(t)) return "unisex";
  return undefined;
}

// ---------------------------------------------------------------------------
// 4. Size-chart TABLE parsing — the high-value piece
// ---------------------------------------------------------------------------

// Measurement synonyms → our ExtractedSize field. English + common Chinese, since
// Taobao/Tmall charts are a stated target channel.
const MEASURE_MAP: Array<{ re: RegExp; field: keyof ExtractedSize }> = [
  { re: /chest|bust|胸围|胸/i, field: "chestCm" },
  { re: /waist|腰围|腰/i, field: "waistCm" },
  { re: /shoulder|肩宽|肩/i, field: "shoulderCm" },
  { re: /sleeve|arm\s*length|袖长|袖/i, field: "sleeveCm" },
  { re: /length|body\s*length|衣长|总长|后中长/i, field: "lengthCm" },
];

const SIZE_LABEL_RE = /^(XXS|XS|S|M|L|XL|XXL|XXXL|2XL|3XL|4XL|\d{1,3}(?:\.\d)?|EU\s?\d{2}|US\s?\d{1,2}|UK\s?\d{1,2})$/i;

/** Which measurement field (if any) a header cell names. */
function fieldFor(cell: string): keyof ExtractedSize | null {
  for (const { re, field } of MEASURE_MAP) if (re.test(cell)) return field;
  return null;
}

function looksLikeSizeLabel(cell: string): boolean {
  const c = cell.trim();
  if (!c || fieldFor(c)) return false;
  return SIZE_LABEL_RE.test(c);
}

/** First number in a cell; ranges ("96-100", "96–100") collapse to their midpoint. */
function parseNumber(cell: string): number | null {
  const nums = cell.replace(/,/g, "").match(/\d+(?:\.\d+)?/g);
  if (!nums || nums.length === 0) return null;
  const vals = nums.map(Number).filter((n) => Number.isFinite(n));
  if (vals.length === 0) return null;
  if (vals.length >= 2 && /[-–~]/.test(cell)) return (vals[0] + vals[1]) / 2;
  return vals[0];
}

/** Split raw <table> HTML into a grid of trimmed cell strings. */
function tableGrid(tableHtml: string): string[][] {
  const rows: string[][] = [];
  const rowRe = /<tr[\s\S]*?<\/tr>/gi;
  const trs = tableHtml.match(rowRe) ?? [];
  for (const tr of trs) {
    const cellRe = /<t[dh][\s\S]*?<\/t[dh]>/gi;
    const cells = (tr.match(cellRe) ?? []).map(stripTags);
    if (cells.length) rows.push(cells);
  }
  return rows;
}

/**
 * Chest values around ~30–50 are almost certainly INCHES (a cm chest is ~80–130).
 * Convert a whole chart from inches when its chest column reads that low.
 */
function inchesToCm(sizes: ExtractedSize[]): ExtractedSize[] {
  const chests = sizes.map((s) => s.chestCm).filter((n): n is number => typeof n === "number");
  const median = chests.length ? chests.sort((a, b) => a - b)[Math.floor(chests.length / 2)] : undefined;
  if (median === undefined || median >= 65) return sizes; // already cm
  const conv = (n?: number) => (typeof n === "number" ? Math.round(n * 2.54 * 10) / 10 : n);
  return sizes.map((s) => ({
    ...s,
    chestCm: conv(s.chestCm),
    waistCm: conv(s.waistCm),
    shoulderCm: conv(s.shoulderCm),
    sleeveCm: conv(s.sleeveCm),
    lengthCm: conv(s.lengthCm),
  }));
}

/** Parse one grid into sizes, trying both orientations; null if it isn't a chart. */
function sizesFromGrid(grid: string[][]): ExtractedSize[] | null {
  if (grid.length < 2) return null;

  // Orientation A: sizes are COLUMNS. Header row = [label, S, M, L…]; each later
  // row starts with a measurement name.
  const header = grid[0];
  const colSizeLabels = header.slice(1).filter(looksLikeSizeLabel).length;
  const rowMeasureNames = grid.slice(1).filter((r) => fieldFor(r[0] ?? "")).length;

  // Orientation B: sizes are ROWS. Header = [label, Chest, Waist…]; each later row
  // starts with a size label.
  const headerMeasureNames = header.slice(1).filter((c) => fieldFor(c)).length;
  const rowSizeLabels = grid.slice(1).filter((r) => looksLikeSizeLabel(r[0] ?? "")).length;

  const scoreA = colSizeLabels + rowMeasureNames;
  const scoreB = headerMeasureNames + rowSizeLabels;
  if (Math.max(scoreA, scoreB) < 2) return null; // not a size chart

  const sizes: ExtractedSize[] = [];

  if (scoreB >= scoreA) {
    // sizes as rows
    const fields = header.map(fieldFor); // fields[col], fields[0] is the label col
    for (const row of grid.slice(1)) {
      const label = (row[0] ?? "").trim();
      if (!looksLikeSizeLabel(label)) continue;
      const size: ExtractedSize = { label: label.toUpperCase() };
      let any = false;
      for (let c = 1; c < row.length; c++) {
        const f = fields[c];
        if (!f) continue;
        const n = parseNumber(row[c]);
        if (n != null) {
          (size as Record<string, unknown>)[f] = n;
          any = true;
        }
      }
      if (any) sizes.push(size);
    }
  } else {
    // sizes as columns
    const labels = header.map((c) => c.trim());
    // seed a size object per column that holds a size label
    const cols: Array<{ idx: number; size: ExtractedSize }> = [];
    for (let c = 1; c < labels.length; c++) {
      if (looksLikeSizeLabel(labels[c])) cols.push({ idx: c, size: { label: labels[c].toUpperCase() } });
    }
    for (const row of grid.slice(1)) {
      const f = fieldFor(row[0] ?? "");
      if (!f) continue;
      for (const { idx, size } of cols) {
        const n = parseNumber(row[idx] ?? "");
        if (n != null) (size as Record<string, unknown>)[f] = n;
      }
    }
    for (const { size } of cols) {
      if (size.chestCm || size.waistCm || size.shoulderCm || size.sleeveCm || size.lengthCm) {
        sizes.push(size);
      }
    }
  }

  if (sizes.length < 2) return null; // one row is not a chart
  return inchesToCm(sizes);
}

/** Find the best size-chart table on the page, if any. */
export function parseSizeTables(html: string): ExtractedSize[] | null {
  const tables = html.match(/<table[\s\S]*?<\/table>/gi) ?? [];
  let best: ExtractedSize[] | null = null;
  for (const t of tables) {
    const sizes = sizesFromGrid(tableGrid(t));
    // Prefer the chart that yields the most sizes (usually THE size chart).
    if (sizes && (!best || sizes.length > best.length)) best = sizes;
  }
  return best;
}

// ---------------------------------------------------------------------------
// 5. Offered size LABELS (when there's no measurement chart)
// ---------------------------------------------------------------------------

// Many pages don't put a size *chart* in the initial HTML, but they DO list the
// offered sizes in a <select>/<option> or a variant list. Those labels alone are
// still worth a lot: the closet-anchor, outcome, and brand-bias signals all work
// on labels, so ranking the REAL offered sizes beats a synthesized ladder.

const NON_SIZE_OPTION = /^(select|choose|size|please|请选择|选择|尺码|--|—)$/i;

/** Extract plausible size labels from <select>/<option> and common variant attrs. */
export function parseSizeLabels(html: string): string[] {
  const labels = new Set<string>();

  // <option> values inside any <select> that looks size-related.
  const selects = html.match(/<select[\s\S]*?<\/select>/gi) ?? [];
  for (const sel of selects) {
    const isSizeSelect = /size|尺码|规格/i.test(sel);
    const opts = sel.match(/<option[\s\S]*?<\/option>/gi) ?? [];
    for (const o of opts) {
      const txt = stripTags(o);
      if (!txt || NON_SIZE_OPTION.test(txt)) continue;
      // In a size-labelled select, take short tokens; otherwise require a size shape.
      if (isSizeSelect ? txt.length <= 8 : looksLikeSizeLabel(txt)) labels.add(txt.toUpperCase());
    }
  }

  // data-size / data-value="S" style attributes on swatch buttons.
  const attrRe = /data-(?:size|value|option-value)=["']([^"']{1,8})["']/gi;
  let m: RegExpExecArray | null;
  while ((m = attrRe.exec(html))) {
    const v = m[1].trim();
    if (v && !NON_SIZE_OPTION.test(v) && looksLikeSizeLabel(v)) labels.add(v.toUpperCase());
  }

  return [...labels];
}

// ---------------------------------------------------------------------------
// 6. Bot-block / challenge detection
// ---------------------------------------------------------------------------

/**
 * Recognise the response bodies retailers serve to bots — a CAPTCHA/challenge or
 * an access-denied interstitial — so the caller can fall back honestly instead of
 * parsing an error page as if it were the product. `status` is the HTTP status.
 */
export function looksBlocked(status: number, html: string): boolean {
  if (status === 403 || status === 429 || status === 503) return true;
  const head = html.slice(0, 4000).toLowerCase();
  const enMarkers =
    /captcha|are you a robot|verify you are (?:a )?human|access denied|request unsuccessful|enable javascript to continue/;
  const vendorMarkers =
    /px-captcha|cf-challenge|challenge-platform|distil_r_captcha|akamai|perimeterx/;
  const cnMarkers = /滑动验证|人机验证|访问被拒绝|安全验证|验证码/;
  return enMarkers.test(head) || vendorMarkers.test(head) || cnMarkers.test(head);
}

// ---------------------------------------------------------------------------
// public entry point
// ---------------------------------------------------------------------------

/**
 * Deterministically parse everything we can from raw product-page HTML.
 * Merge priority: JSON-LD (most structured) → OpenGraph → text inference.
 */
export function parsePage(html: string): ParsedPage {
  const ld = productFromJsonLd(html);
  const og = openGraph(html);
  const text = stripTags(html).slice(0, 20_000);

  const merged: ParsedPage = {
    brand: ld.brand || og.brand,
    productName: ld.productName || og.productName,
    category: ld.category,
    material: ld.material,
    fitNotes: og.fitNotes,
    gender: inferGender(`${ld.productName ?? ""} ${og.productName ?? ""} ${text}`),
  };

  const sizes = parseSizeTables(html);
  if (sizes && sizes.length >= 2) merged.sizes = sizes;

  // Drop empty keys so callers can `??`-merge cleanly.
  (Object.keys(merged) as (keyof ParsedPage)[]).forEach((k) => merged[k] === undefined && delete merged[k]);
  return merged;
}
