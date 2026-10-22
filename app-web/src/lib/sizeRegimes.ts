// Size regimes: what body a size label is cut for, by the country whose sizes it
// uses, and on what evidence (Session 101).
//
// A closet piece used to be placed on a product's sizes by its LETTER alone, so a
// Japanese XL bought in China stood beside an American XL. Here a label in a known
// regime becomes the BODY chest range it is cut for, and every range carries where it
// came from. A regime with no evidence yet answers null: it is never guessed.
//
// Evidence grades (docs/design/size-regimes-sources.md):
//   A  a national or international standard, by table or clause
//   B  a brand's own published size guide, by address and date read
//   C  a public dataset fact (the brand's country, by Wikidata QID)
// Third-party size-chart sites are never evidence: they disagree with each other (the
// same Gucci IT 48 is chest 101 cm on one and 120 cm on another, 2026-10-21).
//
// Sources read so far (grade A):
//   - GB/T 1335.1-2008 (men) and GB/T 1335.2-2008 (women), 服装号型. §3.2: 型 is the
//     body's chest girth (tops) or waist girth (bottoms), in cm, net body (§4.3).
//     §4.1.3: chest is graded in 4 cm steps, so a 型 covers ±2 cm.
//   - EN 13402-3:2017 (DIN EN 13402-3:2017-12, English translation), Annex A
//     (informative), Table A.24 (men) and Table A.25 (women): the chest/bust RANGE
//     each letter size covers. The annex calls them examples a country or company
//     may adopt (§5.3.1, A.1), so a reason built on them says "European standard
//     example", not "this brand's size".
//
// Sources read in Session 101d (the founder's copies, 2026-10-22; every value was read
// from a rendered page image and checked, since all but KS are scans):
//   - JIS L 4004:2023 Table 16 (men, 範囲表示 by chest): SS..5L. "LL" is the XL rung.
//   - JIS L 4005:2023 Table 15 (women, 範囲表示, height 154-162): SS..6L; Tables 1, 2
//     and 12 (women's 号数 3..21 to a bust; the same bust for every height letter).
//   - KS K 0050:2025 Table 10 (men's number = chest, 80..110) and Table 14-1 (M, L, XL).
//   - KS K 0051:2025 Table 9 (women's number = chest, 75..105) and Table 14-1 (S..XL).
//   - ASTM D6240/D6240M-24a Table 1 (men, chest 34..52 in: the size IS the chest in
//     inches) and ASTM D8077/D8077M-16(2022) Table 2 (big men 46..64, the same rule).
//     Neither defines letter sizes, so a US letter has no grade A meaning.
//   - ASTM D5585-21 Table 2 (Misses 00..20, bust cm), D7878/D7878M-23 (Petite 00P..20P:
//     Table 2 gives the same busts as D5585) and D6960/D6960M-16(2023) Table 2 (Plus
//     14W..40W, bust cm).
//   - BS 3666:1982 Table 1 (UK women's 8..32, bust "from"/"to" in cm).
// A table that gives one value per size (KS numbers, JIS 号数, ASTM) becomes a range
// reaching halfway to its neighbours; a table that gives ranges is used as printed.

export type Regime = "CN" | "JP" | "KR" | "US" | "UK" | "AU" | "IT" | "FR" | "EU";
export type Grade = "A" | "B" | "C";
/** `source` in English, `sourceZh` the same citation in Chinese, for a reason in either. */
export type Evidence = { grade: Grade; source: string; sourceZh: string };
export type BodyRange = { minCm: number; maxCm: number; evidence: Evidence };

/** Members of CEN (EN 13402-3 front matter, 2017), whose letter sizes the EN table describes. */
const CEN = new Set([
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "MK", "FR", "DE", "GR", "HU", "IS", "IE",
  "IT", "LV", "LT", "LU", "MT", "NL", "NO", "PL", "PT", "RO", "RS", "SK", "SI", "ES", "SE", "CH",
  "TR", "GB",
]);

/** The regime a country's brands label by. Unknown countries have none. */
export function regimeForCountry(iso: string | null | undefined): Regime | null {
  if (!iso) return null;
  const c = iso.toUpperCase();
  if (c === "CN" || c === "HK" || c === "TW" || c === "MO") return "CN";
  if (c === "JP") return "JP";
  if (c === "KR") return "KR";
  if (c === "US" || c === "CA") return "US";
  if (c === "GB" || c === "IE") return "UK";
  if (c === "AU" || c === "NZ") return "AU";
  if (c === "IT") return "IT";
  if (c === "FR") return "FR";
  if (CEN.has(c)) return "EU";
  return null;
}

