# Extension 0.9.3: say "no longer available" in the popup

**Found Session 103x (Everlane).** The website now says plainly when a page reports the product as gone
(`source.productUnavailable`, from `pageParse.saysUnavailable` or schema.org `Discontinued`), and when a
brand's general guide stands in for a chart the page did not have (`source.noPageChart`).

The extension path cannot see the first: `capture.js` sends the title, headline, JSON-LD and size options,
not the page's prose, so "Sorry, this item is no longer available" never reaches the server (the Everlane
capture is 3.9 KB with no such text).

## Do (one release)

1. `capture.js`: keep one short status sentence when the page says the product is gone (same patterns as
   `saysUnavailable`), as its own field; no other prose.
2. Server: read that field into `source.productUnavailable`.
3. `popup.js` `provenance()`: add the unavailable line, and for `noPageChart` say it is an estimate.
4. Bump to 0.9.3 everywhere (`manifest.json`, `capture.js`, `config.js`, `extensionDistribution.ts`), repack
   (`node scripts/pack-extension.mjs`), upload to the Chrome Web Store.
