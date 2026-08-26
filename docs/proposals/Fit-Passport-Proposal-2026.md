# Fit Passport

### One body. One fit identity. Any store.

**FINAL PROPOSAL** · August 2026
*Xiangchen Kong · Alyssa Qi · Jenny Cao · Nicolas Wang*
*Live at **https://fit-passport.vercel.app***

> This is the current and final proposal for Fit Passport. It supersedes
> `Fit-Passport-Proposal-Original.pdf` and `Fit-Passport-Detailed-Proposal.pdf` in
> this folder, which are retained as history — §4 records what changed between them
> and why.

---

## 1. Startup overview

**Fit Passport is a consumer-owned fit profile.** You tell it once about the clothes
that already fit you. It turns that into a portable record of how your body relates
to real garments — then, when you paste any product link, it reads that page's size
chart, tells you which size to buy, shows every signal behind the answer, and lowers
its own confidence out loud when the signals disagree.

The profile belongs to the shopper, not the store. It works from a pasted URL with
no retailer integration, and it sharpens every time the shopper records what they
kept or returned.

**What we are not building:** a body scanner, an avatar, or a virtual try-on. Those
are picture problems. Fit is a memory problem, and the memory is already hanging in
the shopper's closet.

---

## 2. Problem and origin

Sizes do not agree, and never have. A medium in one brand is a large in another. A
32 waist measures anywhere from 31 to 34 inches of actual cloth. A jacket that fits
your shoulders swims at the chest. The label is a guess presented as a fact.

**What a shopper actually does today** — this is the real competition, so it is worth
naming precisely:

- Opens the size chart and tries to recall their own measurements
- Scrolls reviews for *"runs small, size up"* from someone built similarly
- Recalls their size at a *different* brand and guesses the offset
- Orders two sizes intending to return one
- Abandons the purchase

Each is a workaround for the same missing thing: **nobody keeps a record of how this
person's body relates to real garments.** The information exists — the shopper paid
for it in returns, shipping labels, and things worn twice — and it is discarded at
every new purchase. The costs compound: money, time, and confidence, each bad outcome
making the next purchase harder. Retailers absorb reverse logistics, and returned
garments are frequently landfilled rather than resold.

⚠ **On the numbers.** Chinese apparel return rates are well documented in
`docs/design/china-sizing-research.md`: brand-store returns rose from **24% (2021) to
35% (H1 2024)**, livestream sales commonly around **80%**, with *"尺码不合适"*
(unsuitable size) named among the leading drivers. The commonly quoted figure of
roughly a quarter of US online apparel being returned is **not independently sourced
in our own files**; it is treated here as directional, and verifying it against a
primary source is an open item.

---

## 3. Current solution

A working web application. Nothing to install.

**The closet.** The shopper adds garments they own, usually by pasting a product URL,
and reports **which way each one misses** on a signed scale — *too tight · a bit snug
· just right · a bit roomy · too loose*. One tap, with *"just right"* pre-selected
because that is the answer roughly three-quarters of the time in both public fit
datasets — so the common case costs nothing and only the informative answers require
effort.

That signed direction is the decision the product turns on. A star rating cannot
distinguish *"this is strangling me"* from *"this is hanging off me"*, and **those
imply opposite recommendations.** Every size-recommendation system in the published
literature models fit as a bipolar ordinal; a unipolar quality score discards the
field's standard signal at the point of entry.

**The size check.** Paste any product link. The engine reads the page's size chart —
structured data, on-page tables in either orientation, English or Chinese headers,
inch-to-centimetre conversion, Chinese 号型 codes — ranks every available size with a
per-signal reason, and draws the ease: the wearer's silhouette with the garment's
outline around it, at true proportion, centimetre gap printed beside it.

**Explainability is architectural.** The engine is a transparent rule-and-score model
over chest, waist and shoulder in centimetres. **A language model only extracts
product data; it never picks a size.** A recommendation that cannot be interrogated
cannot be trusted, and trust is the entire product. So when no real size chart can be
read, the app says so and caps its confidence; when measurements point one way and the
closet another, confidence falls **and the reason is stated** — *"by your
measurements, XL; by the strongest overall evidence, M."*

