# Size charts that are not `<table>`

**Wait for the benchmark to rank it. Likely the biggest single win.**

## The problem

Gap builds its chart from `<div>`s; Arc'teryx holds it in framework JSON. Both are
**invisible to the capture and to the parser**, which look for `<table>`. And
because the capture is an allowlist, what it sends then contains nothing for the
LLM path to read either — so the fallback cannot save it.

Measured, `results/2026-09-29-live.md`: the server path read a page chart on
**0 of 11** cases; the extension path on 3.

## The fix, smallest first

Send the size-guide dialog's **text** when it holds no table, so the LLM path has
something to work with. That is a capture change plus a parser entry point, not a
new extraction strategy.

## Done when

At least one non-table case (Gap or Arc'teryx) produces a chart, and the before/
after appears in the results file. Red-then-green with the real page as fixture.
