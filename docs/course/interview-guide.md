# Customer Interview Guide (v0.1)

Structured to test the five hypotheses in the detailed proposal (H1–H5),
and to answer Prof. Root's three concerns: customer problem clarity, PMF, and
legal/governance.

**Format:** 30-minute semi-structured, no product shown in the first half.
Interviewer takes notes; audio recorded with explicit consent; recordings
deleted after coding. Consent script at the bottom.

**Targets W2–W3:** 20–25 shoppers + 3–5 pet owners.

---

## 0. Warm-up (2 min)
- Tell me about the last piece of clothing you bought online.
- Was that a brand you'd shopped with before, or a new one?

## 1. Current sizing workflow (8 min) — tests H1
- Walk me through how you decided what size to order. What did you look at?
- Which parts of the product page did you actually trust?
- Have you ever ordered two sizes of the same item? What made you do that?
- Tell me about a specific time recently when you avoided a purchase because
  you weren't sure about the fit.
- If applicable: what's a brand where you *know* your size cold, and why?
  What made that brand different?

## 2. Returns and outcomes (5 min) — tests H1 + H4
- The last item you returned — walk me through what didn't fit.
- Was it a size problem, or something else (fabric, color, expectation)?
- When you returned it, did you also update anything for yourself — a note in
  your phone, a mental model? Or did that data just... vanish?

## 3. Concept test (8 min) — tests H2 + H3
_Show a plain, low-fidelity mock of the Fit Passport flow._
- Look at this. What do you think this is?
- Would you fill out the profile? Which fields would you skip?
- Would you add three items you already own? How long does that feel like it'd take?
- If this recommended "M with 82% confidence, because your COS shirt is the same cut"
  — would you trust it? What would make you *not* trust it?
- Now show the alternative: a plain retailer size chart. Which do you prefer, and why?

## 4. Willingness-to-pay (3 min)
- If this saved you one return in a busy month, what would that be worth to you?
- Free version = 5 checks/mo. Would you use that? What would push you to upgrade?
- (Don't state a number first. Ask them to think aloud.)

## 5. Privacy & control (3 min) — addresses Prof. Root's legal/governance concern
- How does entering body measurements online make you feel?
- What would make you comfortable? What would make you *not*?
- Would you want your data to be exportable or deletable? Have you ever used
  a service that offered that?

## 6. Wrap (1 min)
- If you had a magic wand for this whole problem, what would you make?
- Anything I didn't ask that you'd want us to hear?

---

## Coding rubric

For each interview, capture:
- **Friction score** (0–3): how many size-related failures in the last 90 days.
- **Concept receptivity** (1–5): how excited/receptive to the passport concept.
- **Trust blockers**: any statement suggesting they wouldn't use the profile.
- **Feature asks**: features they invented on their own (great signal).
- **Willingness-to-pay signal**: any dollar amount they self-anchored to.
- **Privacy concerns**: any specific concern raised.

Interviews live in `docs/course/interviews/` as one file per interviewee (no
PII in the filename; use a UUID). Synthesis in `docs/course/synthesis-W3.md`.

---

## Consent script

> "This conversation will be recorded so I can take better notes. The
> recording is deleted after I finish coding it. Nothing you say will be
> attributed to you by name in any deliverable. You can stop the interview
> at any time, and we can skip any question. Is that okay?"

Recording only starts after a clear "yes."
