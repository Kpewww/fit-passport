# Risks, Legal & Governance

Three concerns were raised against the proposal on 2026-08-09, and this document is the answer to the third:
1. Customer problem clarity → addressed by [`interview-guide.md`](./interview-guide.md) and W2–W3 interviews.
2. Product-market fit → addressed by the hypothesis-tests in the [Project Plan](./project-plan.md) and BMC.
3. **Legal & governance** → this doc.

We treat "legal & governance" as three separate categories: **(A) data on
people**, **(B) data from retailer pages**, and **(C) how we describe what
the tool does**. Each has concrete decisions or open questions we'll answer
by W4.

---

## A. Personal data (biometric-adjacent + purchase history)

Body measurements, height, weight, and purchase outcomes are personal data. In
some jurisdictions (California CPRA, EU GDPR) height/weight can be treated as
personal data with heightened expectations even if not strictly "biometric."

**Decisions already made in the MVP:**
- All measurement fields are **optional**. Nothing blocks onboarding.
- Each measurement is stored explicitly (typed columns), not in a blob, so
  future export/delete is straightforward.
- No third-party ad SDKs. No analytics that would sell/share the profile.
- Retention: at MVP stage, data is scoped to a single demo user in
  `dev.db`. There is no shared database. Before we recruit a real beta (W13),
  we will add: a per-user delete endpoint, an export endpoint (JSON), and a
  short privacy notice.

**Open questions for W4:**
- Should we present the profile as "your data" (stored on our server) or
  "on-device" (LocalStorage/browser first)? Interviews will tell us.
- If we go server-side, do we minimize by storing only *ranges* rather than
  point measurements?

**Explicit non-goals at this stage:**
- No photo capture, no body scanning. Doing photo-based sizing pulls in
  biometric-data regulation and consent complexity that is out of scope per
  proposal §9.
- No health-related interpretation (no BMI, no "you should size up because…").
  We recommend garment sizes, not medical advice.

---

## B. Data from retailer pages

Automated scraping of retailer product pages sits in a gray zone across
Terms of Service, jurisdictional case law (e.g., hiQ Labs v. LinkedIn in the
US, but *very* fact-specific), and DMCA anti-circumvention rules if pages are
gated.

**Decisions already made:**
- The extractor is **fixture-first** (`app-web/src/lib/extractor.ts`). The
  demo uses hand-curated fixtures for Uniqlo, COS, and Levi's — public sizing
  information restated at a data-model level. This keeps the E-of-E demo
  reliable and avoids depending on live scraping.
- The API layer stores the exact extracted payload and surfaces a
  "we extracted this — confirm" step in the UI (see `/check`). Users can
  override anything before scoring. This matches the proposal §16 mitigation
  literally.
- We do NOT bypass paywalls, logins, or bot-detection. If a page requires
  authentication or resists automated fetching, we fall back to
  user-supplied paste-in fields.
- We do NOT store retailer trademarks, product images, or copyrighted copy
  in a way that competes with the retailer. We store the *structured facts*
  the user needs to make a fit decision (sizes, measurements, material,
  model info) — the same facts a shopper would read manually.

**Open questions for W4:**
- Should we require explicit user opt-in for each retailer we support (a
  toggle list) rather than "any URL works"?
- Is there a class of retailer where we should ONLY accept manual paste-in
  (e.g., paid subscription retailers, direct-to-consumer luxury)?

## C. What we tell users the tool is

- We will **not** market Fit Passport as "medical" or "biometric."
- We will surface a **confidence score** and per-signal reasons on every
  recommendation, so users understand this is a *decision-support tool*, not
  an oracle. The engine's transparency is a governance feature, not just an
  engineering one.
- Marketing copy will not claim we "solved" fit or "eliminate returns."

---

## D. Expert consultations we should book

We have an offer of introductions to specialists on legal/governance. We should
book meetings on:
1. **Privacy law for consumer apps** — a walk-through of what "reasonable"
   looks like for a small independent beta, and what we should NOT do.
2. **Terms-of-service risk on scraping** — clear rules for the extractor's
   real (post-fixture) implementation.
3. **Recruiting for interviews / beta** — the IRB & recruiting playbook,
   even if the classroom doesn't strictly require IRB review.

These will be logged in [`../../DEVLOG.md`](../../DEVLOG.md) as they happen.
