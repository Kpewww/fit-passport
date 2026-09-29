# Re-capture the evaluation pages, so S5 runs again

**Found in Session 78f.**

## What was seen

`npm run eval` ran **B only**. The S5 (extension) system needs a capture per case in
`app-web/eval/local/captures/`, which is git-ignored and did not come across with the
last machine move. The committed `results/2026-09-29.*` were made with those
captures (`committed: false` in every row), so they cannot be reproduced here.

Without S5 the eval says nothing about the product's main path — the extension
reading a real page — and the stability and guardrail numbers cover only curated
brand charts (3 cases).

## What to do

```bash
node browser-extension/scripts/try-pages.mjs --save-captures app-web/eval/local/captures \
  --ids <case-id>,<case-id>,... <url> <url> ...
```

with the ids and URLs from `app-web/eval/cases/*.json`, **in the same order**. The
`--ids` matter: without them a capture is named after the host
(`patagonia-0.capture.json`) and the eval, which looks for `<case id>.capture.json`,
silently skips it. Run it in a **headed** browser (the retailers'
bot gate detects headless). Then `npm run eval` and compare against
`results/2026-09-29-run2`.

The new captures are a new snapshot of each page, not the old one: report them as
such, and do not tune anything against them (the freeze rule in `eval/README.md`).

## Related

`todo/decisions/01-commit-captures.md` — committing captures would stop this
happening on the next move.
