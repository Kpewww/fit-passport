# Fit Passport

### One body. One fit identity. Any store.

*A consumer-owned fit layer for apparel. Project prospectus — 2026.*

> Xiangchen Kong · Alyssa Qi · Jenny Cao · Nicolas Wang
> Live at **https://fit-passport.vercel.app**

> **This document is a project prospectus, not an offer of securities.** It describes
> the problem, the product as built today, the people we build it for, and where it
> goes next. Figures describing usage are targets and illustrations, not reported
> results.

---

## 1. The problem

**Sizes do not agree, and never have.** A medium in one brand is a large in another;
a 32 waist measures anywhere from 31 to 34 inches of actual cloth; a jacket that
fits your shoulders swims at the chest. The label is a guess dressed up as a fact.

The cost of that guess lands on two parties:

- **The shopper** wastes money, time, and trust. Online apparel returns run around a
  quarter of everything sold, and *"wrong size / wrong fit"* is the single largest
  reason. Every return is a shipping cost, a refund cycle, and a small erosion of
  confidence that makes the next purchase harder.
- **Everyone downstream** pays for it — the retailer eats reverse logistics, and the
  returned garment is often landfilled rather than resold.

The information needed to solve this **already exists** — it is scattered across the
one place nobody has organised it: *the clothes that already fit you.* Your closet is
a dataset of ground truth about your body, brand by brand, and today it is thrown
away at the moment of every new purchase.

**Fit Passport turns that closet into a portable profile you own** — and translates
it to any product page you paste.

---

## 2. The product

Fit Passport is a web application. There is nothing to install. It has five parts,
and the first four all exist and work today.

### 2.1 The Passport

Your fit identity as a single object: a metal charge-card — portrait, holder,
region, preferred fit, a membership number (`No. 00000001`), and a verification
line. Its **finish is themed by your highest earned badge**, and you can set it to
any metal you've earned. It exports as a PNG and reappears as your banner across the
community, so a colour reads as *a person* everywhere in the app. Precise
measurements never appear on it.

### 2.2 The Closet

Your ground-truth wardrobe. Add items by pasting a product URL — the extractor reads
brand, garment type, gender, and size chart from the whole link, not just the last
path segment. Organise into colour-coded collections in a **filing-cabinet view**:
stacked file cards you pull out onto a "desk," a comparison bucket to set items
aside, and edit history. This is the dataset the engine learns you from.

The fit report on each garment is a **signed scale** — *too tight* through *just
right* to *too loose* — not a quality score. That distinction is the whole point: a
garment rated "2 out of 5" is either strangling the wearer or hanging off them, and
**those two imply opposite recommendations.** A star rating cannot tell them apart,
so the closet is asked which way a garment misses, and the star rating is *derived*
from that rather than asked for twice. It is one tap, "just right" is pre-selected
because that is the answer roughly three-quarters of the time, and the informative
answers are the only ones that cost anything.

### 2.3 The Size Check

Paste any product link — bare domains are fine. The engine reads the size chart and
**ranks every available size, with a per-signal reason for each.** Beside each size
it draws the ease — your silhouette with the garment's outline around it, at true
proportion, with the centimetre gap printed next to it. It is a picture of arithmetic
the engine was already doing, and it is deliberately schematic: image-based virtual
try-on transfers *appearance, not fit*, so a photoreal figure would quietly make a
promise nobody in the field can keep. The caption says so.

When the signals disagree, **confidence falls and the app says why** — that your
measurements point one way and your closet another, or that your own reports scatter.
A lower number with no explanation would be worse than no number. A live multi-region
converter sits alongside it. Crucially:

> **The engine is a transparent rule-and-score model, not a black box and not an
> LLM.** Every recommendation shows its reasoning. An LLM is used only to *extract*
> product data from a page — it never decides your size. This is a deliberate, load-
> bearing choice: a fit recommendation you can't interrogate is a fit recommendation
> you can't trust, and trust is the entire product.

### 2.4 The Community

The reason to come back. An opt-in directory of members (each wearing their metal
banner), an outfit feed with likes, a **follow graph and a followed feed**, and
**Ask & Answer** — questions anchored in *real closets*, where an answer can attach a
garment you actually own as evidence. Leaderboards surface the day's top looks and
the most genuinely helpful members. Everything social is opt-in; everything is
moderated (report, block, an admin review queue, rate limits).

### 2.5 The Badges

