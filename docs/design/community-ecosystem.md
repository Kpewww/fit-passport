# Community & Ecosystem — design outline

> **Status: mostly PLANNED.** This is the thinking-ahead document — nothing here is
> implemented except what's marked **SHIPPED**. Written 2026-08-12; step 1 shipped
> the same day (Session 33).

## Why this matters

The sizing engine is the *reason to arrive*. It is not, by itself, a reason to
return — once you know your size in a brand, you're done. Products that survive in
apparel do it on **ecosystem**: other people's taste, other people's bodies, and a
reason to come back weekly.

Our unfair advantage is that we already hold the two things a fashion community
usually lacks:

1. **Verified fit context.** Every member has a real closet with brands, sizes and
   honest fit ratings. So "this looks good" can become **"this fits a body like
   mine, in this size, from this brand."** No other social feed can say that.
2. **A prestige system with real scarcity.** The badge ladder and metal card are
   already earned from real data — so status here is *earned*, not bought.

The strategy: **turn fit data into social proof, and social proof into retention.**

---

## The three loops

### Loop 1 — Ask & Answer (utility → habit)

A member posts a question; the community answers; answers are anchored in real
closets.

- **Post types:** `HELP` ("Will this jacket work on a 178cm/short-torso frame?"),
  `RECOMMEND` ("Best white tee that survives 30 washes?"), `VERDICT` ("Kept or
  returned?").
- **Why we're better:** an answer can **attach a closet item** — brand, size, fit
  rating, and the answerer's coarse body type. The reply carries evidence.
- **Retention hook:** unanswered questions generate a daily digest; answering earns
  reputation.

### Loop 2 — Show & Be Seen (identity → status)

- **OOTD** posts (shipped in primitive form: outfits + likes).
- **Daily Top Outfits** — a rotating leaderboard, reset daily so newcomers can win.
- **Top Stylists** — weekly/monthly ranking by *earned* signals (likes per look,
  answer helpfulness), not by follower count.
- **Follow / feed** — **SHIPPED** (Session 33). `Follow` table, `/api/follow`,
  `/api/outfits?scope=following`, an `Everyone | Following` switch on `/community`,
  follow buttons on member cards, outfit cards and `/u/[code]`. Both sides must be
  claimed so follower counts stay earned. Ordering rules live in `src/lib/feed.ts`:
  the public feed is most-liked-first (discovery), the followed feed is
  newest-first (subscription).

### Loop 3 — Compete & Belong (events → spikes)

**Budget styling contests** — the strongest idea from the founder's list, because a
budget makes taste comparable and levels the field:

| Format | Budget | Cadence | Point |
|---|---|---|---|
| Thrift Run | **$100** | weekly | accessible, high volume, newcomer-friendly |
| Signature Look | **$1,000** | monthly | the flagship — real taste, real effort |
| Atelier | **$10,000** | seasonal | aspirational, press-worthy, luxury audience |

Mechanics: a theme + a budget cap → members submit a look with **itemised prices**
→ community voting window → winners get a **commemorative badge** (a special metal:
amber/jade/amethyst are reserved for exactly this) and a featured slot.

Other event shapes worth keeping in the backlog: *Brand Deep Dive* (everyone posts
one brand's fit truth), *Fix My Fit* (before/after), *Capsule Challenge* (10 items,
30 outfits).

---

## What makes it defensible (not just another feed)

- **Fit-matched discovery.** Filter any feed by *"people shaped like me."* We can do
  this without exposing measurements — the coarse body type is already public-safe.
- **Provenance on every look.** Each piece shows brand · size · fit rating ·
  online/in-store. A look you like is a look you can **actually buy and wear**.
- **Earned status only.** Contest badges use the special metals; the passport card
  finish upgrades with rank. Status is visible, scarce, and non-purchasable.
- **Learning, not just browsing.** "Brand runs small on broad shoulders" is
  crowd-knowledge we can aggregate into the engine — the community *improves the
  product*, which is the real moat.

---

## Data model sketch (when we build it)

```
Post            id, userId, kind(HELP|RECOMMEND|OOTD|VERDICT), title, body,
                outfitId?, createdAt, resolvedAnswerId?
PostAttachment  postId, knownGoodId?   // evidence from a real closet
Answer          id, postId, userId, body, knownGoodId?, createdAt, helpfulCount
Vote            (postId|answerId, voterKey) unique   // reuse the OutfitLike pattern
Follow          followerId, followeeId  unique
Event           id, slug, title, budgetCents, theme, opensAt, votesAt, closesAt
EventEntry      eventId, userId, outfitId, totalCents, itemsJson
EventVote       (eventEntryId, voterKey) unique
Leaderboard     derived, cached daily (do NOT store rankings as truth)
```

Reuse what exists: the `OutfitLike` voter-key pattern (anonymous-friendly, deduped),
`badges.ts` for awards, `rateLimit.ts` for abuse control.

---

## Moderation & safety (must not be an afterthought)

- Everything social stays **opt-in**, as today.
- **Never** loosen the privacy invariant: precise measurements never become social
  data, no matter how useful it would be for matching.
- Needs before launch: report/flag, per-user rate limits on posting, a block list,
  and a takedown path for user photos. Contest entries need a rule against
  scraped/brand imagery (our existing legal position).

---

## Sequencing (smallest first)

1. ~~**Follow + a followed feed**~~ — **SHIPPED** Session 33. Cheapest change with
   the biggest retention effect, so it went first.
2. **Ask & Answer** with closet-item attachments — our unique utility.
3. **Daily Top Outfits** — a leaderboard is just a query; huge perceived liveness.
4. **One $100 contest, run manually** — validate that people enter *before* building
   event tooling.
5. **Event system + commemorative badges** — only after step 4 proves demand.
6. **Fit-matched filtering** — needs enough members to be meaningful.

Steps 1–4 are weeks, not months, and step 4 is deliberately a **manual** experiment.

---

## Open questions

- Does a budget contest attract the *fashion* audience or only bargain hunters?
- Do we moderate answer quality, or let votes do it?
- Is following people or following *brands* the stronger primitive here?
- Contest prizes: status only, or real money/product? (Money changes the legal
  posture — see `docs/course/risks-and-legal.md`.)
