# Sprint 5 evaluation — browser-assisted extraction

This is how we measure whether reading the product page **in the user's browser**
(the extension) gets better size data than our server can, and whether the answers
built on it are right. It is the evidence behind the Sprint 5 report
(`coursework/technical/deliverables/sprint-5/`), which cites the results here
rather than copying them.

**Principle: Fit Passport never defines its own ground truth.** The expected sizes
and the expected answer come from the retailer's page, read by two people. They are
never produced by our parser.

## The three systems

| | What it is | How it runs here |
|---|---|---|
| **A — server URL path** | What production does with a pasted link: our server fetches the page (plain request, no header spoofing), parses it, falls back to a curated brand chart, and refuses when it has nothing true to say | `extractSmart(url)` with live network (`EVAL_LIVE=1` only — it contacts the retailer) |
| **B — curated chart only** | What we know without reading the page at all: the brand's published size guide in `brandCharts.ts`, or a refusal | `extractFromUrl(url)`, treated as "page not obtained" |
| **S5 — browser-assisted** | The extension: the page as the user sees it, reduced to its product parts by `capture.js`, then the same parser, engine and refusals | `extractSmart(url, { html: capture.html })`, offline and reproducible |

All three share one engine and one refusal policy (`checkPolicy.ts`), fed the same
way (`engineInput.ts`). Any difference between their answers comes from what each
one could read, which is the thing being measured.

## Cases

`cases/<id>.json` — one real product page per file: the URL, the retailer, the
garment, and how to capture it ("open Size Guide → Size Chart tab").

- **Tops are the primary set**: the engine is only complete for tops (chest, waist,
  shoulder, body ranges).
- Bottoms and shoes are included as **refusal and limitation cases**. So are a page
  with no chart and a page that is not a garment at all.
- A page that fails to capture is **kept, not replaced**. Failure is evidence.

## Captures

The extension's own output for each case: what `capture.js` produced on the live
page, in a **fresh, logged-out browser profile**, with the size guide opened when
the case says to. It is made by `browser-extension/scripts/try-pages.mjs --ids …
--save-captures …`, the same code path as the extension.

**Some sites refuse an automated browser even with a real window.** On
2026-09-28, H&M and REI answered "Access Denied" to the Playwright-driven
Chromium, and Patagonia served a "Hang Tight" interstitial it had not served an
hour earlier. A person's own Chrome is not refused. Those cases are captured **by
hand**:
1. Use a clean Chrome profile, not logged in to the retailer.
2. Load the extension unpacked (see `browser-extension/README.md`).
3. Open the product page, and open its size guide if the case says to.
4. Click the extension, open **Show exactly what would be sent**, and press **Save
   this capture (for the evaluation)**.
5. Rename the downloaded file to `<case id>.capture.json` and put it in
   `local/captures/`.

It is byte-for-byte what the extension would have sent.

Where captures live:
- `local/captures/<id>.capture.json` — **git-ignored**, the default.
- `captures/<id>.capture.json` — committed, **only once the founder has decided**
  that reduced captures of retailer pages may live in this repo (open decision #2
  in the Session 75 next-steps). A capture is the allowlisted reduction — product
  parts and measurement tables as text, no page layout, never a logged-in session.

The harness reads the committed copy first, then the local one.

## Ground truth (`truth/<id>.json`)

Typed by **two people, independently**, from the retailer's page in their own
browser. Not from the capture, and never from our output. Where the two disagree,
go back to the page. Record both names in `verifiedBy` and the date in `readOn`.

