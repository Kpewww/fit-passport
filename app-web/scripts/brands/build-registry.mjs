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

async function candidateQids() {
  const sets = [];
  for (const k of Object.keys(CLASSES)) {
    sets.push(await cached(`class-${k}.json`, () => sparqlQids(`SELECT DISTINCT ?b WHERE { ?b wdt:P31/wdt:P279* wd:${k} }`)));
  }
  for (const k of Object.keys(INDUSTRIES)) {
    sets.push(await cached(`industry-${k}.json`, () => sparqlQids(`SELECT DISTINCT ?b WHERE { ?b wdt:P452 wd:${k} }`)));
  }
  for (const k of Object.keys(PRODUCTS)) {
    sets.push(await cached(`product-${k}.json`, () => sparqlQids(`SELECT DISTINCT ?b WHERE { ?b wdt:P1056/wdt:P279* wd:${k} }`)));
  }
  sets.push(await cached("nsi.json", async () => {
    const out = [];
    for (const f of NSI_FILES) {
      const r = await fetch(`https://raw.githubusercontent.com/osmlab/name-suggestion-index/main/data/brands/shop/${f}.json`);
      if (!r.ok) continue;
      for (const i of (await r.json()).items ?? []) if (i.tags?.["brand:wikidata"]) out.push(i.tags["brand:wikidata"]);
    }
    return [...new Set(out)];
  }));
  return [...new Set(sets.flat())].filter((q) => /^Q\d+$/.test(q));
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
  for (const e of Object.values(ents)) if (!claimIds(e, "P495").length && !claimIds(e, "P17").length) claimIds(e, "P159").forEach((h) => hq.add(h));
  const hqEnts = await entities([...hq], "claims");

  // Country items → ISO 3166-1 alpha-2 (P297).
  const countryQ = new Set();
  const countryOf = (e) => claimIds(e, "P495")[0] ?? claimIds(e, "P17")[0] ?? claimIds(hqEnts[claimIds(e, "P159")[0]] ?? {}, "P17")[0];
  for (const e of Object.values(ents)) { const c = countryOf(e); if (c) countryQ.add(c); }
  const cEnts = await entities([...countryQ], "claims");
  const iso = (q) => claimStr(cEnts[q] ?? {}, "P297")[0];

  const rows = [];
  for (const [q, e] of Object.entries(ents)) {
    if (!e || e.missing !== undefined) continue;
    if (claimIds(e, "P31").includes("Q5")) continue; // a person, not a brand
    const country = iso(countryOf(e));
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
    sources: ["Wikidata (CC0) https://www.wikidata.org", "OpenStreetMap name-suggestion-index (BSD-3-Clause) https://github.com/osmlab/name-suggestion-index"],
    count: rows.length,
    brands: rows,
  }) + "\n");
  console.log(`wrote ${rows.length} brands to ${OUT}`);
  console.log(Object.entries(byCountry).sort((a, b) => b[1] - a[1]).slice(0, 25).map(([c, n]) => `${c} ${n}`).join(", "));
}

main().catch((e) => { console.error(e); process.exit(1); });
