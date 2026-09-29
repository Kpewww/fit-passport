// The registry is only worth something if it is complete and honest. These tests
// make it so: a scoring number cannot exist without a provenance, a provenance
// cannot point at nothing, a "measured" claim must say how much data, and every
// assumed number must be listed publicly in docs/design/scoring-system.md.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import * as R from "./scoringConstants";

const VALUE_EXPORTS = Object.entries(R).filter(
  ([k, v]) => k !== "PROVENANCE" && (typeof v === "number" || (typeof v === "object" && v !== null)),
);

/** Every numeric leaf as a dotted path: "DIMENSIONS.chest.sigmaCm". */
function leaves(): string[] {
  const out: string[] = [];
  const walk = (prefix: string, v: unknown) => {
    if (typeof v === "number") out.push(prefix);
    else if (v && typeof v === "object") for (const [k, c] of Object.entries(v)) walk(`${prefix}.${k}`, c);
  };
  for (const [name, v] of VALUE_EXPORTS) walk(name, v);
  return out;
}

describe("scoringConstants — every number declares where it came from", () => {
  it("has a provenance for every value", () => {
    const missing = leaves().filter((p) => !(p in R.PROVENANCE));
    expect(missing, `values with no provenance: ${missing.join(", ")}`).toEqual([]);
  });

  it("has no provenance for a value that does not exist", () => {
    const all = new Set(leaves());
    const orphans = Object.keys(R.PROVENANCE).filter((k) => !all.has(k));
    expect(orphans, `provenance entries naming nothing: ${orphans.join(", ")}`).toEqual([]);
  });

  it("states how much data every 'measured' value rests on", () => {
    for (const [k, v] of Object.entries(R.PROVENANCE)) {
      if (v.provenance === "measured") expect(v.source, `${k} must state its n`).toMatch(/\bn\s*=\s*\d+/);
    }
  });

  it("names a source for every 'cited' value", () => {
    for (const [k, v] of Object.entries(R.PROVENANCE)) {
      if (v.provenance === "cited") expect(v.source.length, `${k} cites nothing`).toBeGreaterThan(20);
    }
  });

  it("lists every assumed value in the published calibration table", () => {
    // The public list of numbers we have not yet earned. A new assumed constant
    // that is not in the table fails here, so it cannot slip in unannounced.
    const doc = readFileSync(join(process.cwd(), "..", "docs", "design", "scoring-system.md"), "utf8");
    const unlisted = Object.entries(R.PROVENANCE)
      .filter(([, v]) => v.provenance === "assumed")
      .map(([k]) => k)
      .filter((k) => !doc.includes(`\`${k}\``));
    expect(unlisted, `assumed constants missing from scoring-system.md: ${unlisted.join(", ")}`).toEqual([]);
  });

  it("imports nothing, so the client bundle can use it (invariant ㉟)", () => {
    const src = readFileSync(join(process.cwd(), "src", "lib", "scoringConstants.ts"), "utf8");
    expect(src).not.toMatch(/^import /m);
  });
});
