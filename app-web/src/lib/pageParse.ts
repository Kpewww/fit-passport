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

import { alphaIndex, midpointBand, normalizeToAlpha } from "./sizing";
import type { ExtractedSize, Gender } from "./extractor";

export type ParsedPage = {
  brand?: string;
  productName?: string;
  /**
   * The page's first `<h1>`. The extension sends it on purpose — it is usually the
   * product's name as the shopper sees it — and until Session 78 nothing read it.
   */
  headline?: string;
  category?: string;
  gender?: Gender;
  material?: string;
  fitNotes?: string;
  /** Sizes parsed from an on-page table, if one was found and understood. */
  sizes?: ExtractedSize[];
  /** What those sizes measure, and on whose word (see `resolveMeasurementKind`). */
  measurementKind?: "body" | "garment";
  measurementKindFrom?: KindSource;
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
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    // Hex references too: nike.com writes Men&#x27;s in og:title (Session 80).
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)));
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
  // Some sites entity-encode inside JSON-LD (eBay: "MEN&#039;S"), which JSON does
  // not undo; decode like every other string read off a page.
  const decoded = (v: string | undefined) => (v ? decodeEntities(v) : v);
  out.brand = decoded(asString(node.brand));
  out.productName = decoded(asString(node.name));
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

/** og:site_name is the site, and some sites name themselves by domain ("Nike.com"). */
export function siteNameAsBrand(site: string | undefined): string | undefined {
  if (!site) return undefined;
  const bare = site.replace(/^www\./i, "").replace(/\.(?:com|net|co(?:\.[a-z]{2})?|com\.[a-z]{2}|[a-z]{2})$/i, "");
  return /^[^\s.]+(?:\s[^\s.]+)*$/.test(bare) && bare !== site ? bare : site;
}

function openGraph(html: string): ParsedPage {
  const out: ParsedPage = {};
  out.productName = metaContent(html, "og:title");
  out.brand = metaContent(html, "product:brand") || siteNameAsBrand(metaContent(html, "og:site_name"));
  const desc = metaContent(html, "og:description") || metaContent(html, "description");
  if (desc) out.fitNotes = desc;
  return out;
}

// ---------------------------------------------------------------------------
// 2b. Chinese marketplaces: the <title>, and the 参数信息 list (Session 79a)
// ---------------------------------------------------------------------------
//
// Tmall, Taobao and JD publish no JSON-LD, no og:title and no <h1>. The product's
// name is in <title> with the marketplace appended, and its brand and gender are
// in a list of label/value pairs the extension sends as <dl data-fp="attrs">.
// Found on a real Tmall item, where the server had named the brand "Detail" (the
// host) and the product "Detail T-shirt".

/**
 * A marketplace's name appended to a title — "-tmall.com天猫", "-淘宝网", "-京东" —
 * and JD's "【行情 报价 价格 评测】" before it. Shared with the extension, which
 * shows the same cleaned name in its popup (drift test in marketplaceCapture).
 */
export const TITLE_SUFFIX_RE =
  /\s*(?:【[^】]{0,40}】)?\s*[-–—_|]\s*(?:tmall\.com天猫|天猫tmall\.com|天猫|淘宝网|淘宝|京东|jd\.com|拼多多|唯品会|得物)\s*$/i;

/** The title without the marketplace — or the title unchanged when it names none. */
export function cleanTitle(title: string): string {
  return title.replace(TITLE_SUFFIX_RE, "").trim();
}

/**
 * The only parameter labels the extension sends — an ALLOWLIST, like the rest
 * of the capture. Enough to identify the garment and who it is cut for; item
 * numbers, prices and everything else stay on the page. Shared with capture.js.
 */
export const ATTR_LABELS = [
  "品牌",
  "适用性别",
  "性别",
  "适用对象",
  "版型",
  "版型分类",
  "服装版型",
  "袖长",
  "衣长",
  "衣长类型",
  "领型",
  "材质",
  "材质成分",
  "面料",
  "成分含量",
  "厚薄",
  "适用季节",
  "款式",
];

/** A value that says nothing: "其他", "other", "无". */
const EMPTY_ATTR = /^(其他|其它|other|others|无|none|n\/a|-+)$/i;

