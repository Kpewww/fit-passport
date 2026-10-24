// AI pictures are never size evidence (Session 104, the plan's first boundary). A cut-out
// or try-on result may be shown and deleted; no file that reasons about size may read one.
import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const SRC = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const files = (d: string): string[] =>
  readdirSync(d).flatMap((f) => {
    const p = join(d, f);
    return statSync(p).isDirectory() ? files(p) : /\.tsx?$/.test(f) && !/\.test\./.test(f) ? [p] : [];
  });

// Where AI pictures may be named: their own module and routes, storage, the closet that shows them,
// and erasing or merging an account.
const ALLOWED = [/^lib\/aiMedia\//, /^app\/api\/ai\//, /^lib\/photoStore\.ts$/, /^lib\/accountDelete\.ts$/, /^lib\/accountMerge\.ts$/,
  /^app\/api\/closet\//, /^app\/closet\//, /^app\/tryon\//, /^app\/account\//];

describe("AI pictures never reach the size engine", () => {
  it("are named only where they are stored, shown or deleted", () => {
    const naming = files(SRC)
      .filter((f) => /\b(cutoutPhoto|mediaJob|aiPhoto|MediaJob|AiPhoto)\b/.test(readFileSync(f, "utf8")))
      .map((f) => relative(SRC, f).split("\\").join("/"));
    expect(naming.filter((f) => !ALLOWED.some((re) => re.test(f)))).toEqual([]);
  });
});