**Outcome learning.** Keep/return/exchange outcomes feed a per-user, per-brand bias
term. Brand bias also learns directly from the closet, so it works from the first few
garments rather than requiring a purchase history almost nobody keeps.

**Community — explicitly a hypothesis.** A follow graph, outfit feed, Q&A anchored in
real closets, daily boards and an earned-only badge ladder are built and running. They
exist because a size engine is a tool you stop needing once you know your sizes, so
retention must come from somewhere. **Whether that holds for this audience is
unproven**, and §9 tests it rather than assumes it.

---

## 4. What has changed since the original proposal

**From a size tool to a consumer-owned fit identity.** A calculator is a feature that
can be cloned in a weekend; a profile the shopper owns and carries cannot. That
reframes the competitive question from *"is our recommendation better?"* to *"who owns
the profile?"* — which every incumbent answers with *"the retailer."*

**From measurement-led to closet-grounded.** Most people do not know their
measurements, and asking is expensive. The closet is cheaper to collect and stronger
as evidence: a garment that fits is a measurement someone already took, on a real
body, in a real brand. Measurements are now one signal among several, not the spine.

**From black-box AI to a transparent engine.** Deliberate, and it cost us the
easier-sounding pitch. A scoring model can be tested, explained and audited; a learned
model over the data we have would be neither — and would ask shoppers to hand body
data to something that cannot account for itself.

**From building more to validating demand.** The largest change, and the reason for
this document. The product is further along than the evidence is, so feature work
stops here.

**Community and badges moved from features to hypotheses.** Now built — but held as
*claims about retention that have not been tested*, and explicitly downstream of the
interviews rather than ahead of them.

---

## 5. Target customer and alternatives

**Beachhead: US online apparel shoppers, roughly 20–35, buying across multiple brands
and burned by sizing.** They already keep informal mental notes about which brands run
small; we turn that into a real record. The sharpest wedge inside that group buys
**across sizing systems** — US, EU, UK, JP, CN — where guesswork is worst, no existing
tool helps, and scoring in centimetres pays off directly.

| Approach | Who | Where it leaves an opening |
|---|---|---|
| Purchase/return collaborative signal | True Fit, Fit Analytics | Lives inside one retailer's checkout; the profile dies there |
| Predicted body model from few inputs | Bold Metrics, EyeFitU, Sizebay | Retailer-integrated; the shopper never holds the profile |
| Photo / 3D body scan | 3DLOOK | High friction, high sensitivity, retailer-side |
| Image-based virtual try-on | Google VTO, the diffusion-model wave | Transfers **appearance, not fit** — Google's own TryOnDiffusion states it does not promise fit |

⚠ All vendor accuracy and returns-reduction figures are **self-reported**, several
vendors' pages are internally inconsistent, and we obtained no third-party benchmark
(`docs/design/fit-algorithm-research.md`). They are evidence the approach is
commercially viable — **not** performance we can claim or match.

**The alternatives that actually matter** are not vendors. They are the five
workarounds in §2: the size chart, the reviews, the memory, buying two sizes, and
giving up. Those are free, familiar, and on every product page. **Any honest read of
our position starts there**, because a shopper switching to us abandons a habit, not a
subscription — which also sets the bar for the interviews: not *"would you use this?"*
but *"what did you do last time, and what would have had to be true for you to do
something else?"*

---

## 6. Current status

**The MVP works and is deployed** at `fit-passport.vercel.app`, on Vercel with a Neon
Postgres database. **265 automated tests pass.**

| Area | State |
|---|---|
| Transparent fit engine, per-signal reasoning, signed fit scale | Built |
| Product-page extraction (structured data, tables, chart-image OCR, 号型) | Built |
| Confidence that falls when signals disagree, with the reason stated | Built |
| Ease figure on the size check | Built |
| Closet, collections, edit history, outcome recording | Built |
| Brand bias learned from the closet and from outcomes | Built |
| Privacy: share a closet by code, never measurements | Built, enforced in the data model |
| Community: follow feed, Q&A with closet evidence, boards, badges | Built |
| Moderation: report, block, review queue, rate limiting | Built |
| Phone layout | Built |

