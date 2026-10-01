# Try reading a size chart from a picture, and cap the spend

**Who:** the founder (it is the founder's API account). **Effort:** ~5 minutes.

## What

Session 83 built the picker: when a listing's size chart is only a photo (eBay,
Taobao), the shopper taps it and the server reads that one picture.

The key is **already set** in production — `/api/check` reports
`features.chartImage: true` (checked 2026-10-01; an older note said it was not). So:

1. On the Anthropic account, confirm a **monthly spend limit** is set.
2. Reload the extension at **0.7.0**, open a listing whose chart is a photo (the
   UltraClub eBay shirt), press **Check my size**, then **The size chart is a
   picture**, and tap the chart. Tell engineering what it read — this is the first
   real vision read; only a cached one has been tested.

## Cost (estimated, not measured)

Anthropic bills an image at roughly width × height ÷ 750 tokens, so a ~1000 × 1000
chart is ~1,300 tokens: about $0.002–0.005 per read with Haiku 4.5. Each picture is
read once for everyone (cached), at most 20 picks per user per hour. The same key
already runs the text reader for pages without a table (up to ~$0.02 per page,
`extractorLLM.ts`).

## After

Add the feature to the store listing (`docs/store/chrome-web-store.md`) once a real
read has been seen to work.
