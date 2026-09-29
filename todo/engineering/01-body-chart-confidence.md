# Body-chart answers can never earn the +35 the screen offers

**Start now. Does not wait on the benchmark.**

## The bug

`computeConfidence` grants `CONFIDENCE_WEIGHTS.measurements` only when a size has a
**garment** `chestCm`. A body chart puts its numbers in `bodyChestMinCm/MaxCm`
instead, so a body-chart size never qualifies — and body charts are what most US
retailers publish.

Measured: Uniqlo 30%, Nike 30%, Patagonia near-tie 21%. **Every body-chart answer
sits near the floor.**

## Why it is worse than a low number

`/check` renders a checklist that says adding your chest measurement is worth
**"up to +35 points"**. On a body-chart product that offer can never pay out,
whatever the user does. We are asking for a measurement in exchange for something
we cannot give.

That touches the promise invariants ㊱ and ㊴ were written to keep — ㊱ exists
precisely because an earlier draft claimed a flat +35 that the caps could not
deliver.

## Done when

A body-range size earns the measurement weight on the same terms a garment size
does, the three real pages above move off the floor, and a test pins that the
number the checklist promises is the arithmetic the scorer runs.

**Decide together with ㊱/㊴'s wording** — if the payout changes, the sentence on
screen has to match it.

## Why / context

`docs/memory/project-fit-passport-build-state.md`, Session 75c "NEW FINDING".
