// Pack `browser-extension/` into the zip the website offers for download.
//
// DETERMINISTIC ON PURPOSE. Same files in → same bytes out: entries sorted, every
// timestamp fixed, no compression (the whole extension is ~57 KB, so deflate would
// save little and cost a dependency). That is what lets `extensionZip.test.ts`
// rebuild the zip in memory and compare it byte for byte with the committed one —
// so the download can never quietly lag behind the source, the failure mode the
// logo drift test (invariant ㉚) exists for.
//
// Why a committed file rather than a build step: Vercel builds with `app-web/` as
// the root, and nothing at build time reads outside it. A zip made at build time
// from `../browser-extension` would depend on a Vercel setting nobody has checked.
//
// Usage (from app-web/):  node scripts/pack-extension.mjs           the website download
//                          node scripts/pack-extension.mjs --store   the Chrome Web Store upload
// No dependencies — a zip "store" archive is a simple format.

import { readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
export const EXT_DIR = join(HERE, "..", "..", "browser-extension");
export const OUT_DIR = join(HERE, "..", "public", "downloads");

/** What ships to users. `scripts/` is measurement tooling for us, not them. */
const EXCLUDE_DIRS = new Set(["scripts"]);

/** 1980-01-01 00:00 in DOS time — the earliest a zip can express, and fixed. */
const DOS_TIME = 0;
const DOS_DATE = (0 << 9) | (1 << 5) | 1;

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/** Every shipped file under the extension directory, as sorted POSIX paths. */
export function extensionFiles(dir = EXT_DIR) {
  const out = [];
  const walk = (d) => {
    for (const name of readdirSync(d).sort()) {
      if (name.startsWith(".")) continue;
      const full = join(d, name);
      if (statSync(full).isDirectory()) {
        if (!EXCLUDE_DIRS.has(name)) walk(full);
      } else {
        out.push(relative(dir, full).split(sep).join("/"));
      }
    }
  };
  walk(dir);
  return out.sort();
}

/** The extension's version, which must agree across manifest and config. */
export function extensionVersion(dir = EXT_DIR) {
  return JSON.parse(readFileSync(join(dir, "manifest.json"), "utf8")).version;
}

/** Text files ship with LF endings. A Windows checkout with core.autocrlf holds
 *  them as CRLF, and packing those bytes gave a different zip on every such
 *  machine — the committed download looked stale on a clean clone. */
const TEXT_EXT = /\.(js|json|html|css|md|txt)$/i;
function shippedBytes(path, data) {
  if (!TEXT_EXT.test(path)) return data;
  return Buffer.from(data.toString("utf8").replace(/\r\n/g, "\n"), "utf8");
}

/** The Chrome Web Store package differs from the download in two files only:
 *  - manifest.json without `key` — the store refuses an upload that carries one
 *    and assigns the item its own ID — and without the localhost host permission;
 *  - config.js without the development origin, so the popup has one server, and
 *    without `captureTool` — "Save this capture" is our evaluation tool.
 *  The server does not check the extension's ID, so the new one needs no change. */
export const DEV_ORIGIN = "http://localhost:3000";
function storeBytes(path, data) {
  if (path === "manifest.json") {
    const m = JSON.parse(data.toString("utf8"));
    delete m.key;
    m.host_permissions = m.host_permissions.filter((h) => !h.startsWith(DEV_ORIGIN));
    return Buffer.from(JSON.stringify(m, null, 2) + "\n", "utf8");
  }
  if (path === "config.js") {
    const lines = data.toString("utf8").split("\n");
    return Buffer.from(lines.filter((l) => !l.includes(`url: "${DEV_ORIGIN}"`) && !/^\s*captureTool: true,/.test(l)).join("\n"), "utf8");
  }
  return data;
}

/** Build the archive in memory. Pure: same directory contents → same bytes. */
export function buildExtensionZip(dir = EXT_DIR, { store = false } = {}) {
  const locals = [];
  const centrals = [];
  let offset = 0;

  for (const path of extensionFiles(dir)) {
    const shipped = shippedBytes(path, readFileSync(join(dir, path)));
    const data = store ? storeBytes(path, shipped) : shipped;
    const name = Buffer.from(path, "utf8");
    const crc = crc32(data);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0); // local file header
    local.writeUInt16LE(20, 4); // version needed
    local.writeUInt16LE(0x0800, 6); // flags: UTF-8 names
    local.writeUInt16LE(0, 8); // method: store
    local.writeUInt16LE(DOS_TIME, 10);
    local.writeUInt16LE(DOS_DATE, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);
    locals.push(local, name, data);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0); // central directory header
    central.writeUInt16LE(20, 4); // version made by
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(DOS_TIME, 12);
    central.writeUInt16LE(DOS_DATE, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt16LE(0, 30); // extra
    central.writeUInt16LE(0, 32); // comment
    central.writeUInt16LE(0, 34); // disk
    central.writeUInt16LE(0, 36); // internal attrs
    central.writeUInt32LE(0, 38); // external attrs
    central.writeUInt32LE(offset, 42);
    centrals.push(central, name);

    offset += 30 + name.length + data.length;
  }

  const centralBuf = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); // end of central directory
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  const count = centrals.length / 2;
  end.writeUInt16LE(count, 8);
  end.writeUInt16LE(count, 10);
  end.writeUInt32LE(centralBuf.length, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);

  return Buffer.concat([...locals, centralBuf, end]);
}

export function zipFileName(version = extensionVersion()) {
  return `fit-passport-extension-${version}.zip`;
}

/** Where the store package goes: not committed — it is uploaded by hand. */
export const STORE_DIR = join(HERE, "..", "store-build");

// Run directly: write the file the site links to, or with --store the package
// for the Chrome Web Store.
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const store = process.argv.includes("--store");
  const zip = buildExtensionZip(EXT_DIR, { store });
  const dir = store ? STORE_DIR : OUT_DIR;
  mkdirSync(dir, { recursive: true });
  const out = join(dir, store ? zipFileName().replace(/.zip$/, "-store.zip") : zipFileName());
  writeFileSync(out, zip);
  console.log(`wrote ${relative(process.cwd(), out)} — ${extensionFiles().length} files, ${(zip.length / 1024).toFixed(1)} KB`);
}
