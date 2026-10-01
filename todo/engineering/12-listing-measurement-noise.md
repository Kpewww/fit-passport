# Calibrate how far a seller's measurement can be off — and decide on photos

**Blocked on:** listings whose garment measurements are known (e.g. a garment you
own, measured by you, then listed or compared).

## What

`LISTING.flatNoiseCm` is **0.64 cm, assumed**: the rounding of a width written to
the nearest half inch. It decides when a judgement says "close to the line" and
drops a step in strength. The full hand-measuring error is larger and unmodelled —
at ±1.3 cm flat every judgement straddled the engine's 4 cm "true to size" band.

1. Collect pairs: a seller's written pit-to-pit against the garment measured
   carefully. Ten is enough to see whether 0.64 is too tight.
2. Put the measured value in `scoringConstants.ts` as `measured` with its n, and
   regenerate the spec table (`node scripts/scoring-table.mjs`).

**Separate question:** sellers often show the tape in a photo. The vision reader
is built for size-chart images; reading a tape laid across a garment is a
different task and was deliberately not attempted. Decide whether to try it, and
only with the user confirming the number it reads.

Reasoning: DEVLOG Session 80e; `docs/design/browser-extension.md` §9.
