#!/usr/bin/env node
// Builds src/lib/data/brandRegistry.json: the clothing and footwear brands Fit Passport
// knows by name, each with the country its sizes are read by (Session 101).
//
// Every brand is a Wikidata item, so every row carries a checkable QID (evidence
// grade C, docs/design/size-regimes-sources.md). Where the brands come from:
//   1. Wikidata (CC0): items that ARE a fashion label / fashion house / clothing
//      brand / clothing store chain; items whose industry (P452) is a clothing,
//      fashion, footwear, sportswear or luxury-goods industry; items whose product
//      (P1056) is clothing or footwear.
//   2. OpenStreetMap's name-suggestion-index (BSD-3-Clause), the brands of clothes,
//      shoes, sports, accessories and department-store shops: only their
//      brand:wikidata QIDs are taken, and each is then read from Wikidata like the rest.
//   3. Wikipedia categories of clothing, fashion, sportswear and shoe brands and
//      clothing companies, in English, Chinese, Japanese and Korean (Session 101b:
//      Wikidata alone held 74 Chinese, 110 Japanese and 44 Korean brands). Only the
//      member articles' Wikidata QIDs are taken; each is then read from Wikidata.
//      Categories drift (a brand category holds its founder), so a category member
//      must not be a person, and must have a country, like every other row.
// The country is the item's country of origin (P495), else country (P17), else the
// country of its headquarters (P159 → P17). No country, no row: a regime cannot be
// guessed for it.
//
//   node scripts/brands/build-registry.mjs            # uses the cache in .brand-cache/
//   node scripts/brands/build-registry.mjs --refresh  # asks Wikidata again
//
// Wikidata asks for a descriptive User-Agent; this one names the site, nothing else.

import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const CACHE = join(ROOT, ".brand-cache");
const OUT = join(ROOT, "src/lib/data/brandRegistry.json");
const UA = "FitPassportBrandRegistry/1.0 (https://www.fitpassport.fit)";
const REFRESH = process.argv.includes("--refresh");
mkdirSync(CACHE, { recursive: true });

const NSI_FILES = ["clothes", "shoes", "sports", "fashion_accessories", "department_store"];

// Classes and industries, each checked by label on Wikidata (2026-10-21).
const CLASSES = {
  Q1618899: "fashion label", Q1941779: "fashion house", Q133459332: "clothing brand",
  Q76213285: "clothing store chain",
};
const INDUSTRIES = {
  Q11828862: "clothing industry", Q12684: "fashion", Q107601662: "textile and clothing industry",
  Q5915560: "footwear industry", Q645292: "sportswear", Q3231404: "fast fashion",
  Q29583: "fashion design", Q161928: "footwear", Q949715: "luxury good",
  Q97616144: "fashion retail industry", Q29584460: "manufacture of footwear",
  Q29585599: "retail sale of clothing in specialised stores", Q1065579: "fashion accessory",
  Q22676: "shoe", Q11460: "clothing",
};
const PRODUCTS = { Q11460: "clothing", Q22676: "shoe" };
// Trade and textile classifications (NACE-style, mostly from company-register
// imports): real houses (Valentino, Christian Dior Couture, Yohji Yamamoto Inc.) sit
// beside small wholesalers and mills, so a member is kept only with a Wikipedia
// article or an official website (P856), i.e. a brand the public can look up.
const TRADE = {
  Q112165695: "wholesale trade of clothing and footwear",
  Q112165649: "intermediaries in the trade of textiles, clothing, furs, footwear and leather goods",
  Q29585516: "wholesale of clothing and footwear",
  Q607081: "textile industry",
};

