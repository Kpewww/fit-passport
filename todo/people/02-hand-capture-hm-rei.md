# Hand-capture the two retailers that refuse automation

**Who:** anyone with Chrome and the extension loaded. **Effort:** ~10 minutes.

## What

`hm-regular-fit-tee-mens` and `rei-rainier-rain-jacket-mens` have **no capture** —
the evaluation shows `capture: none` for both, so system S5 cannot be scored on
them at all.

Capture them by hand:

1. Load `browser-extension/` unpacked (see that folder's README, or
   `todo/engineering/` for the walkthrough).
2. Open the product page from `app-web/eval/cases/<id>.json`, **logged out**.
3. Open the size guide if the case file says to.
4. Click the extension icon → **Show exactly what would be sent** → **Save this
   capture**.
5. Put the file where the case file expects it.

## Why by hand

Session 72b measured that a headed browser got past bot protection. **That no
longer holds** — as of Session 75d, H&M and REI refuse automated browsers even
headed ("Access Denied"), and Patagonia intermittently serves "Hang Tight". The
scripted capture path works for the others and cannot work for these two.

This is not a workaround: a person opening a page in their own browser is exactly
what the extension is for.

## Done when

Both cases show a capture in the next `npm run eval` run instead of `—`.
