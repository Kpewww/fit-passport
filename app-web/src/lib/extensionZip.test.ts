// The download on /extension must be the extension in `browser-extension/`,
// byte for byte. The zip is committed (Vercel builds with app-web/ as its root and
// reads nothing outside it), so without this test it would silently lag every
// change to capture.js — the failure mode the logo drift test exists for (㉚).
import { describe, it, expect } from "vitest";
import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { buildExtensionZip, extensionFiles, extensionVersion, zipFileName, EXT_DIR, OUT_DIR, DEV_ORIGIN } from "../../scripts/pack-extension.mjs";
import { EXTENSION_DISTRIBUTION, EXTENSION_ID, EXTENSION_ZIP, STORE_EXTENSION_ID, STORE_URL } from "./extensionDistribution";

/** Read a stored (uncompressed) zip back into name → text. */
function unzip(zip: Buffer): Map<string, string> {
  const out = new Map<string, string>();
  let p = 0;
  while (zip.readUInt32LE(p) === 0x04034b50) {
    const size = zip.readUInt32LE(p + 18);
    const nameLen = zip.readUInt16LE(p + 26);
    const extra = zip.readUInt16LE(p + 28);
    const name = zip.subarray(p + 30, p + 30 + nameLen).toString("utf8");
    const start = p + 30 + nameLen + extra;
    out.set(name, zip.subarray(start, start + size).toString("latin1"));
    p = start + size;
  }
  return out;
}

describe("the extension download", () => {
  it("is exactly what the source would pack today", () => {
    const committed = readFileSync(join(OUT_DIR, zipFileName()));
    const fresh: Buffer = buildExtensionZip();
    expect(
      Buffer.compare(committed, fresh),
      "public/downloads zip is stale — run `node scripts/pack-extension.mjs` in app-web/",
    ).toBe(0);
  });

  it("offers the backup zip at the manifest's version, and the file exists", () => {
    const v = extensionVersion();
    expect(EXTENSION_ZIP.version).toBe(v);
    expect(EXTENSION_ZIP.href).toBe(`/downloads/${zipFileName(v)}`);
    const kb = statSync(join(OUT_DIR, zipFileName(v))).size / 1024;
    expect(Math.abs(EXTENSION_ZIP.sizeKb - kb)).toBeLessThan(2);
  });

  it("leads with the Chrome Web Store listing (Session 85)", () => {
    expect(STORE_EXTENSION_ID).toMatch(/^[a-p]{32}$/);
    expect(EXTENSION_DISTRIBUTION).toEqual({ kind: "store", href: STORE_URL });
    expect(STORE_URL).toBe(`https://chromewebstore.google.com/detail/fit-passport/${STORE_EXTENSION_ID}`);
  });

  it("agrees with the version the extension reports about itself", () => {
    const config = readFileSync(join(EXT_DIR, "config.js"), "utf8");
    expect(config).toContain(`version: "${extensionVersion()}"`);
    // capture.js stamps every capture with its own copy; it stayed at 0.3.0 through
    // 0.4.0 and 0.5.0, so saved captures named the wrong extension (Session 80f).
    const capture = readFileSync(join(EXT_DIR, "capture.js"), "utf8");
    expect(capture).toContain(`var VERSION = "${extensionVersion()}";`);
  });

  it("makes a Chrome Web Store package without the key and the development server (Session 82)", () => {
    // The store refuses a manifest with `key` and assigns its own ID; a localhost
    // permission has no business in a published extension.
    const files = unzip(buildExtensionZip(EXT_DIR, { store: true }));
    const manifest = JSON.parse(files.get("manifest.json")!);
    expect(manifest.key).toBeUndefined();
    expect(manifest.host_permissions).toEqual(["https://www.fitpassport.fit/*"]);
    expect(manifest.version).toBe(extensionVersion());
    expect(files.get("config.js")).not.toContain(DEV_ORIGIN);
    expect(files.get("config.js")).not.toContain("captureTool");
    expect(files.get("config.js")).toContain('url: "https://www.fitpassport.fit"');
    // Every other file is exactly the download's.
    const download = unzip(buildExtensionZip());
    expect([...files.keys()]).toEqual([...download.keys()]);
    for (const [name, body] of files) {
      if (name !== "manifest.json" && name !== "config.js") expect(body, name).toBe(download.get(name));
    }
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