/** A closet piece's `region` field, as typed or chosen ("JP", "EU", "CN"…), as a regime. */
export function regimeFromField(v: string | null | undefined): Regime | null {
  if (!v) return null;
  const s = v.trim().toUpperCase();
  if (["CN", "JP", "KR", "US", "UK", "AU", "IT", "FR", "EU"].includes(s)) return s as Regime;
  if (s === "DE") return "EU";
  return regimeForCountry(s);
}

const EN_SOURCE = (table: "A.24" | "A.25"): Evidence => ({
  grade: "A",
  source: `EN 13402-3:2017, Annex A, Table ${table} (European standard example)`,
  sourceZh: `EN 13402-3:2017 附录 A 表 ${table}（欧洲标准示例）`,
});

// EN 13402-3:2017 Table A.24 (men) and A.25 (women): letter size to chest/bust range, cm.
// Read from the table's "Range" row, 2026-10-21; the two columns under each letter
// give its lower and upper bound.
const EN_MEN: Record<string, [number, number]> = {
  XXS: [70, 78], XS: [78, 86], S: [86, 94], M: [94, 102], L: [102, 110], XL: [110, 118], XXL: [118, 130], "3XL": [130, 142],
};
const EN_WOMEN: Record<string, [number, number]> = {
  XXS: [66, 74], XS: [74, 82], S: [82, 90], M: [90, 98], L: [98, 106], XL: [106, 118], XXL: [118, 130], "3XL": [130, 142],
};

type Table = { ranges: Record<string, [number, number]>; source: string; sourceZh: string };

/** Ranges halfway to each neighbour, for a table that gives one value per size. */
function fromPoints(points: Array<[string, number]>): Record<string, [number, number]> {
  const out: Record<string, [number, number]> = {};
  points.forEach(([k, v], i) => {
    const prev = points[i - 1]?.[1], next = points[i + 1]?.[1];
    const lo = prev != null ? (prev + v) / 2 : v - ((next ?? v) - v) / 2;
    const hi = next != null ? (v + next) / 2 : v + (v - (prev ?? v)) / 2;
    out[k] = [Math.round(lo * 10) / 10, Math.round(hi * 10) / 10];
  });
  return out;
}

const T = (ranges: Record<string, [number, number]>, source: string, sourceZh: string): Table => ({ ranges, source, sourceZh });

