# Prefer the range a chart states over a midpoint band

**Wait for the benchmark. Low risk, small.**

## The problem

When a chart states one value per size, `midpointBand` derives a band at the
midpoints to the neighbours — the reading such a chart is written for. Fine.

But some cells state a **range** and get collapsed to a midpoint anyway, throwing
away the retailer's own boundaries in favour of a derivation. The stated range is
always the better source.

Related and unfixed: the **most-rows table wins** regardless of whether it is the
visible one, so a hidden or secondary chart can beat the chart the user is looking
at.

## Done when

A stated range survives to the engine unchanged, a derived band is used only where
nothing was stated, and the visible table is preferred when several parse.

## Why / context

Build-state Session 75, "Found, measured-first, NOT fixed".