/** The label/value pairs the extension sent, first value per label. */
function productAttrs(html: string): Map<string, string> {
  const out = new Map<string, string>();
  const dl = html.match(/<dl\b[^>]*data-fp=["']attrs["'][^>]*>([\s\S]*?)<\/dl>/i);
  if (!dl) return out;
  const re = /<dt\b[^>]*>([\s\S]*?)<\/dt>\s*<dd\b[^>]*>([\s\S]*?)<\/dd>/gi;
  for (const m of dl[1].matchAll(re)) {
    const k = stripTags(m[1]).trim();
    const v = stripTags(m[2]).trim();
    if (k && v && !out.has(k)) out.set(k, v);
  }
  return out;
}

// ---------------------------------------------------------------------------
// 2c. One-off listings (eBay …): the listing's own words about its size — Session 80
// ---------------------------------------------------------------------------

/**
 * The texts a seller's measurements are read from (sellerMeasurements.ts): the
 * listing's title, its item specifics, and its description lines.
 *
 * Specifics come from the extension's `<dl data-fp="specs">` only: our server is
 * refused by eBay (an "Error Page", measured Session 80), so there is no served
 * markup to read and no parser for one was written blind. Description lines come only from
 * the extension's `<p data-fp="measure">` — read inside the seller's description
 * frame — never from the page's free text, which on eBay also lists OTHER sellers'
 * items with their own pit-to-pit widths (measured, Session 80).
 */
export function listingTexts(html: string): { title: string | null; specs: Array<[string, string]>; lines: string[] } {
  const h1 = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
  const title =
    (h1 && stripTags(h1[1]).replace(/\s+/g, " ").trim()) ||
    metaContent(html, "og:title") ||
    (html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] ? stripTags(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)![1]).trim() : null) ||
    null;
  const specs: Array<[string, string]> = [];
  const dl = html.match(/<dl\b[^>]*data-fp=["']specs["'][^>]*>([\s\S]*?)<\/dl>/i);
  if (dl) {
    for (const m of dl[1].matchAll(/<dt\b[^>]*>([\s\S]*?)<\/dt>\s*<dd\b[^>]*>([\s\S]*?)<\/dd>/gi)) {
      specs.push([stripTags(m[1]).trim(), stripTags(m[2]).trim()]);
    }
  }
  const lines = [...html.matchAll(/<p\b[^>]*data-fp=["']measure["'][^>]*>([\s\S]*?)<\/p>/gi)].map((m) => stripTags(m[1]).trim()).filter(Boolean);
  return { title: title ? title.slice(0, 300) : null, specs: specs.slice(0, 60), lines: lines.slice(0, 40) };
}

/** 适用性别 / 性别 / 适用对象 as a gender, when it says one. */
function genderFromAttr(v: string | undefined): Gender | undefined {
  if (!v) return undefined;
  if (/男女|通用|中性|情侣/.test(v)) return "unisex";
  if (/女/.test(v)) return "womens";
  if (/男/.test(v)) return "mens";
  return undefined;
}

// ---------------------------------------------------------------------------
// 3. Gender / category inference from visible text (fallback only)
// ---------------------------------------------------------------------------

export function inferGender(text: string): Gender | undefined {
  const t = text.toLowerCase();
  // Marketplace titles put the gender AFTER the garment ("短袖T恤男", "T恤女"),
  // and "男女同款" / 情侣装 mean both. Checked first, because "T恤男女同款"
  // contains "T恤男". No \b: it never matches at a CJK boundary (invariant ⑫).
  if (/男女同款|男女通用|情侣装|情侣款/.test(t)) return "unisex";
  if (/(?:t恤|短袖|长袖|衬衫|衬衣|卫衣|外套|夹克|毛衣|针织衫|polo衫|背心|裤)女(?!装)/.test(t)) return "womens";
  if (/(?:t恤|短袖|长袖|衬衫|衬衣|卫衣|外套|夹克|毛衣|针织衫|polo衫|背心|裤)男(?![女装])/.test(t)) return "mens";
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
//
// Exported because the browser extension decides which tables to send by
// measurement words, and must keep every table this can read — see
// browser-extension/capture.js and extensionCapture.test.ts.
/**
 * The attribute the extension's capture sets on each size table it keeps, "1" when
 * the table was on screen. Shared with `browser-extension/capture.js`, which
 * cannot import it; `extensionCapture.test.ts` keeps the two spellings identical.
 */
export const VISIBLE_CHART_ATTR = "data-fp-visible";

export const MEASURE_MAP: Array<{ re: RegExp; field: keyof ExtractedSize }> = [
  { re: /chest|bust|胸围|胸/i, field: "chestCm" },
  { re: /waist|腰围|腰/i, field: "waistCm" },
  // Hip (Session 84): dresses and jumpsuits are sized by bust, waist and hip.
  { re: /hips?|臀围|臀/i, field: "hipCm" },
  { re: /shoulder|肩宽|肩/i, field: "shoulderCm" },
  { re: /sleeve|arm\s*length|袖长|袖/i, field: "sleeveCm" },
  { re: /length|body\s*length|衣长|总长|后中长/i, field: "lengthCm" },
];

/** What a size label looks like. Shared with the extension, which counts only
 *  size-shaped values as size options (a swatch valued "item" is not a size). */
export const SIZE_LABEL_RE = /^(XXS|XS|S|M|L|XL|XXL|XXXL|2XL|3XL|4XL|\d{1,3}(?:\.\d)?|EU\s?\d{2}|US\s?\d{1,2}|UK\s?\d{1,2})$/i;

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

const UNICODE_FRACTIONS: Record<string, string> = {
  "¼": " 1/4", "½": " 1/2", "¾": " 3/4", "⅛": " 1/8", "⅜": " 3/8", "⅝": " 5/8", "⅞": " 7/8", "⅓": " 1/3", "⅔": " 2/3",
};
// Denominators a tape measure uses. "32/34" is a waist/inseam pair, not 0.94.
const FRACTION_DENOMINATORS = new Set([2, 3, 4, 8, 16]);

/**
 * The numbers a cell states, reading "31 1/2", "31-1/2" and "31½" as ONE number
 * each, and whether the first two form a range ("96-100", "96–100", "96 to 100").
 *
 * The first version took every run of digits as a number, so uniqlo.com's
 * "31 1/2-34 3/4" read as a range from 31 to 1 — XS came out as 16, and a column
 * median that low sent the whole chart through the inch conversion: XS "40.6cm",
 * L "108", XXL "61". Measured end to end: L at 65% confidence for a 100cm chest,
 * on a chart that plainly says M.
 */
function cellNumbers(cell: string): { values: number[]; range: boolean } {
  const text = cell.replace(/,/g, "").replace(/[¼½¾⅛⅜⅝⅞⅓⅔]/g, (f) => UNICODE_FRACTIONS[f] ?? f);
  const tokens = Array.from(text.matchAll(/\d+(?:\.\d+)?/g), (m) => ({
    v: Number(m[0]),
    start: m.index ?? 0,
    end: (m.index ?? 0) + m[0].length,
  }));
  const out: Array<{ v: number; start: number; end: number; mixed: boolean }> = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    const d = tokens[i + 1];
    const fraction =
      !!d && text.slice(t.end, d.start) === "/" && Number.isInteger(t.v) && Number.isInteger(d.v) &&
      FRACTION_DENOMINATORS.has(d.v) && t.v > 0 && t.v < d.v;
    if (fraction) {
      const prev = out[out.length - 1];
      // A whole number followed by a space or a single hyphen, then a fraction, is
      // one mixed number: "31 1/2", "31-1/2". A range never ends in a bare
      // fraction smaller than one.
      const joins = prev && !prev.mixed && Number.isInteger(prev.v) && /^(?:\s+|-)$/.test(text.slice(prev.end, t.start));
      if (joins) {
        prev.v += t.v / d.v;
        prev.end = d.end;
        prev.mixed = true;
      } else {
        out.push({ v: t.v / d.v, start: t.start, end: d.end, mixed: true });
      }
      i++; // the denominator is consumed
      continue;
    }
    out.push({ v: t.v, start: t.start, end: t.end, mixed: false });
  }
  const range = out.length >= 2 && /[-–~]|\bto\b/i.test(text.slice(out[0].end, out[1].start));
  return { values: out.map((o) => o.v).filter((n) => Number.isFinite(n)), range };
}


/** Split raw <table> HTML into a grid of trimmed cell strings. */
function tableGrid(tableHtml: string): string[][] {
  const rows: string[][] = [];
  // Drop HTML comments FIRST. A commented-out cell is not a cell, and counting it
  // shifts every column after it by one — which silently reads the neighbouring
  // measurement instead of the one the header names.
  //
  // Measured on patagonia.com's size-guide modal, whose header carries
  // `<!-- <th width="15%"> </th>-->` between two real cells: the header parsed as
  // six columns against the rows' five, so `chestCm` took the Waist column and a
  // 100cm chest was recommended 3XL. Nothing about the output looked malformed —
  // it was a plausible ladder of plausible numbers, just the wrong column.
  const html = tableHtml.replace(/<!--[\s\S]*?-->/g, "");
  const rowRe = /<tr[\s\S]*?<\/tr>/gi;
  const trs = html.match(rowRe) ?? [];
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
function inchesToCm(sizes: GridSize[]): GridSize[] {
  const chests = sizes.map((s) => s.chestCm).filter((n): n is number => typeof n === "number");
  const median = chests.length ? chests.sort((a, b) => a - b)[Math.floor(chests.length / 2)] : undefined;
  if (median === undefined || median >= 65) return sizes; // already cm
  const conv = (n?: number) => (typeof n === "number" ? Math.round(n * 2.54 * 10) / 10 : n);
  const convRange = (r?: [number, number]): [number, number] | undefined =>
    r ? [conv(r[0])!, conv(r[1])!] : undefined;
  return sizes.map((s) => ({
    ...s,
    chestCm: conv(s.chestCm),
    waistCm: conv(s.waistCm),
    hipCm: conv(s.hipCm),
    shoulderCm: conv(s.shoulderCm),
    sleeveCm: conv(s.sleeveCm),
    lengthCm: conv(s.lengthCm),
    // The stated ranges are in the chart's units too, and must move with the rest.
    ...(s.ranges ? { ranges: { chestCm: convRange(s.ranges.chestCm), waistCm: convRange(s.ranges.waistCm), hipCm: convRange(s.ranges.hipCm) } } : {}),
  }));
}

/**
 * Parse one grid into sizes, trying both orientations; null if it isn't a chart.
 *
 * `ranged` says whether the chart gives a RANGE for each size — at least half of
 * its measurement cells are ranges. That shape is itself evidence of a body
 * chart: a garment has one chest measurement, while a range says who the size is
 * for ("fits a chest of 38–40in"). See `resolveMeasurementKind`.
 */
/**
 * A parsed row, before folding. Same fields as ExtractedSize, plus the range a
 * cell STATED, when it stated one ("37.5–41").
 *
 * Why the range rides along: `read` collapses a range cell to its midpoint so the
 * garment path and the monotonicity check keep working on one number — and that
 * midpoint used to be all that survived. A body chart then had its range REBUILT
 * from midpoints by `midpointBand`, a derivation replacing numbers the retailer
 * had printed. The stated range is always the better source; it is kept here and
 * `foldByLabel` prefers it.
 */
type GridSize = ExtractedSize & {
  ranges?: { chestCm?: [number, number]; waistCm?: [number, number]; hipCm?: [number, number] };
};

/** Fields whose stated ranges are kept — those a body chart publishes as ranges. */
const RANGED_FIELDS = new Set(["chestCm", "waistCm", "hipCm"]);

function sizesFromGrid(grid: string[][]): { sizes: GridSize[]; ranged: boolean } | null {
  if (grid.length < 2) return null;

  let numericCells = 0;
  let rangedCells = 0;
  // First number in a cell; a range collapses to its midpoint, and is counted —
  // and its endpoints are kept alongside (see GridSize), not thrown away.
  const read = (cell: string): { v: number; range?: [number, number] } | null => {
    const { values, range } = cellNumbers(cell);
    if (values.length === 0) return null;
    numericCells++;
    if (range) {
      rangedCells++;
      const lo = Math.min(values[0], values[1]);
      const hi = Math.max(values[0], values[1]);
      return { v: (lo + hi) / 2, range: [lo, hi] };
    }
    return { v: values[0] };
  };
  const put = (size: GridSize, f: keyof ExtractedSize, r: { v: number; range?: [number, number] }) => {
    (size as Record<string, unknown>)[f] = r.v;
    if (r.range && RANGED_FIELDS.has(f)) {
      size.ranges = { ...size.ranges, [f]: r.range };
    }
  };

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

  const sizes: GridSize[] = [];

  if (scoreB >= scoreA) {
    // sizes as rows
    const fields = header.map(fieldFor); // fields[col], fields[0] is the label col
    for (const row of grid.slice(1)) {
      const label = (row[0] ?? "").trim();
      if (!looksLikeSizeLabel(label)) continue;
      const size: GridSize = { label: label.toUpperCase() };
      let any = false;
      for (let c = 1; c < row.length; c++) {
        const f = fields[c];
        if (!f) continue;
        const n = read(row[c]);
        if (n != null) {
          put(size, f, n);
          any = true;
        }
      }
      if (any) sizes.push(size);
    }
  } else {
    // sizes as columns
    const labels = header.map((c) => c.trim());
    // seed a size object per column that holds a size label
    const cols: Array<{ idx: number; size: GridSize }> = [];
    for (let c = 1; c < labels.length; c++) {
      if (looksLikeSizeLabel(labels[c])) cols.push({ idx: c, size: { label: labels[c].toUpperCase() } });
    }
    for (const row of grid.slice(1)) {
      const f = fieldFor(row[0] ?? "");
      if (!f) continue;
      for (const { idx, size } of cols) {
        const n = read(row[idx] ?? "");
        if (n != null) put(size, f, n);
      }
    }
    for (const { size } of cols) {
      if (size.chestCm || size.waistCm || size.shoulderCm || size.sleeveCm || size.lengthCm) {
        sizes.push(size);
      }
    }
  }

  if (sizes.length < 2) return null; // one row is not a chart
  return { sizes: inchesToCm(sizes), ranged: numericCells > 0 && rangedCells / numericCells >= 0.5 };
}

/**
 * A bigger size is never smaller. If the chest (or, lacking one, the waist) falls
 * as the sizes rise, the chart was misread — the Uniqlo misread produced XS 40.6 ·
 * S 47 · M 50.8 · L 108 · XL 115.6 · XXL 61 · 3XL 64.8 and nothing noticed — so
 * the table is refused rather than served. Monotonicity is the sanity check the
 * size-recommendation literature uses (docs/design/fit-algorithm-research.md §3).
 *
 * Sizes are put in ladder order when every label is on the alpha ladder, so a
 * chart printed largest-first is not mistaken for a falling one; otherwise the
 * table's own order is used. A centimetre of slack absorbs rounding.
 */
function risesWithSize(sizes: ExtractedSize[]): boolean {
  const rows = sizes
    .map((s, i) => ({ v: s.chestCm ?? s.waistCm, k: alphaIndex(normalizeToAlpha(s.label)), i }))
    .filter((r): r is { v: number; k: number | null; i: number } => typeof r.v === "number");
  if (rows.length < 3) return true;
  const ordered = rows.every((r) => r.k != null)
    ? [...rows].sort((a, b) => a.k! - b.k! || a.i - b.i)
    : rows;
  for (let j = 1; j < ordered.length; j++) {
    if (ordered[j].v < ordered[j - 1].v - 1) return false;
  }
  return true;
}

/** Find the best size-chart table on the page, if any. */
/**
 * Does the page say its chart describes the WEARER or the GARMENT?
 *
 * These are different claims and the engine consumes them through different
 * fields (invariant ㊿). Read as a garment chest, a body measurement gets the
 * wearer's preferred ease added on top of a number that already IS the wearer,
 * and every size from that page comes out about one step too big — measured:
 * patagonia.com's own chart recommended XL to a 100cm chest.
 *
 * Deliberately conservative. Retailers that mean "body" usually say so outright,
 * and so do the ones that mean "flat". Anything else returns null, which leaves
 * the long-standing garment reading in place rather than silently re-interpreting
 * every page we have ever parsed — but the caller then LABELS it as unstated
 * instead of asserting a kind it does not know.
 *
 * "How to measure yourself" is deliberately NOT a body signal: it appears beside
 * flat-measurement charts just as often, because you have to measure yourself
 * either way.
 */
export function detectMeasurementKind(html: string): "body" | "garment" | null {
  const text = stripTags(html).replace(/\s+/g, " ");
  const body = KIND_PATTERNS.body.some((re) => re.test(text));
  const garment = KIND_PATTERNS.garment.some((re) => re.test(text));
  if (body && !garment) return "body";
  if (garment && !body) return "garment";
  return null; // said both, or said neither
}

/**
 * The sentences that say what a chart measures. Exported because the browser
 * extension sends only the sentences these match, not the page around them — so
 * the two lists must be the same list, which extensionCapture.test.ts enforces.
 * Non-global on purpose: `.test` on a /g regex carries state between calls.
 */
export const KIND_PATTERNS: { body: RegExp[]; garment: RegExp[] } = {
  body: [
    /\bbody measurements?\b/i,
    /measurements?\s+(?:below\s+)?(?:are|is)\s+(?:the\s+)?body\b/i,
    // NO \b on the CJK patterns — word boundaries are ASCII-defined and never
    // match at a CJK boundary, so adding one silently disables the whole group.
    // This is invariant ⑫, and it caught this line in review rather than in
    // production only because a test covered the Chinese case.
    /(?:人体|净体)(?:尺寸|测量|围度)/,
  ],
  garment: [
    /\bgarment measurements?\b/i,
    /\b(?:measured|laid|lying)\s+flat\b/i,
    /\bflat measurements?\b/i,
    /\bproduct measurements?\b/i,
    /(?:平铺|衣服)(?:尺寸|测量)/, // no \b — see above
  ],
};

/**
 * Collapse rows that share a size label, and re-home the numbers if the chart
 * describes bodies rather than garments.
 *
 * WHY ROWS REPEAT. A chart that lists alpha and numeric sizes together prints one
 * row per numeric size, so a letter spans several: patagonia.com gives XS twice
 * (36in and 37in), S twice, M twice. Left alone that hands the engine sixteen
 * sizes with eight distinct labels, and the ladder logic has no idea which "M" it
 * is looking at. Merged, those repeats become exactly what a body chart wants —
 * a stated range per letter.
 */
function foldByLabel(sizes: GridSize[], kind: "body" | "garment" | null): ExtractedSize[] {
  const order: string[] = [];
  const groups = new Map<string, GridSize[]>();
  for (const s of sizes) {
    if (!groups.has(s.label)) { groups.set(s.label, []); order.push(s.label); }
    groups.get(s.label)!.push(s);
  }

  const nums = (rows: GridSize[], k: keyof ExtractedSize) =>
    rows.map((r) => r[k]).filter((n): n is number => typeof n === "number");
  const r1 = (n: number) => Math.round(n * 10) / 10;

  // One representative point per label, for the neighbours `midpointBand` reads
  // when a label states only a single value.
  const pointsFor = (key: "chestCm" | "waistCm" | "hipCm") =>
    order.map((label) => {
      const v = nums(groups.get(label)!, key);
      return v.length ? (Math.min(...v) + Math.max(...v)) / 2 : null;
    });
  const points = { chestCm: pointsFor("chestCm"), waistCm: pointsFor("waistCm"), hipCm: pointsFor("hipCm") };

  /**
   * The body range a label covers for one measurement, best source first:
   *   1. what the chart PRINTED — a range in a cell ("37.5–41"), or the same letter
   *      listed on several rows (Patagonia's XS = sizes 0 and 2);
   *   2. only for a single printed value, the band at the midpoints to its
   *      neighbours — the reading such a chart is written for.
   * Before Session 78 a range in a cell reached this point already collapsed to
   * its midpoint, so (2) rebuilt a range the retailer had printed.
   */
  const bodyRange = (rows: GridSize[], key: "chestCm" | "waistCm" | "hipCm", i: number): [number, number] | null => {
    const lows = rows.map((r) => r.ranges?.[key]?.[0] ?? r[key]).filter((n): n is number => typeof n === "number");
    const highs = rows.map((r) => r.ranges?.[key]?.[1] ?? r[key]).filter((n): n is number => typeof n === "number");
    if (!lows.length) return null;
    const lo = Math.min(...lows);
    const hi = Math.max(...highs);
    if (lo !== hi) return [r1(lo), r1(hi)];
    const band = midpointBand(points[key], i);
    return band ? [r1(band[0]), r1(band[1])] : [lo, hi];
  };

  return order.map((label, i) => {
    const rows = groups.get(label)!;
    const out: ExtractedSize = { label };

    for (const k of ["shoulderCm", "sleeveCm", "lengthCm"] as const) {
      const v = nums(rows, k);
      // Repeats of a secondary measurement average; they differ by a size step at
      // most, and none of them is the binding dimension.
      if (v.length) out[k] = r1(v.reduce((a, b) => a + b, 0) / v.length);
    }

    if (kind === "body") {
      // A body chart's waist is the waist a size is cut FOR. It used to stay in the
      // garment `waistCm`, which is why waist could not reach the engine at all:
      // passing it would have added the wearer's ease on top of their own waist
      // (invariant ㊿, one column over). It now lands where chest already did.
      const w = bodyRange(rows, "waistCm", i);
      if (w) { out.bodyWaistMinCm = w[0]; out.bodyWaistMaxCm = w[1]; }
      const h = bodyRange(rows, "hipCm", i);
      if (h) { out.bodyHipMinCm = h[0]; out.bodyHipMaxCm = h[1]; }
      const c = bodyRange(rows, "chestCm", i);
      if (c) { out.bodyChestMinCm = c[0]; out.bodyChestMaxCm = c[1]; }
      return out;
    }

    // Garment (or unstated — the long-standing reading, invariant (57)).
    const waists = nums(rows, "waistCm");
    if (waists.length) out.waistCm = r1(waists.reduce((a, b) => a + b, 0) / waists.length);
    const hips = nums(rows, "hipCm");
    if (hips.length) out.hipCm = r1(hips.reduce((a, b) => a + b, 0) / hips.length);
    const chests = nums(rows, "chestCm");
    if (chests.length) out.chestCm = r1((Math.min(...chests) + Math.max(...chests)) / 2);
    return out;
  });
}

type Kind = "body" | "garment";
/** Whose word a chart's body-or-garment reading rests on. */
export type KindSource = "page" | "table" | "brand";

/**
 * What a chart's numbers measure, and on whose word — strongest first:
 *   1. the page says they are BODY measurements          → body, "page"
 *   2. the table gives a RANGE for each size             → body, "table"
 *   3. the page says they are GARMENT measurements       → garment, "page"
 *   4. the brand's own published guide states its habit  → that, "brand"
 *   5. nothing says                                       → null (read as garment, labelled unstated)
 *
 * Why the table's shape outranks the page's "garment": a garment has ONE chest
 * measurement, and a range per size is how a chart says who the size is for.
 * The page's word is read off the WHOLE page, and on uniqlo.com it was site
 * chrome — "Compare all product measurements with previous purchases" — beside a
 * body chart in ranges. Read as garment, the engine added ease on top of body
 * numbers and answered a size too big. The shape can only ever argue for body; a
 * one-value-per-size chart is left to the page and the brand, as before.
 */
export function resolveMeasurementKind(
  stated: Kind | null,
  fallback: Kind | null | undefined,
  ranged: boolean,
): { kind: Kind | null; from: KindSource | null } {
  if (stated === "body") return { kind: "body", from: "page" };
  if (ranged) return { kind: "body", from: "table" };
  if (stated) return { kind: stated, from: "page" };
  if (fallback) return { kind: fallback, from: "brand" };
  return { kind: null, from: null };
}

/**
 * Find the best size-chart table on the page, and settle what it measures.
 *
 * Prefers the chart that yields the most sizes (usually THE size chart), among
 * those whose numbers rise with the sizes — a falling ladder was misread and is
 * refused (`risesWithSize`). `kindFallback` is the brand's published convention,
 * used only when neither the page nor the table's shape says.
 */
/**
 * Route sizes that some OTHER reader produced — the LLM reading page text, or a
 * vision read of a chart image — through the same body/garment rule as a table.
 *
 * Until Session 78 the LLM path decided the measurement kind by itself, by which
 * fields it chose to fill, and nothing checked it against what the page said: a
 * body chart read by the model into `chestCm` would get ease added on top of the
 * wearer's own chest (invariant ㊿), and the page-level "body measurements"
 * sentence that settles it on the table path was never consulted. Now one
 * resolver decides (`resolveMeasurementKind`) and one fold applies it.
 */
export function applyMeasurementKind(
  sizes: ExtractedSize[],
  html: string,
  kindFallback?: Kind | null,
): { sizes: ExtractedSize[]; kind: Kind | null; kindFrom: KindSource | null } {
  const rows: GridSize[] = sizes.map((s) => {
    const row: GridSize = { ...s };
    if (s.bodyChestMinCm != null && s.bodyChestMaxCm != null) {
      row.chestCm = s.chestCm ?? (s.bodyChestMinCm + s.bodyChestMaxCm) / 2;
      row.ranges = { ...row.ranges, chestCm: [s.bodyChestMinCm, s.bodyChestMaxCm] };
    }
    if (s.bodyWaistMinCm != null && s.bodyWaistMaxCm != null) {
      row.waistCm = s.waistCm ?? (s.bodyWaistMinCm + s.bodyWaistMaxCm) / 2;
      row.ranges = { ...row.ranges, waistCm: [s.bodyWaistMinCm, s.bodyWaistMaxCm] };
    }
    if (s.bodyHipMinCm != null && s.bodyHipMaxCm != null) {
      row.hipCm = s.hipCm ?? (s.bodyHipMinCm + s.bodyHipMaxCm) / 2;
      row.ranges = { ...row.ranges, hipCm: [s.bodyHipMinCm, s.bodyHipMaxCm] };
    }
    delete row.bodyChestMinCm; delete row.bodyChestMaxCm;
    delete row.bodyWaistMinCm; delete row.bodyWaistMaxCm;
    delete row.bodyHipMinCm; delete row.bodyHipMaxCm;
    return row;
  });
  const ranged = rows.length > 0 && rows.filter((r) => r.ranges?.chestCm).length / rows.length >= 0.5;
  const { kind, from } = resolveMeasurementKind(detectMeasurementKind(html), kindFallback, ranged);
  return { sizes: foldByLabel(rows, kind), kind, kindFrom: from };
}

export function parseSizeChart(
  html: string,
  kindFallback?: Kind | null,
): { sizes: ExtractedSize[]; kind: Kind | null; kindFrom: KindSource | null } | null {
  // Which tables were on screen, when the capture says. A tabbed size guide keeps
  // several charts in the DOM with all but one hidden (men's and women's, tops and
  // bottoms), and "the table with the most rows" used to win regardless — so a
  // hidden chart could beat the one the shopper was looking at. The extension
  // marks each table it keeps (`capture.js`, VISIBLE_ATTR); a server-fetched page
  // carries no marks, and then nothing changes.
  const visibleRe = new RegExp(`<section[^>]*${VISIBLE_CHART_ATTR}="([01])"[^>]*>([\\s\\S]*?)<\\/section>`, "gi");
  const marked: Array<{ table: string; visible: boolean }> = [];
  for (const m of html.matchAll(visibleRe)) {
    for (const t of m[2].match(/<table[\s\S]*?<\/table>/gi) ?? []) marked.push({ table: t, visible: m[1] === "1" });
  }
  const candidates = marked.length
    ? marked
    : (html.match(/<table[\s\S]*?<\/table>/gi) ?? []).map((table) => ({ table, visible: false }));
  const anyVisible = marked.some((c) => c.visible);

  let best: { sizes: GridSize[]; ranged: boolean; visible: boolean } | null = null;
  for (const c of candidates) {
    const chart = sizesFromGrid(tableGrid(c.table));
    if (!chart || !risesWithSize(chart.sizes)) continue;
    const entry = { ...chart, visible: c.visible };
    const better =
      !best ||
      // A visible chart beats any hidden one; only then do rows decide.
      (anyVisible && entry.visible && !best.visible) ||
      (entry.visible === best.visible && entry.sizes.length > best.sizes.length);
    if (better) best = entry;
  }
  if (!best) return null;
  const { kind, from } = resolveMeasurementKind(detectMeasurementKind(html), kindFallback, best.ranged);
  return { sizes: foldByLabel(best.sizes, kind), kind, kindFrom: from };
}

/** The sizes of the best chart on the page, or null. See `parseSizeChart`. */
export function parseSizeTables(html: string, kindFallback?: Kind | null): ExtractedSize[] | null {
  return parseSizeChart(html, kindFallback)?.sizes ?? null;
}

// ---------------------------------------------------------------------------
// 5. Offered size LABELS (when there's no measurement chart)
// ---------------------------------------------------------------------------

// Many pages don't put a size *chart* in the initial HTML, but they DO list the
// offered sizes in a <select>/<option> or a variant list. Those labels alone are
// still worth a lot: the closet-anchor, outcome, and brand-bias signals all work
// on labels, so ranking the REAL offered sizes beats a synthesized ladder.

const NON_SIZE_OPTION = /^(select|choose|size|please|请选择|选择|尺码|--|—)$/i;

/** Which <select> holds sizes — tested against the whole <select> markup. Shared
 *  with the browser extension, which sends only the selects this matches. */
export const SIZE_SELECT_RE = /size|尺码|规格/i;

/** Extract plausible size labels from <select>/<option> and common variant attrs. */
export function parseSizeLabels(html: string): string[] {
  const labels = new Set<string>();

  // <option> values inside any <select> that looks size-related.
  const selects = html.match(/<select[\s\S]*?<\/select>/gi) ?? [];
  for (const sel of selects) {
    const isSizeSelect = SIZE_SELECT_RE.test(sel);
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
// 5b. Chinese 号型 (hào xíng) size codes — e.g. "160/84A"
// ---------------------------------------------------------------------------

// Chinese national sizing (GB/T) labels a garment by BODY dimensions, not S/M/L:
//   号 (before the slash) = height in cm
//   型 (after the slash)  = a key girth in cm — BUST for tops, WAIST for bottoms
//   letter               = body type by chest−waist drop: Y / A(standard) / B / C
// So "160/84A" = a 160 cm person, 84 cm bust, standard build. This hands us real
// BODY measurements per label for free — far better than guessing from S/M/L.
// (Source: docs/design/china-sizing-research.md.)
export type ChineseSizeCode = {
  heightCm: number;
  girthCm: number; // bust for tops, waist for bottoms (caller decides by category)
  bodyType: "Y" | "A" | "B" | "C" | null;
};

export function parseChineseSizeCode(label: string): ChineseSizeCode | null {
  const m = label.trim().match(/^(\d{2,3})\s*\/\s*(\d{2,3})\s*([YABC])?$/i);
  if (!m) return null;
  const heightCm = Number(m[1]);
  const girthCm = Number(m[2]);
  // Sanity ranges so a random "160/84" that isn't a size code doesn't slip through
  // with nonsense: adult height ~140–200, girth ~50–130.
  if (heightCm < 140 || heightCm > 210 || girthCm < 50 || girthCm > 140) return null;
  const letter = m[3]?.toUpperCase();
  return {
    heightCm,
    girthCm,
    bodyType: letter === "Y" || letter === "A" || letter === "B" || letter === "C" ? letter : null,
  };
}

// ---------------------------------------------------------------------------
// 5c. Size-chart IMAGES — Chinese PDPs (and many others) render the chart as a
//     picture, so we locate candidate chart images for a vision pass upstream.
// ---------------------------------------------------------------------------

// Tokens that mark an <img> as (probably) the size chart, EN + CN. Ordered by
// strength so the most chart-specific candidates rank first.
export const CHART_IMG_TOKENS = [
  "size-chart", "sizechart", "size_chart", "size chart", "size-guide", "sizeguide", "size guide", "size-table",
  "尺码表", "尺寸表", "尺码", "尺寸", "measurement", "measurements", "规格",
];

/**
 * Candidate size-chart image URLs on a page, best-first, resolved to absolute.
 * Pure and testable. Looks at src / data-src / data-original / alt / class / id.
 * `baseUrl` is the product URL, used to resolve relative and protocol-relative
 * srcs. Returns [] when nothing looks like a chart.
 */
export function findSizeChartImages(html: string, baseUrl: string): string[] {
  const imgs = html.match(/<img\b[^>]*>/gi) ?? [];
  const scored: Array<{ url: string; score: number }> = [];
  const seen = new Set<string>();

  for (const tag of imgs) {
    const hay = tag.toLowerCase();
    let score = 0;
    for (let i = 0; i < CHART_IMG_TOKENS.length; i++) {
      if (hay.includes(CHART_IMG_TOKENS[i])) score += CHART_IMG_TOKENS.length - i;
    }
    if (score === 0) continue;
    // Prefer a real (often lazy-loaded) source over a 1px placeholder in src.
    const src =
      /data-src=["']([^"']+)["']/i.exec(tag)?.[1] ??
      /data-original=["']([^"']+)["']/i.exec(tag)?.[1] ??
      /\bsrc=["']([^"']+)["']/i.exec(tag)?.[1];
    if (!src || /^data:/i.test(src)) continue;
    let abs: string;
    try {
      abs = new URL(src, baseUrl).toString();
    } catch {
      continue;
    }
    if (seen.has(abs)) continue;
    seen.add(abs);
    scored.push({ url: abs, score });
  }

  return scored.sort((a, b) => b.score - a.score).map((s) => s.url);
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
    /captcha|are you a robot|verify you are (?:a )?human|access denied|request unsuccessful|enable javascript to continue|hang tight! routing to checkout|botfailover|error page \| ebay/;
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
/**
 * `kindFallback` answers "body or garment?" when the page itself does not say.
 *
 * Measured on patagonia.com: their size-GUIDE page states "find your exact size
 * using the body measurements below", but the size-chart modal on a PRODUCT page
 * states nothing at all — no "body", no "garment", no "measured flat". The signal
 * is real and simply not present on every page of the same site.
 *
 * So the caller may pass what the brand's own published guide said, which is a
 * sourced fact about that brand's convention rather than a guess. What transfers
 * is the CONVENTION, never the numbers: Patagonia's modal chart is a different
 * chart from its guide chart, and only the page's own rows are ever used.
 */
export function parsePage(html: string, kindFallback?: "body" | "garment"): ParsedPage {
  const ld = productFromJsonLd(html);
  const og = openGraph(html);
  const text = stripTags(html).slice(0, 20_000);

  const h1 = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
  const headline = h1 ? stripTags(h1[1]).replace(/\s+/g, " ").trim().slice(0, 200) || undefined : undefined;
  // The last resort for a name: the <title>, without a marketplace appended.
  const titleTag = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  const titleName = titleTag ? cleanTitle(decodeEntities(stripTags(titleTag[1])).replace(/\s+/g, " ")).slice(0, 200) || undefined : undefined;
  const attrs = productAttrs(html);
  const attr = (...keys: string[]) => {
    for (const k of keys) {
      const v = attrs.get(k);
      if (v && !EMPTY_ATTR.test(v) && !/^其他材质/.test(v)) return v;
    }
    return undefined;
  };

  const productName = ld.productName || og.productName || headline || titleName;
  const merged: ParsedPage = {
    // The page's own 品牌 outranks og:site_name, which on a marketplace names the
    // marketplace, not the brand.
    brand: ld.brand || attr("品牌") || og.brand,
    productName,
    headline,
    category: ld.category,
    material: ld.material || attr("材质成分", "面料", "成分含量", "材质"),
    fitNotes: og.fitNotes,
    gender:
      genderFromAttr(attr("适用性别", "性别", "适用对象")) ??
      inferGender(`${ld.productName ?? ""} ${og.productName ?? ""} ${productName ?? ""} ${text}`),
  };

  const chart = parseSizeChart(html, kindFallback);
  if (chart && chart.sizes.length >= 2) {
    merged.sizes = chart.sizes;
    if (chart.kind) {
      merged.measurementKind = chart.kind;
      merged.measurementKindFrom = chart.kindFrom ?? undefined;
    }
  }

  // Drop empty keys so callers can `??`-merge cleanly.
  (Object.keys(merged) as (keyof ParsedPage)[]).forEach((k) => merged[k] === undefined && delete merged[k]);
  return merged;
}
