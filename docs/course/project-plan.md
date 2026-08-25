# Fit Passport — Project Plan
_49-800 Start Up Creation in Practice, Fall 2026 · Kong & Qi_

This is the operational plan for the 15 weeks. It complements the detailed
proposal (in `docs/proposals/`) with concrete roles, tools, cadences, and
decision rules.

## 1. Team & roles

| Person | Primary | Secondary |
|---|---|---|
| Xiangchen Kong | Engineering lead (Next.js, engine, data model) · PM for weekly review | Customer interviews (technical/international shoppers) |
| Alyssa Qi | Customer discovery lead · Design/prototype in Figma · BMC/VPC owner | Beta recruiting · Explanation-copy tuning |
| Jenny Cao | *To be assigned* | *To be assigned* |
| Nicolas Wang | *To be assigned* | *To be assigned* |

All four jointly own: the final pitch, the mid-project review, the Reflection Essay.

> Jenny and Nicolas joined the team on 2026-08-25. Their rows are deliberately
> left unassigned rather than guessed — roles get filled in from an actual team
> conversation, not from an assumption about who does what.

## 2. Cadences

- **Tue class** (content) — take the frame Prof. Root gives us and match it to
  Fit Passport by end of class.
- **Thu class** (team work) — 60min working block + 20min review with Prof. Root.
- **Weekly 30-min sync** outside class (Sunday) — plan the week, split tasks.
- **DEVLOG entry** after every substantive work session (see `../../DEVLOG.md`).
- **E of E rehearsal**: 3 dry-runs before Nov 4 (Oct 20, Oct 27, Nov 3).

## 3. Milestones (per proposal §14, refined)

| Week | Focus | Concrete deliverable |
|---|---|---|
| W1 | Frame & tooling | Repo up, DEVLOG live, interview guide v1, competitor map |
| W2 | Discovery round 1 | 8–10 shopper interviews, first insight synthesis |
| W3 | Discovery round 2 + personas | Complete shopper interviews, 3–5 pet-owner interviews, personas v1 |
| W4 | Synthesize + BMC v1 | Value Prop Canvas, BMC v1, MVP scope lock, pricing test |
| W5 | Design | Figma end-to-end, 8–10 usability tests |
| W6 | Extraction spike | LLM/VLM extractor across ≥3 real retailers, user-confirm step |
| W7 | **Mid-project review** | Present: problem, solution, viability, customer, risks, plan |
| W8 | MVP wiring | Onboarding + closet + URL import + persistence (already done for demo user; harden for beta) |
| W9 | Engine + confidence | Weights tuned against back-tests; confidence calibration |
| W10 | Feedback loop | Post-purchase KRE flow; outcome-driven re-scoring |
| W11 | Regional + pet | Regional size chart normalization; pet-profile prototype |
| W12 | Alpha | QA, privacy pass, analytics, beta protocol |
| W13 | Beta with ~10–15 users | Recommendation, confidence, usability, repeat-use data |
| W14 | Analyze | Baseline vs personalized; effect of feedback; pet extension read; BMC v2 |
| W15 | Final pitch | Demo, findings, roadmap, Reflection Essay submitted |

**Fixed dates**: Evening with Entrepreneurship — **Nov 4** (approx W10).
Final panel — approx **Dec 12**.

## 4. Definition of "done" per week
Every Thursday we must be able to answer three questions in one page:
1. What did we learn? (interview quote, back-test number, usability failure)
2. What did we ship? (link to file or Figma frame)
3. What is the ONE most important thing next week? (single sentence)

## 5. Risk register (short — see `risks-and-legal.md` for the full one)
- **Interview access.** Recruiting shoppers takes lead time. Start Sunday W1.
- **Extraction fragility.** Real retailer pages break parsers weekly. Fixtures
  keep the demo reliable at E of E; live parsing stays behind a "confirm" step.
- **Data sensitivity.** Body measurements + purchase history are personal. All
  fields optional; explain each field; export & delete supported.

## 6. Success metrics (what we'll report at final)
| Metric | Target | How measured |
|---|---|---|
| Problem intensity | ≥60% of interviewees describe a recent size-related friction | Interview coding |
| Recommendation agreement | Recommends the actually-owned size within ±1 slot on ≥70% of back-tested items | `fitEngine` back-test harness |
| Purchase confidence lift | +1.0 average confidence (5-pt scale) between "chart only" and "Fit Passport" concept tests | Usability tests |
| Feedback lift | Post-outcome recommendation shifts on ≥70% of matched cases where a return signal exists | Instrumentation |
| Repeat intent | ≥50% of beta users check a 2nd product within 7 days | Analytics |