// JIS L 4004:2023 Table 16 and JIS L 4005:2023 Table 15 (cm, as printed).
const JIS_MEN = T(
  { SS: [72, 80], S: [80, 88], M: [88, 96], L: [96, 104], LL: [104, 112], "3L": [112, 120], "4L": [120, 128], "5L": [128, 136] },
  "JIS L 4004:2023 Table 16", "JIS L 4004:2023 表 16",
);
const JIS_WOMEN = T(
  { SS: [65, 73], S: [72, 80], M: [79, 87], L: [86, 94], LL: [93, 101], "3L": [100, 108], "4L": [107, 115], "5L": [114, 122], "6L": [121, 129] },
  "JIS L 4005:2023 Table 15", "JIS L 4005:2023 表 15",
);
// JIS L 4005:2023 Tables 1, 2, 12: 号数 to bust (cm).
const JIS_WOMEN_NO = T(
  fromPoints([["3", 74], ["5", 77], ["7", 80], ["9", 83], ["11", 86], ["13", 89], ["15", 92], ["17", 96], ["19", 100], ["21", 104]]),
  "JIS L 4005:2023 Tables 1, 2, 12", "JIS L 4005:2023 表 1、2、12",
);
// KS K 0050:2025 / KS K 0051:2025, Table 14-1 (letters, as printed) and the number
// tables (Table 10 men, Table 9 women: the number is the chest).
const KS_MEN = T({ M: [85, 93], L: [93, 101], XL: [101, 108] }, "KS K 0050:2025 Table 14-1", "KS K 0050:2025 표 14-1");
const KS_WOMEN = T({ S: [72, 82], M: [82, 89], L: [89, 98], XL: [98, 109] }, "KS K 0051:2025 Table 14-1", "KS K 0051:2025 표 14-1");
const KS_MEN_NO = T(fromPoints([80, 85, 90, 95, 100, 105, 110].map((n) => [String(n), n])), "KS K 0050:2025 Table 10", "KS K 0050:2025 표 10");
const KS_WOMEN_NO = T(fromPoints([75, 80, 85, 90, 95, 100, 105].map((n) => [String(n), n])), "KS K 0051:2025 Table 9", "KS K 0051:2025 표 9");
// ASTM D6240-24a Table 1 (34..52) and D8077-16(2022) Table 2 (46..64): chest = size, in inches.
const ASTM_MEN_NO = T(
  fromPoints([34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 48, 50, 52, 54, 56, 58, 60, 62, 64].map((n) => [String(n), n * 2.54])),
  "ASTM D6240/D6240M-24a Table 1; ASTM D8077/D8077M-16(2022) Table 2", "ASTM D6240/D6240M-24a 表 1；ASTM D8077/D8077M-16(2022) 表 2",
);
// ASTM D5585-21 Table 2 (bust, cm); D7878-23 Petite carries the same busts.
const ASTM_MISSES = T(
  fromPoints([["00", 79.06], ["0", 80.65], ["2", 83.82], ["4", 86.68], ["6", 89.54], ["8", 92.08], ["10", 94.62], ["12", 98.43], ["14", 102.55], ["16", 107.0], ["18", 111.76], ["20", 116.84]]),
  "ASTM D5585-21 Table 2", "ASTM D5585-21 表 2",
);
// ASTM D6960/D6960M-16(2023) Table 2 (bust, cm).
const ASTM_PLUS = T(
  fromPoints([["14W", 105.41], ["16W", 109.22], ["18W", 114.3], ["20W", 119.38], ["22W", 124.46], ["24W", 129.54], ["26W", 134.62], ["28W", 139.7], ["30W", 144.78], ["32W", 149.86], ["34W", 154.94], ["36W", 160.02], ["38W", 165.1], ["40W", 170.18]]),
  "ASTM D6960/D6960M-16(2023) Table 2", "ASTM D6960/D6960M-16(2023) 表 2",
);
// BS 3666:1982 Table 1 (bust from/to, cm).
const BS_WOMEN = T(
  { "8": [78, 82], "10": [82, 86], "12": [86, 90], "14": [90, 94], "16": [95, 99], "18": [100, 104], "20": [105, 109], "22": [110, 114], "24": [115, 119], "26": [120, 124], "28": [125, 129], "30": [130, 134], "32": [135, 139] },
  "BS 3666:1982 Table 1", "BS 3666:1982 表 1",
);

function fromTable(t: Table, key: string | null): BodyRange | null {
  if (!key || !(key in t.ranges)) return null;
  const [minCm, maxCm] = t.ranges[key];
  return { minCm, maxCm, evidence: { grade: "A", source: t.source, sourceZh: t.sourceZh } };
}

/** "XL" as a Japanese label writes it ("LL"), and 2XL..5XL as 3L..; null otherwise. */
function jisLetter(s: string): string | null {
  const m: Record<string, string> = { XS: "SS", SS: "SS", S: "S", M: "M", L: "L", XL: "LL", LL: "LL", XXL: "3L", "2XL": "3L", XXXL: "4L", "3XL": "4L", "4XL": "5L", "3L": "3L", "4L": "4L", "5L": "5L", "6L": "6L" };
  return m[s] ?? null;
}

/** Regimes whose letter sizes the EN 13402-3 tables describe. */
const EN_LETTER_REGIMES = new Set<Regime>(["EU", "IT", "FR", "UK"]);

function letterKey(label: string): string | null {
  const s = label.trim().toUpperCase().replace(/\s+/g, "");
  if (s === "XXXL") return "3XL";
  if (s === "2XL") return "XXL";
  return s in EN_MEN ? s : null;
}

/**
 * The body chest range a label is cut for, or null when there is no evidence for it.
 *   - A Chinese 号型 ("175/96A") reads by GB/T 1335 in any regime: it is a body
 *     measurement written on the label.
 *   - A letter size reads by EN 13402-3 for European regimes.
 *   - Japan: JIS L 4004/4005 letters (XL is LL) and women's 号数.
 *   - Korea: KS K 0050/0051 letters and chest numbers.
 *   - US: ASTM chest numbers (men), Misses/Petite/Plus numbers (women). No letters.
 *   - UK women's numbers by BS 3666.
 *   - Anything else (Chinese letters, US letters, Australia, European numbers), null.
 */