// Wikipedia category roots, crawled DEPTH levels down (names checked on each wiki,
// 2026-10-21).
const CATEGORIES = [
  ["en", "Category:Clothing brands"], ["en", "Category:Clothing companies by country"],
  ["en", "Category:Sportswear brands"], ["en", "Category:Shoe brands"],
  // Not "Luxury brands": sampled 2026-10-21, its tree is mostly cars, hotels and watches.
  ["en", "Category:Clothing retailers by country"],
  ["en", "Category:Fashion labels"], ["en", "Category:Underwear brands"], ["en", "Category:Jeans by brand"],
  ["zh", "Category:中国服装品牌"], ["zh", "Category:服裝品牌"], ["zh", "Category:服裝公司"],
  ["zh", "Category:服裝零售商"], ["zh", "Category:香港時裝品牌"], ["zh", "Category:運動用品製造商"],
  ["ja", "Category:ファッションブランド"], ["ja", "Category:日本のファッションブランド"],
  ["ja", "Category:日本の衣料品店"],
  ["ko", "분류:대한민국의 패션 브랜드"], ["ko", "분류:패션 브랜드"], ["ko", "분류:의류 기업"],
  ["ko", "분류:의류 소매업체"], ["ko", "분류:스포츠 의류 브랜드"], ["ko", "분류:스포츠 용품 제조 기업"],
];
const DEPTH = 3;

// A category whose name states a country gives that country to members that have none
// in Wikidata (marked `from: "category"` in the row). Matched on the category title.
const CATEGORY_COUNTRY = [
  [/日本|Japan/i, "JP"], [/대한민국|한국|South Korea|Korean/i, "KR"], [/香港|Hong Kong/i, "HK"],
  [/台灣|臺灣|Taiwan/i, "TW"], [/中国|中國|China|Chinese/i, "CN"], [/United States|American|美國|美国|미국/i, "US"],
  [/United Kingdom|British|English|英國|英国|영국/i, "GB"], [/Ital|義大利|意大利|이탈리아/i, "IT"],
  [/France|French|法國|法国|프랑스/i, "FR"], [/German|德國|德国|독일/i, "DE"], [/Spain|Spanish|西班牙|스페인/i, "ES"],
  [/Australia|澳大利亞|澳洲|오스트레일리아/i, "AU"], [/Canad|加拿大|캐나다/i, "CA"], [/Swed|瑞典/i, "SE"],
  [/Denmark|Danish|丹麥|덴마크/i, "DK"], [/Netherlands|Dutch/i, "NL"], [/Switzerland|Swiss|瑞士|스위스/i, "CH"],
  [/India/i, "IN"], [/Turkey|Turkish/i, "TR"], [/Brazil/i, "BR"], [/Belgi/i, "BE"], [/Finland|Finnish/i, "FI"],
  [/Norw/i, "NO"], [/Poland|Polish/i, "PL"], [/Portug/i, "PT"], [/Austria/i, "AT"], [/Ireland|Irish/i, "IE"],
  [/New Zealand/i, "NZ"], [/Mexic/i, "MX"], [/Israel/i, "IL"], [/South Africa/i, "ZA"], [/Russia/i, "RU"],
  [/Greece|Greek|그리스/i, "GR"], [/Thai/i, "TH"], [/Philippin/i, "PH"], [/Indonesia/i, "ID"], [/Vietnam/i, "VN"],
];
const categoryCountry = new Map(); // QID -> ISO, from the category it was found in

// A category member whose class or industry is plainly not clothing is dropped
// (sampled 2026-10-21: hotels, champagne houses, jewellers and perfumers sit in
// fashion categories). Matched on the English labels of its P31 and P452 values.
const NON_FASHION = /hotel|resort|wine|champagne|beverage|brewer|distill|food|restaurant|cosmetic|perfum|fragrance|jewel|diamond|watchmak|automo|motor|vehicle|bicycle|real estate|bank|insurance|airline|television|film|music|band|event|incident|building|museum|school|university|award|competition|tournament|magazine|newspaper|software|video game|toy|furniture|eyewear|electronic|technology|semiconductor|computer|printing|mining|petroleum|chemical|pharmac/i;

