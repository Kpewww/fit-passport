# Cost model — what Fit Passport costs to run, and where it breaks

**Written 2026-08-24 (Session 41), after the first production deployment.**
Prices verified against vendor pricing pages on that date; re-check before quoting
them to anyone. Companion to `fetch-strategy.md` (which prices the *rejected*
options) and `DEPLOYMENT.md` (which lists the env keys).

---

## 1. Today: the running cost is $0

| Component | Plan | Cost | Real limit |
|---|---|---|---|
| Vercel | Hobby | **$0** | 100 GB bandwidth/mo, 1M function invocations, **60s function timeout**, no commercial use |
| Neon Postgres | Free | **$0** | **0.5 GB storage**, 100 CU-hours/mo, 10 branches |
| Upstash Redis | Free | **$0** | ample for rate-limit counters |
| Anthropic | *not set* | **$0** | LLM + vision extraction inert |
| Replicate | *not set* | **$0** | photoreal try-on falls back to an SVG mannequin |
| Resend | *not set* | **$0** | reset links shown on screen instead of emailed |
| Domain | none | **$0** | on `fit-passport.vercel.app` |

Everything key-gated degrades gracefully, so the app is fully usable at zero cost.
**That is the current state and it is genuinely free.**

---

## 2. Two constraints that are not about money

### 2a. Vercel Hobby forbids commercial use

Vercel's terms restrict Hobby to non-commercial, personal projects. A demo
is fine. **The moment this charges anyone, shows ads, or sells anything, it must be
on Pro — $20/month per member with deploy access.** Two people with deploy access
is $40/month. This is a licence term, not a resource limit, so no amount of staying
under the bandwidth cap avoids it.

Plan for it at the point monetisation is discussed, not after.

### 2b. The 60-second function timeout is closer than it looks

`/api/check` can chain: page fetch (8s timeout) → deterministic parse → text LLM
(8s) → up to two image fetches → a vision call. Today's worst case fits, but it is
not comfortable, and every extraction feature added eats into it. Pro raises the
ceiling to 300s. **Treat 60s as a design constraint on the extraction pipeline**,
not as headroom.

---

## 3. Variable cost, per action

Claude **Haiku 4.5** (`claude-haiku-4-5`) is what `extractorLLM.ts` uses:
**$1.00 per 1M input tokens, $5.00 per 1M output.**

| Action | Input | Output | Cost |
|---|---|---|---|
| Text extraction, typical page | ~10K tok | ~400 tok | **~$0.012** |
| Text extraction, at the input cap | ~20K tok | 1,200 tok | **~$0.026** |
| Vision chart OCR (2 images) | ~3.2K tok | ~400 tok | **~$0.005** |
| Photoreal try-on (Replicate FLUX schnell) | — | — | **~$0.003/image** |

### The cost bug this document found

`MAX_PAGE_BYTES` was **600,000 chars ≈ 150K tokens ≈ $0.15 for one extraction** —
about **20x** the "~$0.007 per check" quoted in `.env.example`. One bloated product
page could cost more than twenty ordinary ones, and nothing capped it.

Fixed in Session 41: the cap is now **80KB (~20K tokens, ~$0.02 worst case)**. Safe
because `htmlToLlmText` emits `SIZE TABLES` *before* prose, so truncation removes
marketing copy and never the chart. That property is now covered by tests rather
than assumed.

### Two optimisations that do NOT apply here — don't chase them

- **Prompt caching** (~90% off cached prefix) needs a **stable prefix of ≥1024
  tokens**. Every product page is different and our system prompt is far shorter
  than 1024 tokens. There is nothing to cache. It would help if we ever batch many
  calls against one long shared instruction set; we don't.
- **Batch API** (50% off) is asynchronous. `/api/check` is interactive — a user is
  waiting. Not applicable.

---

## 4. What it costs at scale

Assuming ~6 checks per active user per month, with `ANTHROPIC_API_KEY` set:

