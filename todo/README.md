# Task board

What to pick up. One file per task, grouped by **who can move it** — which is the
question someone actually has when they open this folder.

| Folder | Meaning |
|---|---|
| [`people/`](people/) | Needs a human doing something a script cannot. **Nothing is blocking these.** |
| [`decisions/`](decisions/) | Waiting on the founder. No work needed first — they need choosing. |
| [`engineering/`](engineering/) | Code. Ordered, with the reason for the order stated. |

## The one rule

**This folder says WHAT to do. `docs/memory/project-fit-passport-next-steps.md`
says WHY** — the history, the measurements, and why the order is what it is. Every
task here links back to its reasoning rather than restating it, because two copies
of an argument drift and the copy people read is usually the stale one (this
project has already paid for that once: `src/lib/colors.ts`, invariant ㉛).

When you finish a task, delete its file in the same commit as the work. An empty
folder is a true statement; a file marked "done" is one more thing to keep in sync.

## Right now, the shortest path

**`people/01-ground-truth.md` unblocks more than everything else combined.** The
Sprint 5 evaluation runs on 11 real pages and has **ground truth for none of them**,
so it can measure what the system *did* and not whether it was *right*. Two people
typing for an afternoon turn the whole benchmark on.