//   4. Wikidata items whose own description says what they are (descriptions are
//      CC0 data like the rest), in the languages the pilot shops in.
const DESCRIPTIONS = [
  "clothing brand", "fashion brand", "fashion label", "clothing company", "clothing manufacturer",
  "clothing retailer", "sportswear brand", "sportswear company", "footwear brand", "footwear company",
  "shoe company", "shoe brand", "fashion house", "streetwear brand", "lingerie brand", "underwear brand",
  "swimwear brand", "denim brand", "outdoor clothing", "knitwear brand", "apparel company", "apparel brand",
  "服装品牌", "服装公司", "服饰品牌", "時裝品牌", "服裝品牌", "运动品牌",
  "ファッションブランド", "アパレル", "衣料品メーカー", "アパレルメーカー",
  "패션 브랜드", "의류 브랜드", "의류 기업", "패션 기업",
  "marque de vêtements", "maison de couture", "marque de mode", "Modemarke", "Bekleidungshersteller",
  "marchio di abbigliamento", "casa di moda", "marca de ropa",
];
// Subcategories never followed: they hold people, places and works, not brands.
const SKIP_CAT = /eyewear|jewel|cosmetic|perfume|fragrance|watch|toy|food|bicycle|car |automo|people|designers|founders|executives|models|stubs|images|templates|logos|stores in|buildings|songs|albums|films|人物|設計師|设计师|デザイナー|人物|디자이너|인물/i;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function cached(name, fn) {
  const f = join(CACHE, name);
  if (!REFRESH && existsSync(f)) return JSON.parse(readFileSync(f, "utf8"));
  const v = await fn();
  writeFileSync(f, JSON.stringify(v));
  return v;
}

async function sparqlQids(query) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const r = await fetch("https://query.wikidata.org/sparql?query=" + encodeURIComponent(query), {
      headers: { Accept: "application/sparql-results+json", "User-Agent": UA },
    });
    if (r.ok) {
      const j = await r.json();
      return [...new Set(j.results.bindings.map((b) => b.b.value.split("/").pop()))];
    }
    await sleep(5000 * (attempt + 1));
  }
  throw new Error("SPARQL failed: " + query.slice(0, 80));
}

// A category member is kept only if Wikidata calls it a business or a brand (P31,
// checked by label 2026-10-21), and, when it states an industry, a fashion one.
const ORG_CLASSES = new Set([
  "Q4830453", "Q6881511", "Q783794", "Q431289", "Q1618899", "Q1941779", "Q133459332", "Q891723",
  "Q5621421", "Q658255", "Q507619", "Q76213285", "Q167270", "Q43229", "Q4382945", "Q13235160",
  "Q726870", "Q134161", "Q216107", "Q1589009", "Q2659904", "Q163740", "Q18388277",
]);
let categoryOnly = new Set();
const suspect = new Set(); // members checked for a plainly non-clothing class or industry
const descQids = [];
const tradeOnly = new Set();