The prestige layer that makes contribution worth it — an earned-only ladder of
struck-metal medals (see the companion *Badge System* design document). Status here
is scarce and cannot be bought, which is precisely what makes people log honest
data and help strangers.

---

## 3. Why this is defensible

A size calculator alone is a feature, not a company — it can be cloned in a weekend.
The moat is not the calculator. It is what the calculator *creates*:

1. **Verified fit context.** Every member has a real closet with brands, sizes, and
   honest fit ratings. So "this looks good" becomes **"this fits a body like mine, in
   this size, from this brand."** No general fashion feed can say that, because no
   general fashion feed knows what actually fits its users.

2. **Earned-only prestige.** Badges and the metal card are derived from real
   behaviour. Status is visible, scarce, and non-purchasable — a durable reason to
   contribute that a competitor can't buy their way past.

3. **Crowd fit-knowledge that improves the engine.** "This brand runs small on broad
   shoulders" is knowledge the community generates and the engine absorbs. Every
   honest rating and answered question makes the core recommendation better — a
   compounding, data-driven advantage that widens with scale. **This is the real
   moat.**

4. **The privacy posture is a feature, not a cost.** Your account code lets someone
   read your closet and a *coarse* body type — **never your precise measurements.**
   That constraint is enforced in the data model itself, not by policy, and it's what
   lets fit be *social* without being invasive.

---

## 4. Who we build for

Three overlapping audiences, in priority order:

| Audience | The job they hire us for | Why they stay |
|---|---|---|
| **The uncertain buyer** | "Will this actually fit me before I pay?" | Fewer returns, more confidence — the entry drug |
| **The taste-builder** | "I want to dress better and learn how" | A feed of buyable, wearable looks with provenance |
| **The taste-sharer / blogger** | "I want my eye to be seen and to matter" | Earned status; a following built on being right, not loud |

The wedge is the **uncertain buyer** — the pain is sharp, frequent, and universal.
The *retention* comes from turning that buyer, over time, into a taste-builder and
then a taste-sharer. The badge ladder is the rail that carries them along that path.

We deliberately do **not** show scraped brand imagery or logos — brand names appear
as text only, and the only photos on the platform are ones users uploaded
themselves. This is a considered trademark-and-copyright position, and it doubles as
a trust signal: this is *your* data, not a repackaging of the brands'.

---

## 5. What is built today

Fit Passport is a working application, not a mockup — **deployed and publicly
reachable at https://fit-passport.vercel.app.** As of this writing:

| Area | Status |
|---|---|
| Transparent fit engine with per-signal reasoning | **Built** |
| Signed fit scale (too tight ↔ too loose) feeding the engine | **Built** |
| Brand bias learned from the closet, with no purchase history needed | **Built** |
| Confidence that falls when signals disagree, with the reason stated | **Built** |
| Ease figure on the size check — the arithmetic, drawn | **Built** |
| URL extractor (brand / garment / gender / size chart) | **Built** |
| Closet with collections, filing-cabinet view, edit history | **Built** |
| Passport metal card, badge-themed, PNG export, member numbers | **Built** |
| Live multi-region size converter | **Built** |
| Outfits, likes, follow graph + followed feed | **Built** |
| Ask & Answer with real-closet evidence | **Built** |
| Leaderboards (daily top looks, top members) | **Built** |
| Badge system — 20 medals, dimensional, turn-to-inspect, WebGL | **Built** |
| Anonymous session → claim → shareable account code | **Built** |
| Moderation: report, block list, admin review queue, rate limits | **Built** |
| Phone layout: navigation, tap targets, no clipped content | **Built** |
| Coverage: automated tests across engine, badges, extractor, converters | **265 passing** |

**Architecture.** Next.js (App Router) · React · TypeScript · Tailwind · Prisma ·
Zod · Vitest, with Framer Motion for motion and a lazily-loaded three.js for
the badge inspect view only. Local development runs on SQLite with **no API keys and
no cloud services**; production runs on Vercel + Neon Postgres, with the Postgres
schema *derived* from the same source so the two can't drift. Sessions are
HMAC-signed cookies verified byte-identically on both the Node and Edge runtimes.

**Two databases is the architecture's sharpest edge, and it has drawn blood.** A
schema change that was pushed to local SQLite but never written as a migration took
production down for twenty minutes — while typecheck, the full test suite, the
production build and a fourteen-page smoke test all stayed green, because the defect
lived entirely in the gap between the two databases and nothing was looking at that
gap. A test now fails when any column in the schema appears in no migration; it needs
no database of any kind, and it was verified to go red before it was kept.

