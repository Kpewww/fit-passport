# Curated brand size charts — why, what's measured, and how to add one

> **Status: BUILT (Session 72, 2026-09-08).** `app-web/src/lib/brandCharts.ts`
> holds the library; one brand (Nike men's tops) is captured. This document is
> the reasoning and the recipe for adding the rest.

## 1. The problem it replaces

A recognised brand's "size chart" used to be **two invented numbers**. In
`extractor.ts`, `BRAND_TABLE` gave each of thirteen brands a `chestBaseCm` and a
`stepCm`, and `buildSizes()` extrapolated them linearly:

```ts
chestCm:    base + (i - 2) * step
shoulderCm: 42 + i * 1.5     // identical for all thirteen brands
sleeveCm:   20 + i           // identical for all thirteen brands
lengthCm:   68 + i * 2       // identical for all thirteen brands
```

Running that arithmetic for Patagonia + a jacket gives **XS 106 · S 111 · M 116 ·
L 121 · XL 126** — the exact five numbers that were being shown to users for a
site we cannot even read, and the reason invariant ㊼ now refuses to serve them.

Refusing was the right emergency fix. It left the real problem in place: we had
nothing true to say about the brands people actually shop.

## 2. What we measured about who blocks us

Measured 2026-09-08 with a plain client, following redirects, no header spoofing:

| Brand | Status | Bytes | Reading |
|---|---|---|---|
| **Nike** (`/size-fit/mens_tops_alpha`) | **200** | — | readable, and `robots.txt` says "just crawl it" |
| **J.Crew** (`/r/size-charts`) | 200 | 1.09 MB | page loads, but its numbers come from `*/sizecharts-module/`, which its **robots.txt disallows** |
| **Gap** | 200 | 838 KB | body is an error page; no chart |
| **Patagonia** | 404 | **10** | the bare `Not found\n` gate signature from Session 70 |
| **Uniqlo** | — | 0 | connection fails even on the homepage |
| **COS** | 403 | 426 | blocked |
| **Adidas** | 403 | 3.4 KB | blocked |
| **H&M**, **Zara** | 403 | ~0.4 KB | blocked |

Two conclusions. **The gate that blocks a product page usually blocks the size
guide too** — Patagonia returns the same 10-byte 404 on both. And **being
readable is not the same as being permitted**: J.Crew serves the page and
disallows the data.

## 3. Why this is not the scraping the project rejected

`fetch-strategy.md` §2 rejects defeating technical access controls, because the
defensible posture is *public factual data, respect technical access controls*.
Nothing here defeats anything:

- **`capturedBy: "fetch"`** means the page answered a plain request **and**
  robots.txt permits the path. Nike qualifies. J.Crew was deliberately excluded.
- **`capturedBy: "manual"`** means a person opened the page in their own browser
  and typed the numbers in. That is the only route for a gated brand, and it is a
  person using a website exactly as intended.

Measurements are facts, and facts are not copyrightable (*Feist v. Rural*, 499
U.S. 340). ⚠️ **Two caveats a lawyer should confirm before the library grows:**
the *arrangement* of a chart can carry a thin compilation copyright, and a site's
terms of service may say more than its robots.txt. The safe form — the one the
code enforces — is to store **the numbers** and never a copy of anyone's table
markup or page layout.

**Third-party size-chart aggregators are not an acceptable source.** They are
someone else's compilation (the one input shape with a real copyright question
attached), they are frequently stale, and they remove the thing that makes a
curated chart trustworthy: a link to the brand's own page saying the same numbers.
A test enforces that every chart's `sourceUrl` is on the brand's own domain.

## 4. Body charts and garment charts are different claims

Most US brands publish **body ranges**: "size L fits a chest of 104–112cm". That
is `kind: "body"`, it answers *who is this size for*, and it feeds
`bodyChestMinCm/MaxCm`, which `fitEngine.ts` already scores as range membership.

A **garment chart** gives the flat measurements of the thing itself. That feeds
`chestCm`.

Putting a body number in the garment field would make every recommendation from
that brand wrong by roughly a full size, in the same direction — which reads as a
tuning problem rather than a bug. `brandCharts.test.ts` pins the separation.

**A body chart cannot feed the personal ease target.** `personalEase.ts` learns
`garment − body`, so it needs a garment side. Curating body charts improves the
*recommendation* and does nothing for the *ease learning*. Worth knowing before
anyone expects one to fix the other.

Japanese brands (Uniqlo, MUJI) publish flat garment measurements **per product**
rather than per brand, so they may never fit the one-chart-per-brand shape at all.

## 5. Where it sits in the layering

```
fixture  >  page  >  brand-chart  >  estimated  >  refuse
```

- **Above `estimated`** because these are numbers the brand published.
- **Below `page`** because a brand chart is not product-specific: it cannot know
  which sizes this item is offered in, and it cannot know that this style is the
  brand's slim cut rather than its relaxed one.

`extractFromUrl` returns the chart with `derived: true`, so `extractSmart` still
fetches and a real on-page chart still wins. When the page listed its offered
sizes but held no chart, the two are **merged**: the page's labels (what you can
buy) carry the chart's measurements (how big each one is).

Confidence is capped at **0.75** for `brand-chart` (against 0.5 for `estimated`).
The residual uncertainty is about the garment, which no amount of body data on our
side can resolve, so it is a ceiling rather than a penalty.

## 6. How to add a brand

1. Open the brand's size guide **in a browser**. Find the men's/women's chart for
   the garment domain you want (`top` or `bottom`).
2. Decide `kind`: does the page say these are **body** measurements ("fits chest
   38–41″") or the **garment's** flat measurements? Nike states it outright. If
   the page does not say, do not guess — leave the brand out.
3. Add an entry to `BRAND_CHARTS` in `app-web/src/lib/brandCharts.ts`, typing the
   numbers **exactly as printed**, with `units` set to what the page shows. Do not
   convert by hand; `chartToSizes` converts and a test pins the conversion.
4. Record `sourceUrl` (the page you just read), `capturedAt` (today), and
   `capturedBy` (`"manual"` unless the page answered a plain request *and* its
   robots.txt permits the path).
5. Run `npm test`. The library's own tests check provenance, the brand-domain
   rule, and the body/garment separation.

**The gated brands need route 4-manual**, and that includes Patagonia — the case
that started this. Nobody can automate it, and that is the point.

## 7. Open

- **Staleness.** Every chart carries `capturedAt` and the UI shows it, but nothing
  re-checks. A brand that revises its chart leaves us confidently wrong with a
  date attached. A periodic re-read of the `capturedBy: "fetch"` charts would
  catch those; the manual ones cannot be checked without a person.
- **Fit lines.** Patagonia publishes Regular and Slim; Nike publishes one chart
  per garment domain. The current shape has one chart per brand × domain × gender
  and no notion of a line, so a slim-cut style gets the regular numbers.
- **`BRAND_TABLE` still exists** and still holds its invented constants for the
  twelve brands with no curated chart. It should go once enough charts are real —
  keeping a fabricated floor under two honest layers is how the Patagonia ladder
  happened.