async function candidateQids() {
  const sets = [];
  const fromData = [];
  for (const k of Object.keys(CLASSES)) {
    sets.push(await cached(`class-${k}.json`, () => sparqlQids(`SELECT DISTINCT ?b WHERE { ?b wdt:P31/wdt:P279* wd:${k} }`)));
  }
  for (const k of Object.keys(INDUSTRIES)) {
    sets.push(await cached(`industry-${k}.json`, () => sparqlQids(`SELECT DISTINCT ?b WHERE { ?b wdt:P452 wd:${k} }`)));
  }
  const productSets = [];
  for (const k of Object.keys(PRODUCTS)) {
    productSets.push(await cached(`product-${k}.json`, () => sparqlQids(`SELECT DISTINCT ?b WHERE { ?b wdt:P1056/wdt:P279* wd:${k} }`)));
  }
  for (const set of sets) fromData.push(...set);
  // Making one clothing product does not make a clothing brand (Apple Inc. makes a
  // watch band): product-only members are checked like category members.
  const productOnly = productSets.flat().filter((q) => !fromData.includes(q));
  sets.push(...productSets);
  for (const k of Object.keys(TRADE)) {
    const t = await cached(`trade-${k}.json`, () => sparqlQids(`SELECT DISTINCT ?b WHERE { ?b wdt:P452 wd:${k} . { ?b wdt:P856 ?site } UNION { ?a schema:about ?b ; schema:isPartOf ?w . FILTER(CONTAINS(STR(?w), "wikipedia.org")) } }`));
    sets.push(t);
    t.forEach((q) => tradeOnly.add(q));
  }
  for (const phrase of DESCRIPTIONS) {
    const d = await cached(`desc-${phrase.replace(/[^\p{L}\p{N}]+/gu, "_")}.json`, () => descriptionQids(phrase));
    sets.push(d);
    descQids.push(...d);
  }
  const catSets = [];
  for (const [wiki, root] of CATEGORIES) {
    const got = await cached(`cat2-${wiki}-${root.replace(/[^\p{L}\p{N}]+/gu, "_")}.json`, () => categoryQids(wiki, root));
    catSets.push(got.qids);
    for (const [q, c] of got.hints) if (!categoryCountry.has(q)) categoryCountry.set(q, c);
  }
  sets.push(...catSets);
  const nsi = await cached("nsi.json", async () => {
    const out = [];
    for (const f of NSI_FILES) {
      const r = await fetch(`https://raw.githubusercontent.com/osmlab/name-suggestion-index/main/data/brands/shop/${f}.json`);
      if (!r.ok) continue;
      for (const i of (await r.json()).items ?? []) if (i.tags?.["brand:wikidata"]) out.push(i.tags["brand:wikidata"]);
    }
    return [...new Set(out)];
  });
  sets.push(nsi);
  const trusted = new Set([...fromData, ...nsi, ...descQids]);
  for (const q of trusted) tradeOnly.delete(q);
  categoryOnly = new Set(catSets.flat().filter((q) => !trusted.has(q)));
  for (const q of productOnly) if (!nsi.includes(q) && !descQids.includes(q)) suspect.add(q);
  for (const q of tradeOnly) suspect.add(q);
  for (const q of categoryOnly) suspect.add(q);
  return [...new Set(sets.flat())].filter((q) => /^Q\d+$/.test(q));
}

async function wikiApi(wiki, params) {
  const u = new URL(`https://${wiki}.wikipedia.org/w/api.php`);
  for (const [k, v] of Object.entries({ format: "json", formatversion: "2", ...params })) u.searchParams.set(k, v);
  for (let attempt = 0; attempt < 6; attempt++) {
    await sleep(250); // one request at a time, paced: the API's etiquette
    const r = await fetch(u, { headers: { "User-Agent": UA } });
    if (r.ok) return r.json();
    await sleep(Number(r.headers.get("retry-after") ?? 0) * 1000 || 5000 * (attempt + 1));
  }
  throw new Error("wiki api failed " + u);
}

/** Wikidata items whose text matches a phrase (Wikidata's own search, paged). */
async function descriptionQids(phrase) {
  const out = new Set();
  for (let offset = 0; offset < 5000; offset += 500) {
    let j;
    for (let attempt = 0; attempt < 6; attempt++) {
      await sleep(300);
      const r = await fetch(`https://www.wikidata.org/w/api.php?action=query&list=search&format=json&srlimit=500&sroffset=${offset}&srsearch=${encodeURIComponent(`"${phrase}"`)}`, { headers: { "User-Agent": UA } });
      if (r.ok) { j = await r.json(); break; }
      await sleep(5000 * (attempt + 1));
    }
    if (!j) throw new Error("search failed: " + phrase);
    for (const h of j.query?.search ?? []) if (/^Q\d+$/.test(h.title)) out.add(h.title);
    if (!j.continue) break;
  }
  process.stderr.write(`  "${phrase}": ${out.size}\n`);
  return [...out];
}