**User-supplied URLs are treated as hostile.** Every fetch is gated against private
and reserved address ranges, embedded credentials and non-standard ports, with
redirects followed manually and re-checked at every hop — following redirects
automatically invalidates every check made on the original URL, and is the standard
way past a naive guard. A page that is not apparel is refused outright rather than
answered with a confident size.

**Design system.** Black-led, on a cool porcelain workspace, with a single cobalt
accent spent sparingly, and a characterful editorial serif (Fraunces) paired with a
clean sans (Inter) — both self-hosted so a deploy never depends on a font CDN. The
aesthetic target is *fashion-forward, high-end, simple, usable* — taste as a
first-class requirement, because our users have taste and expect the tools they use
to have it too.

---

## 6. How it could make money

Not yet monetised — this is a pre-revenue prototype — but the model is legible and
the data asset points at several honest options, in rough order of alignment:

- **Affiliate on the buy.** When we tell you the right size and you buy with
  confidence, an affiliate link is a natural, non-intrusive cut that aligns us with
  *the purchase working out* rather than with ad impressions.
- **A fit API for retailers.** The same engine, offered to a store as "will this fit
  this shopper?", directly attacks their single largest returns cost. Our per-brand
  fit-truth is the pitch.
- **Premium membership.** Deeper analytics, unlimited closet history, advanced
  badges and card finishes — paid for by the taste-builders and taste-sharers who get
  the most from the ecosystem.

Every path is downstream of the same asset: **structured, honest, consumer-owned fit
data at scale.** We build that first; monetisation follows the data.

---

## 7. Where it goes next

Sequenced smallest-first, so each step proves demand before the next is built:

1. **Deepen the community loop** — richer Ask & Answer, the followed feed as the
   default home, daily top looks. *(Largely built; now about density.)*
2. **A browser extension**, which is the honest answer to the one thing the web app
   cannot do. Some retailers refuse an automated fetch outright, and some size charts
   only exist inside a JavaScript modal. The industry answer is a stealth proxy; we
   have **declined that on legal posture, not price** — the case law protecting
   public scraping also expects technical access controls to be respected, and a
   block is one. An extension reads the page *in the shopper's own browser*, where
   they are already welcome. Nothing to defeat, nothing per request, and it reaches
   the login-walled marketplaces that matter outside the US.
3. **Capture the size chart at the moment an item is added**, which unlocks a
   measured personal ease target in centimetres. The extractor has those numbers in
   hand today and discards them.
4. **Run one budget styling contest manually** — a $100 "Thrift Run" — to test
   whether the fashion audience shows up *before* building event tooling.
5. **Budget contests as a system** — $100 weekly, $1,000 monthly, $10,000 seasonal;
   itemised-price looks, community voting, commemorative special-metal badges for
   winners. A budget makes taste comparable and levels the field.
6. **Fit-matched discovery** — filter any feed by "people shaped like me," using the
   coarse public body type, never measurements. Needs member density to matter.
7. **The retailer fit API** — once the crowd fit-knowledge is deep enough to sell.

The guardrails never move: everything social stays opt-in, precise measurements
never become social or matching data, and no step relaxes the privacy invariant no
matter how useful it would be.

---

## 8. Team & context

Built by **Xiangchen Kong**, **Alyssa Qi**, **Jenny Cao** and **Nicolas Wang**. It is
a functioning MVP and a live deployment, developed under a detailed engineering log,
with a Business Model Canvas, Value Proposition Canvas, message architecture,
customer-interview guide and a risk/legal review maintained alongside the code.

**How the work is done is part of the case.** Every claim in these documents carries
a source, and anything that could not be verified is labelled as such inline rather
than quietly asserted — including our own invented working constants. Design
decisions get written down with the reasoning, and so do the ones that turned out to
be wrong: a claimed-free feature that was not free, a performance diagnosis that was
mistaken, a production outage and the guard that now catches it. A product whose
entire proposition is *"our answers can be trusted"* cannot afford a different
standard behind the curtain.

> The bet, in one line: **the closet is the dataset, the passport is the interface,
> and the community is the moat.**

---

*Companion documents: the Badge System design document (this folder); the business
and positioning documents (`docs/business/`); the design notes — fit-algorithm
research, closet signal and interaction cost, community ecosystem, fetch strategy,
identity threat model (`docs/design/`); the deployment runbook (`docs/DEPLOYMENT.md`);
the engineering log (`DEVLOG.md`); and the source itself (`app-web/`).*
