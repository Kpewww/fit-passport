# Hand-capture a few eBay listings for the evaluation

**Who:** anyone with Chrome and the extension (0.5.0 or later) loaded. **Effort:** ~10 minutes.

## What

The second-hand judgement (Session 80) was checked live on five eBay shirts, then
by replaying their real title, specifics and description lines — because eBay began
refusing the automated browser halfway through. No eBay capture is in the
evaluation, so it cannot be re-run or scored.

Capture two or three listings by hand, choosing different shapes:

1. one with pit to pit **in the title** (`24" Pit To Pit`);
2. one with it **only in the description** (you will need to press **Read the
   seller's description** and allow it once);
3. one with **only a size** and no measurement.

For each: open the listing logged out → click the extension icon → (read the
description if offered) → **Show exactly what would be sent** → **Save this
capture**. Put the files in `app-web/eval/local/captures/` and note the URLs in a
new case file under `app-web/eval/cases/`.

## Why by hand

An automated browser now gets eBay's "Error Page"; a person's own browser does not
— which is the case the extension exists for. Reasoning and measurements:
DEVLOG Session 80e, and `docs/memory/project-fit-passport-next-steps.md`.