/** The Wikidata QIDs of the articles in a category tree, DEPTH levels down. */
async function categoryQids(wiki, root) {
  const seen = new Set([root]);
  let level = [root];
  const qids = new Set();
  const hintsOut = [];
  for (let d = 0; d <= DEPTH && level.length; d++) {
    const next = [];
    for (const cat of level) {
      let cont;
      do {
        const j = await wikiApi(wiki, {
          action: "query", generator: "categorymembers", gcmtitle: cat, gcmtype: "page|subcat",
          gcmlimit: "500", prop: "pageprops", ppprop: "wikibase_item", ...(cont ? { gcmcontinue: cont } : {}),
        });
        for (const p of j.query?.pages ?? []) {
          if (p.ns === 14) {
            if (!seen.has(p.title) && !SKIP_CAT.test(p.title)) { seen.add(p.title); next.push(p.title); }
          } else if (p.ns === 0 && p.pageprops?.wikibase_item) {
            qids.add(p.pageprops.wikibase_item);
            const hint = CATEGORY_COUNTRY.find(([re]) => re.test(cat));
            if (hint) hintsOut.push([p.pageprops.wikibase_item, hint[1]]);
          }
        }
        cont = j.continue?.gcmcontinue;
      } while (cont);
    }
    level = next;
  }
  process.stderr.write(`  ${wiki} ${root}: ${qids.size} articles, ${seen.size} categories\n`);
  return { qids: [...qids], hints: hintsOut };
}

const claimIds = (e, p) => (e.claims?.[p] ?? []).map((c) => c.mainsnak?.datavalue?.value?.id).filter(Boolean);
const claimStr = (e, p) => (e.claims?.[p] ?? []).map((c) => c.mainsnak?.datavalue?.value).filter((v) => typeof v === "string");

async function entities(ids, props = "labels|aliases|claims|sitelinks") {
  const out = {};
  for (let i = 0; i < ids.length; i += 50) {
    const chunk = ids.slice(i, i + 50);
    const name = `ent-${props.length}-${chunk[0]}-${chunk.length}-${chunk[chunk.length - 1]}.json`;
    const got = await cached(name, async () => {
      for (let attempt = 0; attempt < 4; attempt++) {
        const r = await fetch(`https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&props=${props}&ids=${chunk.join("|")}`, { headers: { "User-Agent": UA } });
        if (r.ok) return (await r.json()).entities ?? {};
        await sleep(3000 * (attempt + 1));
      }
      throw new Error("wbgetentities failed");
    });
    Object.assign(out, got);
    if (i % 1000 === 0) process.stderr.write(`  ${i}/${ids.length}\n`);
  }
  return out;
}

const LANGS = ["en", "zh", "zh-hans", "zh-cn", "ja", "ko", "fr", "it", "de", "es"];
const label = (e, l) => e.labels?.[l]?.value;

