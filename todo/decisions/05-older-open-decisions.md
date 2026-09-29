# Still open from before Sprint 5

Four decisions that predate this sprint and have not moved. None blocks code that
is currently being written; each blocks something specific.

## 1. The wordmark typeface — blocks the logo lockups entirely

Italic Fraunces in the app is a placeholder, not a choice. Three options were put
up, all OFL 1.1 and free to use in a logo: Fraunces as-is, Inter uppercase tightly
tracked, or Instrument Serif. **Recommended: Inter** — the product's metaphor is a
travel document, and institutional type fits that better than editorial type.

Cost of waiting: no horizontal or stacked lockup, so no letterhead, no slide
template, no social avatar.

## 2. Should `fitDirection` be visible to an account-code holder?

Currently no — `/api/view/[code]`'s allow-list excludes it, and so do the garment
measurements added in Session 67. Widening what a bearer code reveals changes the
privacy promise, so it is governance rather than a feature side effect.

## 3. The ~21 Next.js advisories against 14.2.35

The only fix npm offers is `next@16`, a breaking major. Most advisories target
features this app does not use (Image Optimizer `remotePatterns`, Pages-Router
i18n, custom servers). Needs a real per-advisory triage — bounded, reading rather
than building, produces a written judgement. Good task to hand to someone.

## 4. The foundation-shade picker

Parked as a researched proposal. Coherent with "one profile, any store" — shade
codes are as incompatible across cosmetics brands as sizes are across labels — but
it is a **second product surface** sharing nothing with `fitEngine.ts`, and skin
tone is a more sensitive data class than anything held today.

## Note on a fifth

**Customer interviews** stay deferred by the founder (2026-08-25). The browser
extension was gated on them and is **no longer** — the founder released that gate
in Session 73. Per-area fit granularity is still gated.
