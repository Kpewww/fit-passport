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

## The product upgrade (approved 2026-10-24)

`docs/plans/product-upgrade-2026-10-24.md`: wear calendar and "what fits today" during the pilot, then the
sizing page, photo AI (cutout, try-on, hair, style profile), community modules, and full export/deletion.

## Right now, the shortest path

**Start the pilot** (`docs/pilot-guide.md`). The code has nothing left blocking it, and only real
purchases measure whether the recommended size was right (/admin, "Was the recommended size right?").

**What goes on this board:** long-lived targets and concrete to-dos only. Coursework (sprint scope,
reports) lives in `coursework/`.
