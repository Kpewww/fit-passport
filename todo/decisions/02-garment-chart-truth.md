# Decide: what defines the right size on a GARMENT chart?

**No recommendation — this one needs a real choice, and I do not have a defensible
default.**

## The problem

A **body** chart carries the retailer's own rule: "size L fits a 104–112 cm chest"
tells you directly who it is for, so ground truth is just reading it.

A **garment** chart says the thing measures 112 cm flat and says nothing about who
should wear it. Turning that into a right answer needs an assumption about how much
room a person wants — ease — and **our engine's ease constants are exactly what is
being tested**. Using them to score ourselves is the engine grading its own paper.

## The options

1. **Leave garment charts unscored** (what the harness does today). Honest, and it
   shrinks the benchmark to body-chart cases.
2. **Adopt a published external ease reference** and cite it. Needs a source we can
   defend; this is a research task before it is a code task.
3. **Score them only against the retailer's own recommendation** where the page
   states one ("model is 6'1" and wears M").

## Why it is blocking

It decides how many of the 11 cases can be scored at all, so it shapes what the
Sprint 5 report can claim.

## Why / context

Invariant 66 and `app-web/eval/README.md`.