| Scenario | Checks/mo | LLM | Infra | **Total/mo** |
|---|---|---|---|---|
| **Demo** — 30 testers | ~300 | ~$4 | $0 | **~$4** |
| **Small beta** — 500 users | ~3,000 | ~$36 | Neon Launch ~$5–15 | **~$45** |
| **Real traction** — 5,000 users | ~30,000 | ~$360 | Neon ~$30–80 + Vercel Pro $20 | **~$450** |

LLM cost is the dominant variable and scales linearly with checks. At the demo
scale the whole thing is **a rounding error — roughly one coffee per month.**

---

## 5. The first thing that actually breaks: storage

**Not** the LLM bill. Portraits and closet item photos are stored as **base64 data
URLs inside Postgres** (`KnownGoodItem.imageDataUrl`, `FitProfile.avatarDataUrl`).
Base64 inflates bytes by ~33%, and Neon's free plan gives **0.5 GB**.

At ~150 KB per stored photo:

```
0.5 GB / 150 KB  ≈  3,400 photos  ≈  ~340 users with 10 photos each
```

**So the free tier runs out at a few hundred engaged users — long before LLM spend
becomes interesting.** And it fails in the worst way: writes start failing for
everyone, not just heavy users.

Two independent fixes, and they should both happen before any real launch:

1. **Move images to blob storage** (Vercel Blob, S3, or Cloudflare R2 — R2 is
   ~$0.015/GB-month with no egress charge). Rows shrink to a URL. This is the real
   fix and `DEPLOYMENT.md` already flags it as a known limitation.
2. **Neon Launch** is cheap on its own — storage is $0.35/GB-month with **no monthly
   minimum** since Dec 2025, compute $0.106/CU-hour. 10 GB of photos is ~$3.50/mo.

Doing (1) makes (2) mostly unnecessary. Doing only (2) means paying Postgres rates
to store JPEGs, which is the expensive way to solve it.

---

## 6. Upgrade triggers — what forces a spend, and when

| Trigger | Forces | Cost |
|---|---|---|
| Turning on real extraction | `ANTHROPIC_API_KEY` | ~$0.012/check |
| **Charging anyone / ads / selling** | **Vercel Pro** (licence, not usage) | **$20/member/mo** |
| ~340 users with photos | blob storage **or** Neon Launch | ~$0–15/mo |
| Extraction pipeline grows past 60s | Vercel Pro | $20/mo |
| >100 GB bandwidth/mo | Vercel Pro (Hobby has **no overage option** — it just stops) | $20/mo |
| Real password-reset emails | Resend | $0 to 3,000/mo |
| Photoreal try-on | Replicate | ~$0.003/image |
| A custom domain | registrar | ~$12/yr |

Note the asymmetry: **Hobby's bandwidth cap cannot be paid down.** There is no
overage billing — you hit 100 GB and the site stops until the month rolls over. For
anything with an audience, that alone argues for Pro.

---

## 7. What to do about it, in order

1. **Set `ANTHROPIC_API_KEY`.** ~$4/month at demo scale for the feature that makes
   the core promise work on real pages. Best ratio of value to cost in the project.
2. **Instrument before optimising.** `source.fetch` now records blocked vs.
   unreachable vs. ok (Session 41). Add a counter for `sizesFrom` too — a month of
   real data tells us whether extraction spend is even worth it.
3. **Move images out of Postgres** before inviting a real cohort. It is the only
   hard wall in the current design, and it arrives at a few hundred users.
4. **Budget Vercel Pro into any monetisation plan** from the start. It is a terms
   requirement the moment money changes hands.
5. **Leave Replicate off** until someone asks for photoreal try-on. The SVG
   mannequin costs nothing and the research says image try-on ≠ fit anyway
   (`fit-algorithm-research.md`).

**Sources:** [Neon plans](https://neon.com/docs/introduction/plans) ·
[Neon free-plan limits](https://neon.com/faqs/free-plan-limits-and-quotas) ·
[Vercel free vs Pro 2026](https://www.fencode.dev/en/blog/vercel-free-vs-pro-2026-official-limits-pricing) ·
[Vercel pricing breakdown](https://flexprice.io/blog/vercel-pricing-breakdown)