**Two honest engineering limits.** Some retailers refuse automated fetches outright —
measured in production, H&M returns 403 — and we have declined to buy past that (§10).
And item photos currently live inside Postgres, capping a cohort at roughly 340 users
before writes fail for everyone; that is a code change plus a free storage tier, and
it is required before inviting a real group.

> **The point that governs everything below: a finished product is not a validated
> market.** We have built the thing. We have not shown that anyone wants it badly
> enough to change what they do. Those are different claims, and conflating them is
> the most common way a project like this fails while looking healthy.

---

## 7. Business model hypotheses

**None of this is a plan. All of it is a hypothesis**, stated with the condition that
would have to hold.

**H1 — Freemium with a premium tier.** Core size check free; depth is paid —
unlimited closet history, deeper analytics, advanced finishes and badges. *Holds only
if* a meaningful minority use the product often enough for depth to matter.
Contradicted if interviews show it is used a handful of times and abandoned once
someone knows their sizes.

**H2 — Affiliate on the purchase.** When we give the right size and the shopper buys
with confidence, an affiliate link aligns us with *the purchase working out* rather
than with impressions. *Holds only if* we sit close enough to the buying moment to
earn attribution — and only if it can be done without the recommendation becoming a
sales pitch, which would destroy the trust the product is built on.

**H3 — A fit API for retailers, later.** The same engine attacks a store's largest
returns cost, with per-brand fit-truth as the pitch. *Holds only if* the crowd
fit-knowledge becomes deep enough to be worth buying — which is downstream of consumer
adoption, not parallel to it. Not being pursued now.

Every path is downstream of one asset: structured, honest, consumer-owned fit data at
scale. We build that first; monetisation follows the data. Charging before the data
exists would mean selling a calculator.

---

## 8. Where this goes beyond the beachhead

Three directions. **None of them is built**, and each is listed with what actually
exists today so the distinction is not blurred.

**Budget styling contests — the retention bet, and a new idea since the original
proposal.** A theme plus a spending cap; members submit a look with itemised prices;
the community votes; winners take commemorative special-metal badges that cannot be
bought. Three cadences are designed — **$100 weekly, $1,000 monthly, $10,000
seasonal** — because *a budget makes taste comparable and levels the field*, which is
what turns a feed into a competition anyone can enter. **Status today: designed in
`docs/design/community-ecosystem.md`, no code.** The deliberate first step is to **run
one $100 contest entirely by hand** and see whether people enter, before any event
tooling is written. Two open questions we would be testing: does a budget contest
attract the fashion audience or only bargain hunters, and do prizes stay status-only
or become real money — the latter changes the legal picture materially.

**Pet fit — carried over from the original proposal, still a stretch.** Harnesses and
coats have the same problem in a worse form: sizing is wildly inconsistent, **the
wearer cannot report discomfort**, and returns are awkward. **Status today: a
`PetProfile` table exists in the schema — species, breed, neck, chest girth, back
length, known-good gear — and no application code reads or writes it.** A placeholder,
not a feature. It stays parked until the human product is validated; building a second
unvalidated audience would be the same mistake twice.

**Non-apparel categories.** The engine scores measurements, not garment types, so
nothing in the architecture is specific to shirts — shoes and rings are the same shape
of problem. Long-range, and mentioned only because it is why the engine was built on
centimetres rather than size labels.

---

## 9. Validation plan

**Target: 20–25 shopper interviews**, in two rounds so the second is reshaped by the
first.

**Round 1 — 8 to 10 interviews.** Thirty minutes, semi-structured, **no product shown
in the first half.** That half is about behaviour, not opinion: walk me through the
last time you weren't sure about a size; what did you look at; what did you actually
do; have you ordered two sizes, and what made you. Stated preference about a product
someone has just been shown is close to worthless — we need what they did last month.

Five reads per interview:

1. **Problem intensity** — irritation or real cost? Target: ≥60% describe a specific
   recent instance unprompted.
2. **Current behaviour** — which of the five workarounds, and what does it cost them?
3. **Concept acceptance** — does closet-as-evidence land, or read as more work?
4. **Privacy** — how do they react to entering body data, and does *"measurements
   never leave; only your closet is shareable"* change that?
