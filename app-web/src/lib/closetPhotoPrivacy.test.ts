// Closet photos are the owner's alone — Session 88c.
//
// A closet photo may be a screenshot of a shop's product picture (photoFrom
// "shop", from the extension), which we must never show anyone but the person who
// took it. Today no route but the owner's own closet returns any closet photo; this
// keeps it that way: a server file that names `imageDataUrl` must be on the list
// below, and the public routes must never pull a closet row whole (`knownGood: true`
// or a find with no `select` returns every column, photo included).

import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const SRC = join(dirname(fileURLToPath(import.meta.url)), "..");
const files = (d: string): string[] =>
  readdirSync(d).flatMap((f) => {
    const p = join(d, f);
    return statSync(p).isDirectory() ? files(p) : /\.tsx?$/.test(f) && !/\.test\./.test(f) ? [p] : [];
  });

// The owner's closet route, the input schema it validates with, and the to-buy
// list's own product photos (none today). Add a file here only for an owner-only path.
const MAY_NAME_PHOTO = new Set(["app/api/closet/route.ts", "lib/closetItemInput.ts"]);

const PUBLIC = ["app/api/view", "app/api/community", "app/api/leaderboard", "app/api/posts", "app/api/answers", "app/api/outfits", "lib/evidence.ts"];

describe("closet photos stay with their owner", () => {
  const server = [...files(join(SRC, "app", "api")), ...files(join(SRC, "lib"))];

  it("are named only by the owner's closet route", () => {
    const naming = server.filter((f) => readFileSync(f, "utf8").includes("imageDataUrl")).map((f) => relative(SRC, f));
    expect(naming.filter((f) => !MAY_NAME_PHOTO.has(f))).toEqual([]);
  });

  it("are never pulled whole into a public route", () => {
    const publicFiles = server.filter((f) => PUBLIC.some((p) => relative(SRC, f).startsWith(p)));
    expect(publicFiles.length).toBeGreaterThan(5);
    // `_count: { select: { knownGood: true } }` is a number, not a row.
    const rowsPulled = (src: string) => /knownGood(?:Item)?\s*:\s*true/.test(src.replace(/_count:\s*\{\s*select:\s*\{[^}]*\}\s*\}/g, ""));
    const whole = publicFiles.filter((f) => rowsPulled(readFileSync(f, "utf8"))).map((f) => relative(SRC, f));
    expect(whole).toEqual([]);
  });
});
