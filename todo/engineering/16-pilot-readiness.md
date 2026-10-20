# Before real users: what a first-time walk through the live site found

**Status, Session 100d (2026-10-20): every item below is fixed** (P2 in 100e), except item 6.
Item 6 is built and waits for the founder to create a Vercel Blob store.

**Session 100, 2026-10-19.**
- **How it was walked.** A made-up person went through www.fitpassport.fit twice:
  - on a desktop in English (1440 px);
  - on a phone in Chinese (390 px, iPhone user agent).
- **The script** is Playwright, screenshotting every step: home, onboarding, the
  passport's units, adding a piece, /check with a real link, a blocked store and an
  uploaded chart, history, help, privacy, the extension page, claiming an account,
  logging in elsewhere, and deactivating.
- **Code reading.** The pre-pilot audit of the code (same session) is folded in. Each
  item says what was SEEN on the live site, and what was only read in the code.

The pilot may run in CMU groups, on Xiaohongshu and on Reddit, so phones, Chinese and
inches/pounds all matter.

## P0 — before anyone outside the team

1. **The production `ANTHROPIC_API_KEY` is rejected (401 authentication_error).** SEEN.
   - **Found by**: an uploaded chart on production, whose read failed in 0.8 s; the
     `detail` field added this session names the cause.
   - **What it breaks**: every model call in production — picked chart pictures,
     uploaded charts, reading a page with no table, and the image fallback. All of them
     fail quietly into other paths.
   - **Fix (founder)**: a valid key in Vercel, plus a monthly spend limit
     (`todo/people/06`).
2. **A US shopper cannot enter inches in onboarding, and the error does not say why.**
   SEEN.
   - On onboarding, "40" in the chest field (cm only) gives "Something went wrong.", and
     nothing says it is a unit problem.
   - /passport has cm/in and kg/lb switches, but the choice is not saved (code).
   - The save is all-or-nothing, so one value out of range loses the whole form.
   - **Fix**:
     - inches and pounds in onboarding, defaulted by region and saved;
     - the field that failed named in the error;
     - a value that only fits in inches (chest 30–60) met with "did you mean inches?".
3. **Errors appear below the converter and the evidence guide.** SEEN on the phone.
   - A refused check prints its message more than a screen below the button, so on a
     phone nothing seems to happen.
   - **Fix**: put the message straight under the link box, and scroll to it.
4. **No error logging and no events.** Code: no Sentry, no `error.tsx`, page views only.
   - A pilot would not learn where people fail.
   - **Fix**: error logging, plus about six events: check run, check refused (with
     code), chart uploaded, piece added, account claimed, extension connected.
5. **No way to tell us something is wrong from inside the product.**
   - **Fix**: a small "Feedback" link on every page that opens a short form: page,
     message, optional contact.
6. **Closet photos are still in Postgres** (`todo/engineering/07`). Writes fail for
   everyone after about 340 users with 10 photos each.

## P1 — in the first week of a pilot

7. **A real product link from a big store fails on the website.** SEEN.
   - Uniqlo's own product URL is refused ("no size chart we could read"), because its
     chart loads by script. The demo chip works only because it is a curated sample.
   - The first thing a new visitor does is paste the link they have, and it fails.
   - **Fix**: on that refusal, offer the next step right there: "take a screenshot of
     the size chart and upload it" (new this session), or the extension on a desktop.
8. **Phones are told to "Add to Chrome".** SEEN.
   - The phone home page's main button is 添加到 Chrome. Pasting a link is folded into
     a small line, and the refusal text says "open it in Chrome".
   - **Fix**: on a phone, lead with "paste a link or upload a size chart".
9. **The header still says "Claim account" after claiming.** SEEN on desktop, on the
   success page. It looks as if it did not work.
10. **Adding a piece: the first box on the page is the link box.** (Correction: the "focus" was the walk script's own typing; the page never focused it.)
    SEEN. The brand question sits below it, so a person who starts typing puts the
    brand into the link box. **Fix**: focus the brand box, and put the link shortcut
    under it as "or paste a link".
11. **Logging in on a second device does not bring what you did anonymously.** Code:
    the anonymous account's data is not merged. **Fix**: offer to merge, on login, when
    the anonymous account holds anything.
12. **Leaving.**
    - There is no terms page.
    - "Deactivate" keeps every row, and erasure is by email.
    - The footer says "Precise measurements never leave your account", which the poster
      review just corrected to "never shared with other users".
    - **Fix**: a terms page, a real delete, and the same honest privacy sentence
      everywhere.

## P2 — polish

13. **The "Save your passport" nudge** says your data is lost "when you close the
    browser". The cookie lasts a year. Say what is true: "on another device, or if
    cookies are cleared".
14. **Help has no "my check failed" section** covering a blocked store, no chart, or
    the extension not connected.
15. **The demo closet** overwrites the wearer's own body (`/api/demo`). It should not
    touch a body the person entered.
16. **The extension's welcome page** always says "connected", even when third-party
    cookies stop it.

## Left over from the walk

- **A claimed test account still exists in production.** The desktop run's account,
  code **FP-SJSK-DJDV-8N527**: no closet, the made-up body, three checks. Its password
  was not logged, so it could not be deactivated.
- **The phone run's account was deactivated**, which is a soft delete. Both should be
  removed in the database.
- The anonymous visitors the two walks created are ordinary anonymous rows.
