# Project memory

Durable notes about **why this project is the way it is** — the decisions, the
constraints, and the traps that are not visible in the code.

These are working notes, not polished documentation. Read them the way you'd read
a colleague's engineering notebook: `DEVLOG.md` is the chronological record of what
happened, `docs/design/` holds the researched write-ups, and **this folder holds the
conclusions that outlived their session** — the things you would otherwise have to
rediscover the hard way.

## Start here

| File | Read it when |
|---|---|
| [`project-fit-passport.md`](project-fit-passport.md) | You want the one-page version of what this is |
| [`project-fit-passport-build-state.md`](project-fit-passport-build-state.md) | **Before writing any code.** Architecture, data model, and the numbered invariants that must not be broken |
| [`project-fit-passport-performance.md`](project-fit-passport-performance.md) | Before touching animation, scroll, or the badge rendering — every trap here has already been hit once |
| [`project-fit-passport-deployment.md`](project-fit-passport-deployment.md) | Anything involving production, migrations, or env vars |
| [`project-fit-passport-design-system.md`](project-fit-passport-design-system.md) | Any visual change — palette, type, motion, card, badges |
| [`project-fit-passport-next-steps.md`](project-fit-passport-next-steps.md) | You're deciding what to work on — **the current list is at the BOTTOM of that file** |
| [`project-fit-passport-closet-signal-design.md`](project-fit-passport-closet-signal-design.md) | Before touching the closet fit rating, `brandBias`, or confidence |
| [`project-fit-passport-logo.md`](project-fit-passport-logo.md) | Anything touching the mark, its files, or small-size rendering |

Also here: the identity/sharing threat model and the community-ecosystem plan.

## The three standing principles

- [`principle-no-brand-imagery.md`](principle-no-brand-imagery.md) — brands appear as
  **text only**; images are **user-uploaded only**. A trademark and copyright
  decision, not a stylistic one.
- [`principle-research-grounded.md`](principle-research-grounded.md) — every feature
  rests on cited research and commercial precedent. This is also what reviewers
  press hardest on.
- [`principle-evidence-and-logging.md`](principle-evidence-and-logging.md) — every
  *claim* needs a checkable source and unverified ones are labelled; every push
  owes a DEVLOG entry; memory changes are published here, curated.

## What is deliberately NOT in this folder

Notes about a team member personally, about how anyone prefers to work with an AI
assistant, and about the setup of one particular development machine stay out of
the repository. None of it is project knowledge, and a path that was true on one
machine actively misleads on the next.

Credentials are **never** recorded here — not in the private copy either. Connection
strings, API keys and admin passwords live in the Vercel environment variables and
in the seeding script's output. If you find one written down in this folder, that is
a bug: remove it and rotate the credential.

## Currency

Everything here is current as of **Session 72 (2026-09-08)** — 419 tests, live,
the closet add form rebuilt as a four-question flow, and the brand assets moved to a
top-level `brand/` because the app builds from them. `docs/RESUME.md` is the cold-start brief and matches.

Two habits this folder has had to learn the hard way, both recorded in
[`principle-evidence-and-logging.md`](principle-evidence-and-logging.md):

- **No machine paths.** The project has moved computers twice; every hard-coded
  path died with the move and left notes that actively misled. Setup recipes live
  in `docs/RESUME.md` and name no machine.
- **Sweep for personal details on every pass, not once.** The Session 43 sweep
  caught an email in the build-state notes but missed one in `docs/RESUME.md`,
  which survived five more sessions.

## Keeping it in sync

These files are a **copy**. The working set lives outside the repo, in the assistant's
project memory directory, and both are updated together at the end of a session.
If you edit a file here, say so — otherwise the change will be overwritten the next
time the two are synced.
