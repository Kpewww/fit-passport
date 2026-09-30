// Where the browser extension is offered. ONE place, so moving to the Chrome Web
// Store is one edit: replace this constant with `{ kind: "store", href: <listing> }`
// and every page that offers the extension follows.
//
// Until then it is a zip on our own site, loaded unpacked in Developer mode. That
// is a real hurdle for a shopper, so every page that offers the zip also says, in
// one line, why it is not in the store yet — rather than making it look like the
// finished install path.
//
// `extensionZip.test.ts` pins the version and file name here against the manifest
// and against the committed zip, so the link can never point at a stale package.

export type ExtensionDistribution =
  | {
      kind: "zip";
      href: string;
      version: string;
      /** Rounded, for the button — measured from the committed file by a test. */
      sizeKb: number;
    }
  | { kind: "store"; href: string; version: string };

export const EXTENSION_DISTRIBUTION: ExtensionDistribution = {
  kind: "zip",
  href: "/downloads/fit-passport-extension-0.3.0.zip",
  version: "0.3.0",
  sizeKb: 80,
};

/** The pinned extension ID (from the manifest `key`) — the same for every install. */
export const EXTENSION_ID = "odbdhmcfjbhikmlfmgafbkkbknkkaecp";
