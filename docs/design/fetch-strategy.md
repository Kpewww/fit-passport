# Fetch strategy — how Fit Passport gets a real size chart

**Status: decision document. Written 2026-08-24 (Session 41) after production measurement.**
Supersedes the vague backlog item "real-fetch robustness". Read with
`fit-algorithm-research.md` (why measurements, not images) and
`china-sizing-research.md` (why charts are often images).

---

## 1. The problem, measured

The product promise is "paste any product link". Production measurement on 2026-08-24:

| host | HTTP | bot-block markers | `<table>` in HTML |
|---|---|---|---|
| patagonia.com | 404 | no | 0 |
| www2.hm.com | **403** | **yes** | 0 |

H&M actively refuses server-side fetches. Our `looksBlocked` detector caught it,
refused to parse the challenge page as a product, and degraded to
`sizesFrom: "estimated"` with a capped confidence and a visible warning. **The
honesty machinery works.** The promise, however, is only partly kept.

### The assumption this kills

The backlog said: *set `ANTHROPIC_API_KEY` in production so extraction works on
real sites.* That is **half true, and the wrong half is the expensive one**.

The key unlocks two things — the text LLM and the vision size-chart OCR — and
**both read HTML or images we already hold**. A key cannot fix a 403. Where the
retailer refuses the connection there is nothing for any model to read.

So there are **two different problems** wearing one label:

- **Problem A — we got the page, but the chart isn't machine-readable.** The chart
  is an image, a JS-rendered modal, or unstructured prose. *A model solves this.*
- **Problem B — we never got the page.** Cloudflare / Akamai / PerimeterX
  returned a challenge. *No model solves this. It needs a different mechanism.*

Problem A is cheap and already coded. Problem B is an architecture decision with
cost and legal consequences, which is what this document is for.

---

## 2. What the law actually says (and why it decides this)

Two cases set the frame:

- **hiQ Labs v. LinkedIn** (9th Cir.) — the CFAA does **not** reach automated
  collection of *publicly accessible* data; no login, no "unauthorized access".
  But hiQ still **lost on breach of LinkedIn's User Agreement**, ending in a
  consent judgment. Scraping survived the criminal-adjacent statute and died on
  contract.
- **Meta Platforms v. Bright Data** (N.D. Cal., Judge Chen, 23 Jan 2024) — summary
  judgment **for Bright Data** on the CFAA claim for scraping logged-out public
  Facebook/Instagram pages, citing hiQ and Van Buren. Meta's **breach-of-contract
  claims survived** for data scraped *while logged in*.

The rule that emerges for 2026: **logged-out public scraping is defensible;
logged-in scraping against accepted terms is not.** And the lowest-risk profile
is consistently described as: public factual data, **respect technical access
controls**, reasonable rate limits, privacy-compliant, non-harmful use.

**This is the sentence that decides our architecture.** A Cloudflare 403 *is* a
technical access control. Paying for "stealth proxies" whose entire product is
defeating that challenge is, by definition, not respecting it. It moves us from
the defensible column into the one that generated the lawsuits — and it does so
for a **project that will be shown to reviewers and investors, whose
stated differentiator is trustworthiness with body data**.

We are also the wrong shape for that fight: no legal budget, and a governance
story ([[risks-and-legal]], one of the three standing concerns) that is currently an
asset. Trading it for a few more size charts is a bad trade.

---

## 3. Options, with real 2026 prices

| # | Approach | Cost | Solves | Legal posture |
|---|---|---|---|---|
| 1 | **Do nothing** — honest degradation (today) | $0 | neither | clean |
| 2 | **`ANTHROPIC_API_KEY`** — text LLM + vision OCR | ~$0.01/check (§5) | **A** | clean |
| 3 | **User-paste fallback** — user pastes chart text / screenshots it | $0 infra, ~$0.004/image | **A + most of B** | clean |
| 4 | **Browser extension** — read the page in the user's own browser | dev time only | **A + B** | clean (§4) |
| 5 | **Headless-browser API** (ScrapingBee, Zyte, Bright Data) | $49/mo → $16/1K | A + *some* B | grey → bad |
| 6 | **Stealth/residential proxies** | ~$49 per ~3.3K requests | B | **bad — circumvention** |
| 7 | **Affiliate / partner product feeds** | $0, revenue-positive | A + B, partner brands only | best of all |