5. **Willingness to pay** — against the specific hypotheses in §7, never as an
   abstract "would you pay".

**Round 2 — the remaining interviews**, guide revised on Round 1's findings. Personas
are built after this round, so they come from evidence.

**Then usability testing**, 8–10 sessions on the live app, measuring the closet-entry
burden specifically: how many garments does someone add before stopping, and does the
one-tap fit scale hold up outside our own assumptions about it?

**Then a small beta**, 10–15 users: recommendation agreement against sizes people
actually own, repeat use within seven days, and whether recorded outcomes visibly
improve later recommendations.

**What would falsify the concept**, written down in advance so it cannot be
rationalised afterwards: if most interviewees describe sizing as a mild annoyance
rather than a cost, if closet entry proves to be the barrier, or if honest uncertainty
reads as weakness rather than trustworthiness — then the consumer product is the wrong
wedge and the retailer-facing engine is the surviving idea.

---

## 10. Risks and immediate next steps

**Insufficient customer need.** The central risk, and the reason for §9. The product's
completeness makes it *easier* to overlook, not harder. Mitigation: behaviour-first
interviews, and falsification conditions written before the data arrives.

**Data-entry burden.** The engine is only as good as the closet, and every field is a
reason to quit. Hence one pre-selected tap instead of a dropdown, no free-text notes
or prompted photos, and deliberately **no drag slider** — measured break-off on
sliders reaches 37% on smartphones against 2.3% for discrete options. Mitigation:
measure drop-off directly in usability testing rather than trusting the argument.

**Open decision — the numeric input mode.** A finer-grained alternative to the
five-option tap was requested as a **1–20 comfort scale**. That form is *unipolar*,
reproducing the exact defect the signed scale removes: 20 is comfortable, but 1
cannot say whether the garment is strangling the wearer or hanging off them. What
shipped instead is the **same signed −10…+10 range at finer resolution**, tapped on a
line with no marker at rest, so "not answered" stays distinguishable from "answered
zero". **The outstanding decision is whether that substitution is accepted**, not
whether to build it.

**Extraction fragility.** Retailer pages change, and some refuse automated requests.
We have **declined stealth-proxy scraping** — not on price but on posture: the case
law protecting public scraping expects technical access controls to be respected, and
a 403 is one. Trading a governance story for size charts is a bad trade for a product
whose differentiator is trustworthiness. The intended answer is a **browser
extension** reading the page in the shopper's own browser, where they are already
welcome — deliberately unbuilt until the interviews justify it.

**Body-data privacy.** Precise measurements are never exposed. Sharing by account code
reveals brands, sizes and a coarse body type; the centimetre fields are not filtered
out of the response, they are never read from the database at all. Every field is
optional, a deactivated account disappears everywhere, and export and deletion are
supported.

**Open decision — what a shared code reveals.** Whether the signed fit direction
should be visible to a code-holder. It is closet information exactly like the
already-public fit rating, and more useful. But direction **points at the body in a
way a star rating does not**: enough signed reports read against published size
charts form a system of inequalities about someone's measurements, and *"precise
centimetres never leave"* is the hardest promise this product makes. Widening what a
bearer code reveals is a governance decision, not a side effect — so it is parked
rather than defaulted into.

**Platform terms.** The current hosting plan forbids commercial use — a licence term,
not a resource limit, applying the moment the project charges anyone.

### Immediate next steps

1. **Revise the interview guide** for a product that now exists — the current draft
   predates deployment and still asks hypothetical questions.
2. **Run Round 1** (8–10 interviews) and synthesise.
3. **Move item photos out of the database**, before any cohort beyond a handful.
4. **Revise the guide, run Round 2**, and build personas from the findings.
5. **Decide the browser extension on the evidence**, not before it.

**Nothing on this list is a new feature.** The next thing this project needs is not
more product.

---

*Supporting material: `docs/prospectus/` · `docs/business/` · `docs/design/` (fit
research, closet-signal and interaction-cost analysis, fetch strategy, cost model,
identity threat model) · `DEVLOG.md` · the source in `app-web/`.*
