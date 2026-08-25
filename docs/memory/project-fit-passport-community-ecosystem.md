---
name: project-fit-passport-community-ecosystem
description: "Fit Passport community/ecosystem plan — PLANNED not built: posts, contests, leaderboards, defensibility"
metadata: 
  node_type: memory
  type: project
  originSessionId: ff70f30d-84e1-4230-9852-546155e0d6ff
  modified: 2026-08-13T05:35:53.795Z
---

Community/ecosystem direction for [[project-fit-passport]] (outlined Session 32, 2026-08-12). **Only step ① (follow + followed feed) is built** — shipped Session 33. Everything else is still plan: the founder said "暂时先不做,先把大纲思路弄起来" about the rest. Full doc in the repo at **`docs/design/community-ecosystem.md`** (read that for detail); this is the summary.

**Founder's premise:** "生态才能维持更好的产品生存" — a size engine gets people in the door but is not a reason to return (once you know your size in a brand, you're done). Retention has to come from ecosystem.

**Our two unfair advantages:** (1) **verified fit context** — every member has a real closet with brands/sizes/honest fit ratings, so "this looks good" becomes "this fits a body like mine, in this size, from this brand"; no other fashion feed can say that. (2) **earned-only prestige** — the badge ladder + metal card are derived from real data, so status is scarce and non-purchasable.

**Three loops:**
1. **Ask & Answer** (utility→habit): post kinds `HELP` / `RECOMMEND` / `VERDICT`; answers can **attach a real closet item** as evidence. Digest of unanswered questions.
2. **Show & Be Seen** (identity→status): OOTD (primitive version shipped = outfits+likes), **Daily Top Outfits** (resets daily so newcomers can win), **Top Stylists** (ranked by earned signals, not followers), and **follow + a followed feed** (**SHIPPED** Session 33).
3. **Compete & Belong** (events→spikes): **budget styling contests** — founder's idea, strong because a budget makes taste comparable: **$100 weekly (Thrift Run)**, **$1,000 monthly (Signature Look, the flagship)**, **$10,000 seasonal (Atelier)**. Theme + budget cap → itemised-price submissions → voting window → winner gets a **commemorative badge** (this is what the special metals amber/jade/amethyst are reserved for) + featured slot. Backlog event shapes: Brand Deep Dive, Fix My Fit, Capsule Challenge.

**Defensibility:** fit-matched discovery ("people shaped like me" — possible without exposing measurements since coarse body type is already public-safe); provenance on every look (brand·size·fit rating·online/in-store, so a look is buyable AND wearable); earned-only status; and crowd fit-knowledge ("brand runs small on broad shoulders") **feeding back into the engine** — that's the real moat.

**Data model sketch (not created):** `Post`, `PostAttachment`, `Answer`, `Vote`, `Follow`, `Event`, `EventEntry`, `EventVote`, cached `Leaderboard`. Reuse the existing `OutfitLike` voter-key pattern (anonymous-friendly + deduped), `badges.ts` for awards, `rateLimit.ts` for abuse.

**Sequencing (smallest first):** ① follow + followed feed — **SHIPPED Session 33, commit 7649f6f** (see [[project-fit-passport-build-state]] for the implementation + the stale-Prisma-Client gotcha it surfaced) → ② Ask&Answer with closet attachments — **SHIPPED Session 34, commit f73c9d8** (`/ask`, receipts via `lib/evidence.ts`, Counsel badge track) → ③ Daily Top Outfits + Top Stylists — **SHIPPED Session 35** (`/api/leaderboard`, `TodayBoard` band on `/community`, weights in `lib/leaderboard.ts`) → ④ **NEXT, and deliberately NOT code: run ONE $100 contest MANUALLY** to validate demand → ⑤ only then build event tooling + commemorative badges → ⑥ fit-matched filtering (needs member density).

**Hard constraints:** everything social stays opt-in; **never** loosen the privacy invariant (precise measurements must never become social/matching data). **Report/flag + posting rate limits + a takedown path SHIPPED Session 36** (commit 2c4c2bb — `Report` model, `hidden` flag, `scripts/moderate.mjs`, Upstash Redis limits; `STOLEN_IMAGE` is an explicit reason per [[principle-no-brand-imagery]]). **Block list + review queue SHIPPED Session 37** (commit 50ac178 — `Block` enforced both ways, `/admin` queue where a human overrides the auto-hide threshold either way). **Still missing before launch: appeals** (a hidden author sees THAT they were hidden but can't reply) and a no-scraped-brand-imagery contest rule. Cash prizes would change the legal posture — status-only is the safer default.

**Open questions:** does a budget contest attract the fashion audience or only bargain hunters? moderate answer quality or let votes decide? follow people or follow brands? prizes = status or real money?