Price sources: ScrapingBee $49/mo for 250K credits — but **JS rendering costs 5
credits/request** (→ ~50K requests) and **stealth proxies cost 75 credits**
(→ ~3,300 requests for that same $49). Zyte prices by site difficulty, **$0.06 to
$16.08 per 1,000** — the top of that range is exactly the protected sites we care
about. Bright Data: HTTP $0.06–$1.27/1K, browser-rendered $0.48–$16.08/1K.

Read the shape of that: **the harder the site blocks, the more it costs**, and the
sites we fail on are the hardest ones. Option 5/6 is a bill that scales with
precisely our worst case, in exchange for our best legal argument.

---

## 4. Why the browser extension is the strong answer

Option 4 inverts the whole problem instead of paying to fight it.

The extension reads the size chart **in the user's own browser, on a page the user
themselves opened, as themselves**. Consequences:

- **There is no bot to detect.** No 403, because it is a human's real session,
  real IP, real browser. Problem B disappears rather than being defeated.
- **JS-rendered "size guide" modals become trivial** — the DOM is already built.
  This is the case `docs/design/china-sizing-research.md` flags and that our
  server-side parser explicitly cannot reach.
- **No circumvention of any access control**, so §2's risk simply does not arise.
- **Costs nothing per request.** No proxy bill that grows with success.
- It is also a **distribution channel**: "check your size without leaving the
  product page" is a better first-run experience than copy-pasting a URL, and it
  puts the passport where the shopping decision happens.

Cost is engineering time, not dollars — a Manifest V3 extension with a content
script that finds the chart and POSTs it to our existing `/api/check`. The engine,
the parser, and the honesty machinery are already built and unchanged; the
extension only replaces the *transport*.

**Caveat, stated honestly:** an extension is a real second surface (store review,
per-browser builds, its own update cycle), and it moves work to the moment the
user is shopping rather than planning. It should not be started before there is
evidence people want the core loop at all.

---

## 5. Decision

**Sequenced, not either/or:**

1. **NOW — Option 2 + 3.** Set `ANTHROPIC_API_KEY` (solves A, ~$0.01/check), and
   add a **paste-the-chart fallback** on `/check` for when provenance comes back
   `estimated`. Together these are cheap, clean, and cover a large share of real
   cases — including the Chinese image-chart case, which the research says is the
   *common* one, not an edge case.
2. **NEXT, evidence-gated — Option 4.** Build the extension **only after** the
   core loop shows real usage (the customer interviews will tell
   us). It is the true answer to B, and it is free per-request.
3. **OPPORTUNISTIC — Option 7.** Affiliate networks give legitimate product feeds
   for partner brands and are revenue-positive rather than a cost. Worth a look
   whenever monetisation is next discussed.
4. **REJECTED — Options 5 and 6.** Not on price, on posture. We are not spending
   our governance story to win size charts, and the bill scales with exactly the
   sites we fail on.

**And keep Option 1 underneath all of it.** When we cannot read a chart, saying so
plainly *is* the product working. A confident wrong size costs a return; an honest
"estimated — check the chart" costs nothing and builds the trust the whole thesis
rests on.

---

## 6. What to measure next

- Share of real checks landing in `estimated` (instrument `sizesFrom`).
- Of those, the A/B split: reachable-but-unparsed vs. blocked. `looksBlocked`
  already knows the difference — it just isn't recorded yet.

That ratio decides whether step 2 is urgent or optional, and it is currently
unmeasured. **Instrumenting it is cheaper than guessing, and should come first.**
