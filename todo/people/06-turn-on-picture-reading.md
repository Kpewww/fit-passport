# Turn on reading size charts from pictures

**Who:** the founder (it costs money and needs the account). **Effort:** ~5 minutes.

## What

Session 83 built the picker: when a listing's size chart is only a photo (eBay,
Taobao), the shopper taps it and the server reads that one picture. In production
the button does not appear yet, because `ANTHROPIC_API_KEY` is not set in Vercel
(per `docs/memory/project-fit-passport-deployment.md`; not re-checked in Vercel).

1. Create an Anthropic API key and set a monthly spend limit on the account.
2. Vercel → Project → Settings → Environment Variables → `ANTHROPIC_API_KEY`
   (Production), then redeploy.
3. Try it on a listing whose chart is a photo; tell engineering how it read.

## Cost (estimated, not measured)

Anthropic bills an image at roughly width × height ÷ 750 tokens, so a ~1000 × 1000
chart is ~1,300 tokens: about $0.002–0.005 per read with Haiku 4.5. Each picture is
read once for everyone (cached), at most 20 picks per user per hour. The same key
also switches on the existing text reader for pages without a table (up to ~$0.02
per page, `extractorLLM.ts`).

## After

Add the feature to the store listing (`docs/store/chrome-web-store.md`) only once it
works in production — the listing must not promise a switched-off feature.
