# Fit Passport — Business Model Canvas (v0.1, W1 hypothesis)

Everything here is a **hypothesis** to be tested in W2–W4 interviews. We'll
rewrite this file to v1 in W4 after synthesis.

## 1. Customer Segments
- **Beachhead**: US-based cross-brand online apparel shoppers, ages 18–40, who
  buy from ≥2 brands per quarter and have felt sizing friction within the past
  90 days.
- **Adjacent**: households with multiple people ("household fit wallet"), pet
  owners buying size-dependent gear (secondary, tested via prototype only).
- **Explicitly not the target now**: enterprise retailer buyers (they're the
  audience for True Fit / Sizebay). Fit Passport starts consumer-first.

## 2. Value Propositions
- **For shoppers**: "One profile, any store — with the *why* behind every size."
  You don't guess. You don't measure twice. You don't lose an hour to reviews.
- **What we uniquely offer** (vs True Fit/Sizebay/Doppl):
  - Ownership: your profile follows you, not the retailer.
  - Explainability: every recommendation carries per-signal reasons.
  - Learning: every return you record makes the next recommendation smarter.

## 3. Channels
- **W1–W15 (MVP)**: responsive web app, paste-a-URL flow.
- **Post-semester**: browser extension on product pages, mobile PWA, share-a-passport link (household), affiliate integrations, retailer/marketplace APIs.

## 4. Customer Relationships
- Self-service; opinionated onboarding (3 minutes to first useful recommendation).
- Zero-friction outcome capture (one email/reminder after typical delivery windows).
- Privacy-forward messaging: your data is yours; export/delete visible.

## 5. Revenue Streams (hypotheses — will be tested with willingness-to-pay questions in interviews)
- **Freemium subscription** — free tier: 5 checks/mo, 3 closet items. Premium ~$4–7/mo: unlimited checks, household profiles, keep-history intelligence.
- **Affiliate** — commissions when a user clicks through and purchases.
- **API/B2B (Phase 6+ only)** — retailers pay to embed the confidence-explained recommendation on their PDP.

## 6. Key Resources
- Fit profiles (the passport data itself — the "moat" if we retain users).
- Structured product schema + extractor coverage.
- Labeled fit outcomes (users' keep/return/exchange history) — this is our compounding asset.
- Engineering + AI service costs.

## 7. Key Activities
- Customer discovery (weekly).
- Product extraction breadth & robustness.
- Engine tuning + back-testing.
- UX iteration on the "confirm extraction" step + explanation copy.

## 8. Key Partnerships
- **Cloud & AI**: Vercel / Neon (Postgres) / OpenAI or Anthropic APIs for extraction. (Pricing hypothesis: <$0.05 per 100 checks.)
- **VTO integrations** (later): existing 3rd-party APIs, not custom-trained.
- **Affiliate networks**: e.g., Skimlinks, direct brand affiliate programs.
- **Pet brands** (later): Ruffwear / Chewy for pet-fit data.

## 9. Cost Structure
- Engineering time (mostly student now).
- Cloud + database: <$50/mo through W15.
- LLM/API calls: <$50/mo through W15 with fixtures + capped calls.
- No paid acquisition during course; growth is organic + interview referrals.

## Testable statements (what we'll hold ourselves to in W4 review)
1. ≥60% of interviewees describe a size-related return or hesitation in the last 90 days.
2. ≥40% of interviewees say they'd try a portable profile if it were free.
3. ≥15% say they'd pay $4/mo for unlimited checks + household profiles.
4. At most 2 blocking privacy concerns emerge across all interviews.