export function bodyChestFor(
  label: string,
  regime: Regime | null,
  line: string | null | undefined,
  domain: "top" | "bottom" | string = "top",
): BodyRange | null {
  const code = label.trim().match(/^(\d{3})\s*\/\s*(\d{2,3})\s*([YABC])?$/i);
  if (code && domain === "top") {
    const height = Number(code[1]), girth = Number(code[2]);
    if (height < 140 || height > 210 || girth < 60 || girth > 140) return null;
    return {
      minCm: girth - 2,
      maxCm: girth + 2,
      evidence: {
        grade: "A",
        source: `GB/T 1335.${line === "womens" ? 2 : 1}-2008 §3.2, §4.1.3`,
        sourceZh: `GB/T 1335.${line === "womens" ? 2 : 1}-2008 第 3.2、4.1.3 条`,
      },
    };
  }
  if (!regime || domain !== "top") return null;
  const womens = line === "womens";
  const s = label.trim().toUpperCase().replace(/\s+/g, "");

  if (regime === "JP") {
    const no = s.match(/^(\d{1,2})(?:号|[A-Z]{0,3})$/);
    if (womens && no) return fromTable(JIS_WOMEN_NO, String(Number(no[1])));
    return fromTable(womens ? JIS_WOMEN : JIS_MEN, jisLetter(s));
  }
  if (regime === "KR") {
    if (/^\d{2,3}$/.test(s)) return fromTable(womens ? KS_WOMEN_NO : KS_MEN_NO, s);
    const k = s.replace(/\((P|R|T)\)$/, "");
    return fromTable(womens ? KS_WOMEN : KS_MEN, k);
  }
  if (regime === "US") {
    const w = s.match(/^(\d{2})W$/);
    if (w) return fromTable(ASTM_PLUS, `${w[1]}W`);
    const misses = s.match(/^(00|0|2|4|6|8|10|12|14|16|18|20)P?$/);
    if (womens && misses) return fromTable(ASTM_MISSES, misses[1]);
    const men = s.match(/^(\d{2})(?:[SRL]|S|R|L|T)?$/);
    if (!womens && men) return fromTable(ASTM_MEN_NO, men[1]);
    return null; // ASTM defines no letter sizes
  }
  if (regime === "UK" && womens && /^\d{1,2}$/.test(s)) return fromTable(BS_WOMEN, String(Number(s)));
  if (!EN_LETTER_REGIMES.has(regime)) return null;
  const k = letterKey(label);
  if (!k) return null;
  const [minCm, maxCm] = (womens ? EN_WOMEN : EN_MEN)[k];
  return { minCm, maxCm, evidence: EN_SOURCE(womens ? "A.25" : "A.24") };
}

// Waist, for bottoms (Session 101h). The same tables' waist rows, read from the same
// rendered pages: JIS L 4004 Table 16, JIS L 4005 Table 15, KS K 0050/0051 Table 14-2,
// and the 型 of a bottoms 号型 (GB/T 1335 §3.2: 型 is the waist for bottoms; §4.1.4
// grades waist in 4 or 2 cm, so ±2 cm covers either series).
const JIS_MEN_WAIST = T(
  { SS: [60, 68], S: [68, 76], M: [76, 84], L: [84, 94], LL: [94, 104], "3L": [104, 114], "4L": [114, 124], "5L": [124, 134] },
  "JIS L 4004:2023 Table 16", "JIS L 4004:2023 表 16",
);
const JIS_WOMEN_WAIST = T(
  { SS: [52, 58], S: [58, 64], M: [64, 70], L: [69, 77], LL: [77, 85], "3L": [85, 93], "4L": [93, 101], "5L": [101, 109], "6L": [109, 117] },
  "JIS L 4005:2023 Table 15", "JIS L 4005:2023 表 15",
);
const KS_MEN_WAIST = T({ M: [70, 80], L: [80, 90], XL: [90, 99] }, "KS K 0050:2025 Table 14-2", "KS K 0050:2025 표 14-2");
const KS_WOMEN_WAIST = T({ S: [58, 69], M: [69, 77], L: [77, 88], XL: [88, 101] }, "KS K 0051:2025 Table 14-2", "KS K 0051:2025 표 14-2");

/** The body waist a bottoms label is cut for, or null when no standard says. */
export function bodyWaistFor(label: string, regime: Regime | null, line: string | null | undefined): BodyRange | null {
  const womens = line === "womens";
  const code = label.trim().match(/^(\d{3})\s*\/\s*(\d{2,3})\s*([YABC])?$/i);
  if (code) {
    const height = Number(code[1]), girth = Number(code[2]);
    if (height < 140 || height > 210 || girth < 40 || girth > 140) return null;
    return {
      minCm: girth - 2, maxCm: girth + 2,
      evidence: {
        grade: "A",
        source: `GB/T 1335.${womens ? 2 : 1}-2008 §3.2, §4.1.4`,
        sourceZh: `GB/T 1335.${womens ? 2 : 1}-2008 第 3.2、4.1.4 条`,
      },
    };
  }
  const s = label.trim().toUpperCase().replace(/\s+/g, "");
  if (regime === "JP") return fromTable(womens ? JIS_WOMEN_WAIST : JIS_MEN_WAIST, jisLetter(s));
  if (regime === "KR") return fromTable(womens ? KS_WOMEN_WAIST : KS_MEN_WAIST, s.replace(/\((P|R|T)\)$/, ""));
  return null;
}

