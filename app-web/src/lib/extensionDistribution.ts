// Where the browser extension is offered. ONE place: every page that offers the
// extension reads this.
//
// Since 2026-10-05 the extension is in the Chrome Web Store, and that is the way
// in: "Add to Chrome" goes straight to the listing, and Chrome keeps it updated.
// The zip of `browser-extension/` stays as a backup for anyone who cannot use the
// store (a managed browser, another Chromium browser) — offered on /help only.
//
// `extensionZip.test.ts` pins the zip's version and file name against the
// manifest and the committed file, so the backup link can never point at a stale
// package. The store's version is whatever Google last approved; the page does
// not print it.

export type ExtensionDistribution =
  | { kind: "store"; href: string }
  | { kind: "zip"; href: string; version: string; sizeKb: number };

/** The listing, by the item ID Google assigned. */
export const STORE_EXTENSION_ID = "ciecejomnniicliemefagfegkmgfkgfe";
export const STORE_URL = `https://chromewebstore.google.com/detail/fit-passport/${STORE_EXTENSION_ID}`;

export const EXTENSION_DISTRIBUTION: ExtensionDistribution = { kind: "store", href: STORE_URL };

/** The backup: the same extension as a zip, loaded unpacked in Developer mode. */
export const EXTENSION_ZIP = {
  href: "/downloads/fit-passport-extension-0.9.1.zip",
  version: "0.9.1",
  /** Rounded, for the button — measured from the committed file by a test. */
  sizeKb: 139,
};

/** The ID an unpacked (zip) install gets — pinned by the manifest `key`. The
 *  store install has its own (STORE_EXTENSION_ID); the server checks neither. */
export const EXTENSION_ID = "odbdhmcfjbhikmlfmgafbkkbknkkaecp";
