---
name: principle-evidence-and-logging
description: "Standing build rules for Fit Passport — every claim needs a verifiable source; every push needs a DEVLOG entry; memory changes get published to the repo"
metadata:
  node_type: memory
  type: feedback
---

Three standing rules, restated and tightened on **2026-08-25**. They govern how
work on this project is done, not what gets built.

## 1. Every piece of data and information must have evidence

No claim, number, or design rationale enters a document, a deliverable, or the
product without a source that can be checked. This extends
[`principle-research-grounded`](principle-research-grounded.md) from *features*
to **every factual statement we make anywhere**.

**How to apply:**
- Fetch the source. Do not cite from memory — a half-remembered paper is a
  fabrication with a citation attached.
- **Label what you could not verify.** If a paper is paywalled, a vendor number
  is self-reported, or a PDF would not yield its method section, say so inline
  and mark it. `fit-algorithm-research.md` and
  `closet-signal-and-interaction-cost.md` both carry ⚠ markers for exactly this;
  follow that pattern.
- **Distinguish a source from a specification.** "This company does something
  like this" is evidence the approach is viable. It is not permission to claim we
  know how they did it.
- When a number is invented as a working device (e.g. the FIC point weights),
  **say that it is invented** in the same breath. An unlabelled made-up constant
  in an outward-facing deliverable is the worst failure mode available to this project.

**Why:** the work is judged on rigor, the differentiation has to be defensible under
questioning, and the product's entire proposition is that its answers can be
trusted. A single fabricated citation would cost more than every feature is
worth.

## 2. A DEVLOG entry is owed for every push, not every session

Tightened in Session 43 after three pushes went out without one. `DEVLOG.md`
is the project's written record of how decisions were made, so a missing
entry is a missing deliverable, not just untidy notes.

**How to apply:** write the entry as part of the change, before pushing. Record
what was built, *why*, what didn't work, and what's next — the reasoning is the
part worth having when a decision is re-examined later.

## 3. Memory changes get published to the repo — curated, never copied

The assistant's project memory and `docs/memory/` are kept in step, so teammates
can read the reasoning without a chat log.

**How to apply — what goes in:** architecture, invariants, decisions and their
justifications, traps that cost real time, backlog and its priority reasoning.

**What stays out:**
- Anything about a person — identity, contact details, working style, preferences.
- One developer's machine setup.
- Anything a teammate does not need in order to work on the project. When in
  doubt about whether a note is project knowledge or context about a person, it
  is about a person: leave it out.
- **Credentials, always and in both copies.** Connection strings, API keys, admin
  passwords, endpoint hosts and org/project ids. Grep the staged diff for
  credential patterns before every commit — the sweep caught a real leak on its
  first run.

See [`README.md`](README.md) for how the two copies are synced.
