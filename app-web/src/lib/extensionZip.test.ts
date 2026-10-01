// The download on /extension must be the extension in `browser-extension/`,
// byte for byte. The zip is committed (Vercel builds with app-web/ as its root and
// reads nothing outside it), so without this test it would silently lag every
// change to capture.js — the failure mode the logo drift test exists for (㉚).
import { describe, it, expect } from "vitest";
import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { buildExtensionZip, extensionFiles, extensionVersion, zipFileName, EXT_DIR, OUT_DIR } from "../../scripts/pack-extension.mjs";
import { EXTENSION_DISTRIBUTION, EXTENSION_ID } from "./extensionDistribution";

describe("the extension download", () => {
  it("is exactly what the source would pack today", () => {
    const committed = readFileSync(join(OUT_DIR, zipFileName()));
    const fresh: Buffer = buildExtensionZip();
    expect(
      Buffer.compare(committed, fresh),
      "public/downloads zip is stale — run `node scripts/pack-extension.mjs` in app-web/",
    ).toBe(0);
  });

  it("links to the file that exists, at the manifest's version", () => {
    const v = extensionVersion();
    expect(EXTENSION_DISTRIBUTION.version).toBe(v);
    if (EXTENSION_DISTRIBUTION.kind === "zip") {
      expect(EXTENSION_DISTRIBUTION.href).toBe(`/downloads/${zipFileName(v)}`);
      const kb = statSync(join(OUT_DIR, zipFileName(v))).size / 1024;
      expect(Math.abs(EXTENSION_DISTRIBUTION.sizeKb - kb)).toBeLessThan(2);
    }
  });

  it("agrees with the version the extension reports about itself", () => {
    const config = readFileSync(join(EXT_DIR, "config.js"), "utf8");
    expect(config).toContain(`version: "${extensionVersion()}"`);
    // capture.js stamps every capture with its own copy; it stayed at 0.3.0 through
    // 0.4.0 and 0.5.0, so saved captures named the wrong extension (Session 80f).
    const capture = readFileSync(join(EXT_DIR, "capture.js"), "utf8");
    expect(capture).toContain(`var VERSION = "${extensionVersion()}";`);
  });

  it("ships the extension and not our measurement tooling", () => {
    const files: string[] = extensionFiles();
    expect(files).toContain("manifest.json");
    expect(files).toContain("capture.js");
    expect(files.some((f) => f.startsWith("scripts/"))).toBe(false);
  });

  it("is pinned to the ID the manifest key produces", () => {
    const manifest = JSON.parse(readFileSync(join(EXT_DIR, "manifest.json"), "utf8"));
    expect(typeof manifest.key).toBe("string");
    expect(EXTENSION_ID).toMatch(/^[a-p]{32}$/);
  });
});
