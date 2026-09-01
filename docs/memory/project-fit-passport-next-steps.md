---
name: project-fit-passport-next-steps
description: "Fit Passport — prioritized backlog / what to do next, as of Session 40 (2026-08-20)"
metadata: 
  node_type: memory
  type: project
  originSessionId: ff70f30d-84e1-4230-9852-546155e0d6ff
  modified: 2026-08-20T22:33:47.428Z
---

> ⚠️ **The authoritative list is at the BOTTOM of this file (Session 48).**
> Everything above it is kept as history — it records why priorities changed, which
> is often the useful part, but it is not what to do next.

Prioritized next-steps for [[project-fit-passport]] as of **Session 40 (2026-08-20)**. Current state: real-page fetching (JSON-LD/tables/vision-OCR/号型), multi-dimensional transparent engine (chest+waist+shoulder, body-range, garment ease, ordinal verdict, margin-scaled confidence), region body prior, 172 tests, all committed & pushed. Everything must stay research-grounded ([[principle-research-grounded]]) and hold the privacy/legal/transparency invariants. **The founder has NOT locked the next item** — this is the menu; ask which to start.

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

## Tier 5 — Business deliverables (non-code)
12. **Customer interviews** (target 5+), the **Product Opportunity presentation**, **BMC/VPC v1** update — feed them with the market research already in `docs/design/*research*.md`.

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
3. **Customer interviews** — the app is live, so the blocker is gone. This is now the highest-value non-code item, and step 4 depends on it.
4. **Browser extension** — the real answer to 403s (reads the page in the user's own browser, no block to defeat, $0/request, handles JS size-guide modals). **Evidence-gated**: don't build until interviews show people want the core loop.
5. **GitHub auto-deploy** — needs the founder to install the Vercel GitHub App; until then release with `vercel.cmd deploy --prod` from the repo root.

**REJECTED (don't revisit without a reason):** stealth/residential proxies and headless-scraping APIs. Not on price — on legal posture. hiQ + Meta v. Bright Data protect *logged-out public* scraping but require respecting technical access controls; a Cloudflare 403 is one. Trading the governance story for size charts is a bad trade. Full reasoning in `docs/design/fetch-strategy.md` §2.

**Budget note:** Vercel Hobby forbids commercial use — Pro ($20/member/mo) is required the moment the project charges anyone. Plan it into any monetisation discussion.

---

## UPDATE — Session 42 (2026-08-25)

Done since the last update: **`ANTHROPIC_API_KEY` set in prod** (Tier 1 item 2 — but see the caveat: it cannot fix a 403, only pages we can fetch); **GitHub auto-deploy connected** (every push to `main` now deploys); **performance round 2** (see [[project-fit-passport-performance]] — React-per-mousemove, leaked WebGL contexts, Lenis removed, badges flattened); **SSRF guard + non-apparel refusal + Chinese category keywords**. 172 → **209 tests**.

**Current top of the list:**
1. **Customer interviews.** The app is live and hardened. Nothing else is blocking it, and step 3 below is explicitly gated on what they say.
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


---

## CURRENT LIST — Session 48 (2026-08-25). This supersedes everything above.

**State:** live, **265 tests**, mobile pass shipped, signed fit scale shipped,
migration guard in place. Repo memory and `docs/RESUME.md` are current as of here.

**Customer interviews are DEFERRED — the founder said so on 2026-08-25.** They were
priority #1 for three sessions; do not put them back at the top unsolicited. Note
what this costs, so the trade-off stays visible: the browser-extension decision was
explicitly gated on interview evidence, and so was per-area fit granularity. Both
stay parked until interviews happen.

### Ready to build, nothing blocking

1. **Capture the size chart when an item is added by URL.** This is the one change
   that unblocks the **personal ease target in centimetres** (`ease = garment −
   body`), which turned out not to be derivable today because `KnownGoodItem`
   stores no garment measurements. The extractor already has the numbers in hand at
   add-time and throws them away. Highest-value engine work available.
2. **Finish the mobile pass.** Session 48 fixed navigation, every overflow, gutters
   and the main tap targets. Not yet walked at phone width: `/refresh` (the card
   stack), `/onboarding`, `/ask/[id]`, `/admin`, `/u/[code]`. Use
   `app-web/scripts/mobile-audit.mjs`.
3. **Next.js security triage.** `npm audit` reports ~21 advisories against 14.2.35
   whose only offered fix is `next@16` — a breaking major. Needs a real
   per-advisory judgement (most target features this app does not use: Image
   Optimizer `remotePatterns`, Pages-Router i18n, custom servers), not a version
   bump and not a shrug.
4. **Item photos out of Postgres.** Base64 data URLs in the database; Neon free is
   0.5 GB ≈ 340 users with ten photos each, then writes fail for **everyone**. Not
   urgent for a demo, and deliberately deprioritised — but it is the first hard
   wall.

### Needs a decision from the founder before it can be built

5. **Should `fitDirection` be visible to an account-code holder?** Currently no.
   It is closet information like `fitRating` (already public) and arguably more
   useful, but widening what a bearer code reveals is a **governance decision**.
6. **Badge redesign** — waiting on reference art. Format: 24×24 stroke-only SVG
   motif. Restoring dimensional badges is one default flip once they are redesigned.

### Blocked on evidence or on research

7. **Cross-user brand knowledge** ("this brand runs small on broad shoulders",
   aggregated) — the real moat, and the **only** place adversarial data becomes a
   security problem rather than a self-inflicted one. **Blocked twice over:**
   SizeFlags' actual thresholds could not be extracted from its PDF, and the
   defences in `closet-signal-and-interaction-cost.md` §2.2 (robust aggregation,
   minimum evidence, reputation weighting, per-account caps) do not exist yet.
8. **Browser extension** — the answer to 403-blocking retailers and to Taobao.
   Gated on interview evidence, which is now deferred.
9. **Per-area fit ratings** — fails the FIC cost/value bar today; revisit only if
   interviews show people want the granularity.

### Business deliverables (non-code)

10. Mid-project **Product Opportunity** presentation; **BMC/VPC v1** update.
    `DEVLOG.md` is current.
11. Roles for **Jenny Cao** and **Nicolas Wang** are unassigned in
    `docs/business/project-plan.md` — deliberately, pending a team conversation.

### Hygiene

- Extractor fixtures match by URL substring regardless of domain (harmless).
- One throwaway `smoke…` account (member No.2) still exists in production; clean it
  up before anyone sees the member roster.
- Neon is `us-east-2` while Vercel functions run `iad1` — a ~10–15ms hop, not worth
  moving.


---

## UPDATE — Session 56 (2026-08-27)

Done: favicon unblocked (vector glyph drawn, 404 bytes at 16 px, shipped as
ico/svg/apple-icon); palette settled on **cool porcelain `#F3F3F1`**, Warm Ivory
retired; a supplied "fixed" SVG was caught as a bitmap wrapper and archived rather
than adopted. See [[project-fit-passport-logo]].

**New top item — INFORMATION ARCHITECTURE.** Sketched in
`docs/design/information-architecture.md`, **not built** (founder: rough outline
only). Measured on a phone: `/closet` shows **23 input controls and 104 tappable
elements** at once over 5.5 screens, the homepage runs **9.8 screens**. The least
dense page is `/refresh` — and it is the only flow that already asks one question at
a time. That pattern is the model; it already exists in the codebase.

Three moves proposed, smallest first: (1) one question per screen wherever we ask
for anything, arbitrated by the existing FIC budget; (2) earn the next question with
a visible payoff — let the first check run on nothing and use the honest low
confidence as the invitation; (3) intent-led entry instead of a list of schema
nouns, last because it is most likely to be wrong on the first try.

**Parked deliberately, with reasons:**
- **Logo story on the site** — worth doing, but it is new content and the request
  arrived alongside "there is already too much to read". Belongs inside the IA
  rework, not appended to a 9.8-screen homepage.
- **Foundation-shade picker** — a *second product surface*, not a feature. Coherent
  with "one profile, any store" (shade codes are as incompatible across cosmetics
  brands as sizes are across labels), but it shares nothing with `fitEngine.ts`, and
  it introduces a **more sensitive data class than anything held today**: skin tone
  sits close to an identity attribute, and the standing line about never inferring
  ethnicity is much harder to hold when the input *is* skin colour. Needs a research
  write-up and a governance decision before any code.
- **Lockups (horizontal / stacked)** — still blocked on choosing the wordmark
  typeface. Italic Fraunces in the app is a placeholder, not a decision.
- **Vector print PDF** — no blocker, just tooling. Can be done any time.

---

## UPDATE — Session 58 (2026-08-27)

**Information-architecture move 1 is BUILT.** The `/closet` add form is now four
questions on four screens (`AddItemFlow` + `src/lib/addFlow.ts`), down from an
eleven-field grid: input controls 28 → 15, tappable elements 127 → 84, 5.5 → 4.5
screens, measured before and after with the same script on the same account. Which
four questions survive is pinned by `addFlow.test.ts` against the §3.2 FIC budget —
see [[project-fit-passport-build-state]] invariant ㉙.

**Still to do from the sketch, in order:**
1. **Move 2 — earn the next question with a visible payoff.** Let the first size check
   run on nothing, show a real answer at honest low confidence, and use that number
   as the invitation to add one garment. The `conflictNote` and confidence value
   already exist; today they explain, and they could invite.
2. **Move 3 — intent-led entry** instead of a nav of schema nouns. Largest change,
   most likely to be wrong first try, so it stays last.
3. **Apply move 1 to the other asking surfaces** — `/onboarding` and the profile
   measurement fields have not been through this treatment. `/check` is already
   short (3 inputs, 2.4 screens) and probably does not need it.

**Unchanged and still parked:** logo story on the site (belongs inside move 3's
decision about what a first-time visitor reads), foundation-shade picker (researched
proposal, not a sprint), lockups (blocked on the wordmark typeface), vector print PDF.

**Design-tooling note:** Recraft's **API units are prepaid and separate from
subscription credits** ($1 = 1,000 units; a token requires a non-zero API balance),
so a web-app subscription does not enable programmatic use. Sourced from Recraft's own
API pricing and getting-started docs, 2026-08-27. Nothing in the current backlog needs
it: the mark is already a vector master, colourways are a `fill` change, and the one
place generation would genuinely help is **badge motifs**, which are waiting on the
founder's own reference art. Also worth carrying into that decision: the US Copyright
Office holds that purely prompt-generated output is not copyrightable, while trademark
protection does not require human authorship — so an AI-generated brand asset can
still be a trademark but may carry no copyright.

---

## UPDATE — Session 59 (2026-08-28)

Tidying, no product change. **Done:** colour palette de-duplicated from four copies
into `src/lib/colors.ts`; **`brand/` moved to the repo root** because the app builds
from those files; a drift test added between `Logo.tsx` and the master SVG;
`credentials_layout.html` renamed and filed as the design mockup it is; both READMEs
corrected. 273 → 285 tests.

**Removed from the hygiene list** (all now done): the four-copy colour helper.

**The queue is unchanged otherwise.** Next up is still information-architecture move
2 — let the first size check run on nothing and use the honest low confidence as the
invitation to add a garment.

---

## UPDATE — Session 63 (2026-09-01)

**Bug fixed:** the guided checklist's "Set your fit preference" was ticked for every
visitor on their first request, because a `FitProfile` row is seeded alongside the
`User` and the step asked `!!profile`. Now `hasStatedProfile()` in
`src/lib/profileCompleteness.ts` — see [[project-fit-passport-build-state]]
invariant ㉜. 304 → 314 tests.

**Needs a decision from the founder — small but real:** `hasBody` (which drives the
accuracy tier and the "add your measurements" nudge) counts chest/height/waist,
while the engine scores chest/waist/**shoulder** and never reads height. A
shoulder-only user is told they have no measurements; a height-only user is told
they do. Aligning it is one line, but it changes the accuracy tier shown to existing
users, so it should be chosen rather than drifted into.

---

## UPDATE — Session 64 (2026-09-01)

**Done, and it closes the decision left open last session:** `hasBody` was
chest/height/waist; it is now chest ∪ waist ∪ shoulder, and a separate
`hasChestMeasurement` drives anything that offers confidence points. See
[[project-fit-passport-build-state]] invariant ㉝. The help page's mark section was
rebuilt as a specimen plate (presentation only — the copy stays the concept
document's own). 314 → 321 tests.

**Nothing new blocked.** The queue is unchanged: information-architecture move 3
(intent-led entry) is the next substantial item, and the wordmark typeface is still
the thing blocking the lockups.

---

## UPDATE — Session 65 (2026-09-01)

**New design sketch, nothing built:** `docs/design/3d-body-and-tryon.md` — what a
3D body could honestly be for. Founder asked to think about it; the deliverable is
the thinking.

**The finding that settles the photo question:** best published chest error from a
photo is **3.32 cm** (CVPR 2025) — against this engine's chest sigma of **4 cm**
and real size steps of **4–6 cm**. A photo-measured chest is off by about one whole
size. It can be a *prior* (the `chestIsEstimated` slot already exists), never a
fact. Do not let this be re-litigated on "the models will get better" — the bar is
roughly **1.5 cm** and nothing is close.

**Licensing trap to remember:** SMPL is patented, commercial use needs a negotiated
licence (Meshcapade → **acquired by Epic Games, Feb 2026**), and most of the try-on
literature is built on it. Check any candidate body-model library for an SMPL
dependency the way an SVG gets checked for a `<path>`. Permissive options exist:
**Anny** (Naver, Apache 2.0, CC0 MakeHuman assets) and Meta's **MHR** (Apache 2.0).

**Recommended order, when it is picked up:**
1. A 3D body driven by the measurements the user already typed — no photo, no
   estimation, no new data class. Opt-in stage, flat `BodyFigure` stays the default.
2. An **ease shell** rather than a garment (we have measurements, not patterns) —
   `FitFigure`'s contract with one more dimension, and it must stay unstyled.
3. Photo → prior only, and only if interviews say people want it. Most expensive
   input in the FIC table, and the most sensitive data class the app would hold.

**Not recommended at any confidence:** attaching a generated image to a size
recommendation. `tryonImage.ts` builds a text prompt and generates a *generic*
person — an illustration of an outfit's idea, not this user in this garment.

---

## UPDATE — Session 66 (2026-09-01)

**Built:** the measured 3D body (step 1 of `docs/design/3d-body-and-tryon.md`),
opt-in on `/passport`. 321 → 340 tests. See
[[project-fit-passport-build-state]] invariants ㉞–㉟.

**The queue reshuffles slightly, and in a useful direction:**

1. **The ease shell** — the garment's measurements as a second surface around the
   same form. Needs **no new data** (chest/shoulder/sleeve already come out of the
   size chart) and it is what makes the 3D view useful rather than merely
   informative.
2. **Capture the size chart at add-by-URL time** — already the top ready-to-build
   item for an unrelated reason (it unblocks a personal ease target in cm). It now
   *also* unblocks the best version of the 3D work: your own known-good garment as
   one shell against the candidate as another. **Two separate threads want the same
   change**, which makes it the highest-leverage item on the list.
3. Information-architecture move 3 (intent-led entry) — unchanged.

**Still parked, unchanged:** photo→body (a prior at best; see the 3.32 cm finding),
wordmark typeface (blocks the lockups), foundation-shade picker.

---

## UPDATE — Session 67 (2026-09-01)

**Both remaining actionable 3D steps are built.** The ease shell on `/check`, and
`KnownGoodItem` now captures the garment's own measurements at add-by-URL time.
340 → 353 tests. See [[project-fit-passport-build-state]] invariants ㊱–㊲.

**Two long-standing backlog items are now unblocked and are the obvious next work:**

1. **The personal ease target in centimetres.** Recorded for several sessions as
   *not derivable* because `KnownGoodItem` stored no garment measurements. It now
   does. `ease = garment − body` is computable for every piece the user owns AND
   rated, which is a stronger signal than any chart: a chart says how a brand cuts,
   this says what actually worked on this body. **The engine does not read the new
   columns yet** — that is the next engine change, and it is the highest-value one
   available.
2. **The garment comparison in 3D** — your known-good shirt as one shell against
   the candidate as another, on your own form. The data for it now exists.

**Note the ordering trap:** do (1) before (2). The comparison is the visible
feature, but the ease target is what makes the recommendation better, and the 3D
view is a picture of the engine rather than a replacement for it.

**Unchanged:** IA move 3 (intent-led entry), wordmark typeface (blocks the lockups),
photo→body (a prior at best), foundation-shade picker.

---

## UPDATE — Session 68 (2026-09-01)

**Both items from the last update are done.** The personal ease target is built and
the engine reads it; and while testing it, the cross-brand anchor was found to be
matching size *labels* rather than measurements and was fixed. 353 → 381 tests. See
[[project-fit-passport-build-state]] invariants ㊳–㊴.

**Next, in order:**
1. **Surface the ease target on `/passport`** — "your closet says you wear +14.5cm,
   your stated preference is regular (+10)". It is currently only visible inside a
   `/check` result's reasons, which is where the fewest people will read it, and it
   is a genuinely interesting thing to know about yourself.
2. **The garment comparison in 3D** — your known-good shirt as one shell against
   the candidate as another, on your own form. All the data now exists.
3. **IA move 3** (intent-led entry) — unchanged.

**Worth knowing before touching the engine again:** the ease target and the anchor
are deliberately disjoint. The target moves the ease every size is scored against;
the anchor moves which rung the closet points at. Neither double-counts the other,
and that is by construction rather than by tuning — keep it that way.

---

## UPDATE — Session 70 (2026-09-01)

**Patagonia is in the `blocked` column, not `unreachable`** — measured, see
[[project-fit-passport-build-state]]. That strengthens the case for the **browser
extension**, which reads the page in the user's own browser and so needs no gate
defeated. It is still evidence-gated on interviews, but the evidence for *which
problem it solves* just got firmer.

**Also done:** `/api/check` refuses (422 `unreadable`) instead of serving an
invented ladder when the fetch failed; the tie state and the homepage lede were
cut down from four statements to one and from three sentences to one.

**Copy is now a live thread, not a someday item.** The founder's note was that
most of the site says too much. Two places are fixed; the same read-through has
not been done on `/closet`, `/passport`, `/badges` or `/help`.