// Hip and height (Session 102). Only values the tables print AS RANGES for the size;
// the KS "reference" means and JIS L 4004's "身長（参考）" column are not used.
//   - JIS L 4005:2023 Table 15 (women's letters): hip ranges, as printed.
//   - BS 3666:1982 Table 1 (UK women's 8..32): hips from/to.
//   - Height: the 号 of a 号型 (GB/T 1335 §3.1: 号 is the body height; §4.1.2: graded
//     in 5 cm steps, so ±2.5 cm), and KS K 0050/0051 Table 14-1's height suffixes.
const JIS_WOMEN_HIP = T(
  { SS: [77, 85], S: [82, 90], M: [87, 95], L: [92, 100], LL: [97, 105], "3L": [102, 110], "4L": [107, 115], "5L": [112, 120], "6L": [117, 125] },
  "JIS L 4005:2023 Table 15", "JIS L 4005:2023 表 15",
);
const BS_WOMEN_HIP = T(
  { "8": [83, 87], "10": [87, 91], "12": [91, 95], "14": [95, 99], "16": [100, 104], "18": [105, 109], "20": [110, 114], "22": [115, 119], "24": [120, 124], "26": [125, 129], "28": [130, 134], "30": [135, 139], "32": [140, 144] },
  "BS 3666:1982 Table 1", "BS 3666:1982 表 1",
);

/** The body hip a women's label is cut for, or null. */
export function bodyHipFor(label: string, regime: Regime | null, line: string | null | undefined): BodyRange | null {
  if (line !== "womens") return null;
  const s = label.trim().toUpperCase().replace(/\s+/g, "");
  if (regime === "JP") return fromTable(JIS_WOMEN_HIP, jisLetter(s));
  if (regime === "UK" && /^\d{1,2}$/.test(s)) return fromTable(BS_WOMEN_HIP, String(Number(s)));
  return null;
}

/** The body height a label states: a 号型's 号, or a KS height suffix. Null otherwise. */
export function bodyHeightFor(label: string, regime: Regime | null, line: string | null | undefined): BodyRange | null {
  const womens = line === "womens";
  const code = label.trim().match(/^(\d{3})\s*\/\s*(\d{2,3})\s*([YABC])?$/i);
  if (code) {
    const h = Number(code[1]);
    if (h < 140 || h > 210) return null;
    return {
      minCm: h - 2.5, maxCm: h + 2.5,
      evidence: {
        grade: "A",
        source: `GB/T 1335.${womens ? 2 : 1}-2008 §3.1, §4.1.2`,
        sourceZh: `GB/T 1335.${womens ? 2 : 1}-2008 第 3.1、4.1.2 条`,
      },
    };
  }
  if (regime === "KR") {
    const m = label.trim().toUpperCase().match(/^(S|M|L|XL)\((P|R|T)\)$/);
    if (!m) return null;
    const ranges: Record<string, [number, number]> = womens
      ? { P: [145, 155], R: [155, 165], T: [165, 175] }
      : { R: [157, 170], T: [170, 182] };
    const r = ranges[m[2]];
    if (!r) return null;
    return {
      minCm: r[0], maxCm: r[1],
      evidence: { grade: "A", source: `KS K ${womens ? "0051" : "0050"}:2025 Table 14-1`, sourceZh: `KS K ${womens ? "0051" : "0050"}:2025 표 14-1` },
    };
  }
  return null;
}

export const REGIME_NAME: Record<Regime, { en: string; zh: string }> = {
  CN: { en: "Chinese", zh: "中国" },
  JP: { en: "Japanese", zh: "日本" },
  KR: { en: "Korean", zh: "韩国" },
  US: { en: "US", zh: "美国" },
  UK: { en: "UK", zh: "英国" },
  AU: { en: "Australian", zh: "澳洲" },
  IT: { en: "Italian", zh: "意大利" },
  FR: { en: "French", zh: "法国" },
  EU: { en: "European", zh: "欧洲" },
};
