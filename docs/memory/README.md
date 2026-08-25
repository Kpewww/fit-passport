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
| [`project-fit-passport-build-state.md`](project-fit-passport-build-state.md) | **Before writing any code.** Architecture, data model, and 14 invariants that must not be broken |
| [`project-fit-passport-performance.md`](project-fit-passport-performance.md) | Before touching animation, scroll, or the badge rendering — every trap here has already been hit once |
| [`project-fit-passport-deployment.md`](project-fit-passport-deployment.md) | Anything involving production, migrations, or env vars |
| [`project-fit-passport-design-system.md`](project-fit-passport-design-system.md) | Any visual change — palette, type, motion, card, badges |
| [`project-fit-passport-next-steps.md`](project-fit-passport-next-steps.md) | You're deciding what to work on |

Also here: the identity/sharing threat model, the community-ecosystem plan, and the
course requirements.

## The two standing principles

- [`principle-no-brand-imagery.md`](principle-no-brand-imagery.md) — brands appear as
  **text only**; images are **user-uploaded only**. A trademark and copyright
  decision, not a stylistic one.
- [`principle-research-grounded.md`](principle-research-grounded.md) — every feature
  rests on cited research and commercial precedent. This is also what the course
  grades on.

## What is deliberately NOT in this folder

Notes about the founder personally, about how he prefers to work with an AI
assistant, and about the setup of one particular development machine stay out of
the repository. None of it is project knowledge. (The Windows-specific commands
that *are* useful live in [`README.zh-CN.md`](../../README.zh-CN.md) instead.)

Credentials are **never** recorded here — not in the private copy either. Connection
strings, API keys and admin passwords live in the Vercel environment variables and
in the seeding script's output. If you find one written down in this folder, that is
a bug: remove it and rotate the credential.

## Keeping it in sync

These files are a **copy**. The working set lives outside the repo, in the assistant's
project memory directory, and both are updated together at the end of a session.
If you edit a file here, say so — otherwise the change will be overwritten the next
time the two are synced.
