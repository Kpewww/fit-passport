---
name: project-fit-passport-next-steps
description: "Fit Passport — prioritized backlog / what to do next, as of Session 40 (2026-08-20)"
metadata: 
  node_type: memory
  type: project
  originSessionId: ff70f30d-84e1-4230-9852-546155e0d6ff
  modified: 2026-08-20T22:33:47.428Z
---

Prioritized next-steps for [[project-fit-passport]] as of **Session 40 (2026-08-20)**. Current state: real-page fetching (JSON-LD/tables/vision-OCR/号型), multi-dimensional transparent engine (chest+waist+shoulder, body-range, garment ease, ordinal verdict, margin-scaled confidence), region body prior, 172 tests, all committed & pushed. Everything must stay research-grounded ([[feedback-research-grounded]]) and hold the privacy/legal/transparency invariants. **The founder has NOT locked the next item** — this is the menu; ask which to start.

## Tier 1 — Ship to real users (highest leverage)
1. **Deploy to Vercel + Neon.** Code is ready (see [[project-fit-passport-deployment]]). Founder's own account steps: Neon (`-pooler` conn str), Vercel (Root `app-web`, Build `npm run vercel-build`), env `DATABASE_URL`/`SESSION_SECRET`/`APP_URL`.
2. **Set `ANTHROPIC_API_KEY` in prod** so the LLM text-extract + **vision size-chart OCR** + Chinese-page handling actually run on live sites (they're key-gated; today they no-op without a key). Then **end-to-end validate real fetch** on real US + Chinese product URLs — confirm JSON-LD/table/vision/号型 paths, and record which real sites hard-block (see `looksBlocked`).
3. **Swap the rate limiter to Upstash Redis** before real traffic (already coded — just set `UPSTASH_REDIS_REST_URL`/`_TOKEN`; per-process memory counters are meaningless on serverless).

## Tier 2 — Algorithm & extraction depth (research-grounded)
4. **Vision-OCR robustness:** downscale huge detail images before base64, try/merge multiple stitched chart images, cache vision results (the HTML cache doesn't cover the vision call). China research: charts-as-images is the COMMON case, so this matters.
5. **Bottoms fit:** waist/hip range scoring + Chinese 号型 for bottoms (型 = 腰围). Needs a body-WAIST range in the engine (mirror `bodyChestMin/Max`) and probably a `hipCm`. Today 号型 only wired for TOP categories.
6. **Per-item / per-brand community fit sentiment** ("runs small → size up") feeding the brand-bias term — validated by both commercial (True Fit, 得物 尺码感受) and academic (Zalando η return-shift) research. Ties into the ecosystem.
7. **Confidence-calibration sanity pass:** run a handful of real cases, check verdicts + confidence read sensibly against reality.

## Tier 3 — Governance-sensitive (do carefully, cite sources)
8. **Population/anthropometric prior polish** (started, `populationPrior.ts`): cite exact survey tables, add a bottoms/waist prior, add an opt-in UI toggle + plain-language explanation. Keep it prior-only, never overriding real data, never inferring/storing ethnicity (see `docs/design/fit-algorithm-research.md` §4b).
9. **Finish Chinese-channel research** — JD / Douyin / Pinduoduo mechanisms were unverified in `docs/design/china-sizing-research.md`.

## Tier 4 — Ecosystem (see [[project-fit-passport-community-ecosystem]])
10. **Run ONE $100 budget contest MANUALLY** to validate demand before building event tooling (no code).
11. Then, if it lands: event system + commemorative special-metal badges; keep polishing Ask&Answer + Daily-Top.

## Tier 5 — Course deliverables (graded, non-code)
12. **Customer interviews** (target 5+), **midterm Product Opportunity presentation**, **BMC/VPC v1** update — feed them with the market research already in `docs/design/*research*.md`.

## Hygiene / minor
- Fixture regexes match by URL substring regardless of domain (e.g. any `.../oxford-shirt` → COS fixture). Harmless for demo; fix to domain-scope if it ever misleads.
- JS-rendered charts behind a "size guide" modal need a headless browser — out of scope unless prioritized.
- Badge motif is faint at ~64px; `/check` empty-state has a lot of whitespace before a URL is pasted — cosmetic polish, deferred.

**Recommendation:** Tier 1 (deploy + key + validate) is the biggest unlock — it turns everything built into something real users touch, and is the only way to get the customer interviews Tier 5 needs.

---

## UPDATE — Session 41 (2026-08-24). App is LIVE at https://fit-passport.vercel.app

Tier 1 items 1 and 3 are **DONE** (deployed to Vercel+Neon; Upstash Redis verified receiving `rl:*` counters). Also done this session: **confidence calibration** (signal-disagreement rule + `conflictNote`, 1.0→0.6 on the real case), **fetch-strategy decision** (`docs/design/fetch-strategy.md`), **fetch-outcome instrumentation** (`source.fetch` = blocked/unreachable/ok/skipped), and **`docs/design/cost-model.md`**. 172 → 187 tests.

**Re-prioritised, and the reasoning changed:**
1. **`ANTHROPIC_API_KEY` in prod** — still Tier 1, but the old framing was wrong. It fixes only pages we CAN fetch whose charts are images/unstructured. **It cannot fix a 403** — measured: H&M blocks, so no model helps there. ~$0.012/check, ~$4/mo at demo scale.
2. **Move item photos out of Postgres** (base64 data URLs → blob storage). This is the FIRST hard wall — Neon free 0.5 GB ≈ 340 users with 10 photos each, then writes fail for everyone. Arrives long before LLM cost matters. Do this before inviting a real cohort.
3. **Customer interviews** — the app is live, so the blocker is gone. This is now the highest-value non-code item (course-graded, and step 4 depends on it).
4. **Browser extension** — the real answer to 403s (reads the page in the user's own browser, no block to defeat, $0/request, handles JS size-guide modals). **Evidence-gated**: don't build until interviews show people want the core loop.
5. **GitHub auto-deploy** — needs the founder to install the Vercel GitHub App; until then release with `vercel.cmd deploy --prod` from the repo root.

**REJECTED (don't revisit without a reason):** stealth/residential proxies and headless-scraping APIs. Not on price — on legal posture. hiQ + Meta v. Bright Data protect *logged-out public* scraping but require respecting technical access controls; a Cloudflare 403 is one. Trading the governance story for size charts is a bad trade. Full reasoning in `docs/design/fetch-strategy.md` §2.

**Budget note:** Vercel Hobby forbids commercial use — Pro ($20/member/mo) is required the moment the project charges anyone. Plan it into any monetisation discussion.

---

## UPDATE — Session 42 (2026-08-25)

Done since the last update: **`ANTHROPIC_API_KEY` set in prod** (Tier 1 item 2 — but see the caveat: it cannot fix a 403, only pages we can fetch); **GitHub auto-deploy connected** (every push to `main` now deploys); **performance round 2** (see [[project-fit-passport-performance]] — React-per-mousemove, leaked WebGL contexts, Lenis removed, badges flattened); **SSRF guard + non-apparel refusal + Chinese category keywords**. 172 → **209 tests**.

**Current top of the list:**
1. **Customer interviews.** The app is live and hardened. Nothing else is blocking it, it is course-graded, and step 3 below is explicitly gated on what they say.
2. **Confirm the performance work actually landed** on the founder's machine — if the tab is still heavy, the next data point needed is Chrome Task Manager's **GPU memory vs JS memory** split, which decides between "more compositing cost" and "a leak".
3. **Browser extension** — the answer to blocked retailers AND to Taobao (login-walled, so the wrong side of the case law; the extension sidesteps it by being the user's own browser). Evidence-gated on (1).
4. **Move item photos out of Postgres** before inviting a cohort (Neon free 0.5GB ≈ 340 users × 10 photos, then writes fail for everyone). Not urgent for a demo — the founder explicitly deprioritised it, correctly.
5. **Badge redesign** — the founder wants to supply reference art later; format is a 24×24 stroke-only SVG motif (see [[project-fit-passport-design-system]]).

---

## UPDATE — Session 44 (2026-08-25)

Machine moved **Windows → macOS** (`/Users/kpew/fit-passport`), rebuilt from a bare
clone and verified green (209 tests, clean build, privacy + SSRF invariants
re-checked live). Team grew: **Jenny Cao** and **Nicolas Wang** joined.

**New, and it jumps the queue for engine work:**
[[project-fit-passport-closet-signal-design]] — the closet's `fitRating` is a
**unipolar 1–5 that loses the direction of misfit**, while every size-rec system we
cite uses a bipolar ordinal. Full argument in
`docs/design/closet-signal-and-interaction-cost.md`. Three derived signals cost the
user **nothing** and are the natural first build; replacing the dropdown is a net
*reduction* in user effort. Cross-user aggregation is **blocked** on retrieving
SizeFlags' thresholds and building the anti-abuse defences.

**Priority now:**
1. **Customer interviews** — still first, and they now have a second job: test the
   five-option fit wording ("too tight … too loose"). Five people can falsify it in
   an afternoon, and step 2 is cheaper if the vocabulary is right.
2. **The free derived signals** (personal ease target, preference-consistency
   confidence) — zero UI change, zero user cost, testable in isolation.
3. **Replace the 1–5 dropdown** with the bipolar control.
4. **Next.js security triage** — `npm audit` shows ~21 advisories against 14.2.35
   whose only offered fix is `next@16` (breaking major). Not acted on; needs a real
   per-advisory triage rather than a version bump or a shrug.
5. Browser extension (evidence-gated), item photos out of Postgres, badge redesign
   — unchanged from Session 42.

**Decision owed by the founder:** the numeric fit mode. A 1–20 *comfort* scale is
unipolar and reproduces the defect above; a signed −10…+10 range does not. See
[[project-fit-passport-closet-signal-design]].
