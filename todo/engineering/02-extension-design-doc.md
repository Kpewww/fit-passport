# Write `docs/design/browser-extension.md`

**Start now. Small. It is an owed Sprint 5 deliverable and it does not exist.**

## What

The durable design record for the extension, next to `fetch-strategy.md` and
`brand-size-charts.md`. `browser-extension/README.md` already covers install,
permissions and what is sent — that is operator documentation. This is the
**reasoning**, which belongs where the other architecture decisions live:

- Why the extension exists at all: the measured chain from Session 70 through 75d
  (blocked → not IP-blocked, headless detected → headed worked → **headed no longer
  works reliably**). That last correction matters most; it is the reason a person's
  own browser is the only durable answer.
- Why the extension decides nothing, and the engine stays on the server.
- Why the capture is an **allowlist** rather than a denylist, with the measured
  reduction (1.78 MB → 11 KB).
- The trust boundary: markup from a client is not markup we fetched.
- Known limits, and which are permanent (cross-origin iframes, closed shadow
  roots) versus merely unbuilt (radio-button size options).

## Done when

The file exists, `coursework/technical/deliverables/sprint-5/` can cite it instead
of restating it, and `next-steps.md`'s Sprint 5 item 5 is satisfied.