Start from `truth/_template.json`. What to record:
- **`outcome`** — what an honest system should do with this page: `"answer"` when
  it states a usable chart (or the brand's own guide covers it), `"refuse"` when it
  does not. `refusal` names the code when it is obvious: `unsupported-category`
  for shoes, `not-apparel`, `no-chart-on-page`.
- **`chart.where`** — `page-table` (an HTML table, possibly in a modal),
  `page-image` (the chart is a picture), `separate-page` (a link away from the
  product), or `none`.
- **`chart.kind`** — `body` if the page says body measurements or gives a **range**
  per size ("chest 38–40"); `garment` if it says garment, flat or product
  measurements for the garment itself; `unstated` otherwise. Copy the words that
  decided it into `kindEvidence`.
- **`chart.units`** and **`chart.sizes`** — every size **exactly as printed**, in
  the chart's own units. A range is `chestMin` + `chestMax`; a single value is
  `chest`. If the chart prints a flat width (half the chest), record it as
  `chestFlat`. Do not convert anything.

## Personas and the right answer

`personas.json`: fixed synthetic wearers — three men (chest 92 / 100 / 108 cm), three
women (bust 84 / 92 / 100 cm) — with regular fit and an **empty closet and no
outcomes**. With nothing else to go on, the answer depends on the chart alone, so
the right answer can be derived from the chart.

- **Body charts:** the retailer's own rule — the size whose stated range contains
  the wearer's chest. If the chest falls in a gap between two ranges, both
  neighbours are acceptable.
- **Garment charts:** there is no retailer rule, and using our own ease constants
  would be the engine grading itself. These are **not scored** until an external
  ease reference is chosen and frozen here (open decision #5). Extraction metrics
  still apply to them.

**Adversarial personas** (Session 78f; `scoring-system.md` §9) — an absurd body
(chest 58 / waist 110, and a women's equivalent) and a closet of two measured
garments whose reports cannot both be true. They are **never scored for accuracy**:
there is no right size for a body that doesn't exist. They are checked against
what the product promises, which needs no ground truth:

- absurd body → confidence at or below `CONFIDENCE_CAPS.implausibleBody`, and the
  explanation names the measurements;
- contradictory closet → the explanation says so, **and** confidence is no higher
  than the same persona with an empty closet. The second half was added after the
  first half passed on the message alone while confidence rose 46% → 75%.

## Metrics (per system)

1. **Page acquisition** — A: our fetch returned the page. S5: the capture holds
   product data, a measurement table, or size labels.
2. **Usable chart** — two or more sizes with measurements.
3. **Size labels** — the extracted labels against the page's, exact match and
   Jaccard.
4. **Measurement values** — ranges compared at min and max, single values directly,
   within 1.3 cm (the printing precision of half an inch).
5. **Body vs garment** — the extracted kind against the page's.
6. **Recommendation** — the pick is in the acceptable set (body charts only).
7. **Provenance** — the source fields tell the truth: a page chart is credited to
   the page, a brand chart never claims to be the page, and the extension transport
   is recorded as such.
8. **Refusal** — right answer / right refusal / **wrong answer** / wrong refusal.
   The wrong-answer rate is the safety number. A wrong answer is answering when it
   should have refused, answering outside the acceptable sizes, or **answering from
   the synthesized ladder at all**: those numbers came from no page, so the answer
   is fabricated even if its label happens to match.

9. **Stability** (no truth needed) — for every ordinary pick, the share of the
   engine's perturbation grid that keeps it (`stability.ts`); reported as the mean
   and the count below `STABILITY.fragileBelow`.
10. **Calibration** (needs truth) — over graded picks: the **Brier score**
    (mean (confidence − right)²; 0.25 is a constant 50%), **mean confidence − hit
    rate** (positive = over-confident), and **confidently wrong**: wrong picks shown
    above `EVAL.confidentAbove` (0.5 — a pick over 50% claims to be more likely
    right than wrong). All three are reported with their n and are **null at
    n = 0**, never a score computed from nothing.
11. **Guardrails** (no truth needed) — the adversarial checks above, passed / run.

Also recorded: payload size against the page's size, capture time, and how often
each reader (table, LLM, vision) produced the numbers.

## Freeze rule

Once the truth for a case is committed, **nobody tunes the parser or the engine
against it**. A later change must stand on its own reasons, and the evaluation is
re-run with the change named in the results. After fixes, two or three fresh cases
are captured and reported separately, to check we did not just fit the benchmark.

## Running it

```bash
cd app-web
npm run eval                 # offline: B and S5 on every case with a capture
EVAL_LIVE=1 npm run eval     # also A — contacts each retailer once per case
```

Results go to `results/<date>.json` (machine-readable) and `results/<date>.md`
(the table). **A results file is never overwritten**: a second run on the same day
writes `<date>-run2`, `-run3`, … (a same-day re-run once replaced a committed
record).

S5 needs the captures in `local/captures/`, which are git-ignored and do not
travel with a clone or a machine move; without them only B (and A, live) run.
Re-capture with `browser-extension/scripts/try-pages.mjs --save-captures local/captures --ids <case ids>` (see `todo/engineering/09`). Until a case has a `truth/` file, its accuracy columns read "truth
pending" — observations are still recorded.

`src/lib/evalCases.test.ts` replays every **committed** capture that has a truth
file inside `npm test`, so a regression on a real page fails the ordinary suite.