async function main() {
  const qids = await candidateQids();
  process.stderr.write(`candidates: ${qids.length}\n`);
  const ents = await entities(qids);

  // Headquarters → country, for items with neither P495 nor P17.
  const hq = new Set();
  for (const e of Object.values(ents)) if (!claimIds(e, "P495").length && !claimIds(e, "P17").length) [...claimIds(e, "P159"), ...claimIds(e, "P740")].forEach((h) => hq.add(h));
  const hqEnts = await entities([...hq], "claims");

  // Country items → ISO 3166-1 alpha-2 (P297).
  const countryQ = new Set();
  const countryOf = (e) =>
    claimIds(e, "P495")[0] ?? claimIds(e, "P17")[0] ??
    claimIds(hqEnts[claimIds(e, "P159")[0]] ?? {}, "P17")[0] ??
    claimIds(hqEnts[claimIds(e, "P740")[0]] ?? {}, "P17")[0];
  for (const e of Object.values(ents)) { const c = countryOf(e); if (c) countryQ.add(c); }
  const cEnts = await entities([...countryQ], "claims");
  const iso = (q) => claimStr(cEnts[q] ?? {}, "P297")[0];

  const classIds = new Set();
  for (const q of suspect) for (const c of [...claimIds(ents[q] ?? {}, "P31"), ...claimIds(ents[q] ?? {}, "P452")]) classIds.add(c);
  const classEnts = await entities([...classIds], "labels");
  const nonFashion = (e) => [...claimIds(e, "P31"), ...claimIds(e, "P452")].some((c) => NON_FASHION.test(classEnts[c]?.labels?.en?.value ?? ""));

  const rows = [];
  for (const [q, e] of Object.entries(ents)) {
    if (!e || e.missing !== undefined) continue;
    if (claimIds(e, "P31").includes("Q5")) continue; // a person, not a brand
    if (tradeOnly.has(q) && !claimIds(e, "P31").some((c) => ORG_CLASSES.has(c))) continue;
    if (suspect.has(q) && nonFashion(e) && !claimIds(e, "P452").some((i) => i in INDUSTRIES)) continue;
    if (categoryOnly.has(q)) {
      const p31 = claimIds(e, "P31");
      // An item with no class at all is kept only if it is no list ("list of ...").
      if (p31.length && !p31.some((c) => ORG_CLASSES.has(c)) && !claimIds(e, "P452").some((i) => i in INDUSTRIES)) continue;
      if (nonFashion(e)) continue;
      if (/^(list of|lists? |.*一覧$)/i.test(label(e, "en") ?? label(e, "ja") ?? "")) continue;
    }
    let country = iso(countryOf(e));
    let from;
    if (!country && categoryCountry.has(q)) { country = categoryCountry.get(q); from = "category"; }
    if (!country) continue;
    const name = label(e, "en") ?? LANGS.map((l) => label(e, l)).find(Boolean) ?? Object.values(e.labels ?? {})[0]?.value;
    if (!name || /^Q\d+$/.test(name)) continue;
    const zh = label(e, "zh-hans") ?? label(e, "zh-cn") ?? label(e, "zh");
    const ja = label(e, "ja"), ko = label(e, "ko");
    const aliases = new Set();
    for (const l of LANGS) for (const a of e.aliases?.[l] ?? []) aliases.add(a.value);
    for (const v of [zh, ja, ko]) if (v && v !== name) aliases.add(v);
    aliases.delete(name);
    rows.push({
      q, name, country,
      ...(zh && zh !== name ? { zh } : {}),
      ...(from ? { countryFrom: from } : {}),
      ...(aliases.size ? { aka: [...aliases].filter((a) => a.length <= 60).slice(0, 8) } : {}),
      // How widely the item is known: Wikipedia articles about it. Used to rank
      // autocomplete, never to judge a size.
      w: Object.keys(e.sitelinks ?? {}).filter((s) => s.endsWith("wiki")).length,
    });
  }
  rows.sort((a, b) => b.w - a.w || a.name.localeCompare(b.name));
  const byCountry = {};
  for (const r of rows) byCountry[r.country] = (byCountry[r.country] ?? 0) + 1;
  writeFileSync(OUT, JSON.stringify({
    builtAt: new Date().toISOString().slice(0, 10),
    sources: [
      "Wikidata (CC0) https://www.wikidata.org",
      "OpenStreetMap name-suggestion-index (BSD-3-Clause) https://github.com/osmlab/name-suggestion-index",
      "Wikipedia category membership (en, zh, ja, ko), used only to find Wikidata items",
    ],
    count: rows.length,
    brands: rows,
  }) + "\n");
  console.log(`wrote ${rows.length} brands to ${OUT}`);
  console.log(Object.entries(byCountry).sort((a, b) => b[1] - a[1]).slice(0, 25).map(([c, n]) => `${c} ${n}`).join(", "));
}

main().catch((e) => { console.error(e); process.exit(1); });
