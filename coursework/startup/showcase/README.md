# Evening of Entrepreneurship showcase (Session 99)

CMU Silicon Valley, NASA Research Park, 4–7 PM. The course email says "Tuesday, Nov 4",
but 2026-11-04 is a Wednesday, so check the date on Canvas. The audience is investors,
VCs, founders and mentors.

| Deliverable | Due | File |
|---|---|---|
| 24" × 36" poster, soft copy (PDF or PNG) | Oct 18 | `out/Fit-Passport-Poster-24x36.pdf` (vector, 24.0 × 36.0 in); `.png` at 150 dpi |
| 30–60 s demo video | Oct 18 | `out/Fit-Passport-Demo.mp4`, 54 s, 1920 × 1080, H.264; English captions, no sound |
| Photo of the printed poster | Oct 28 | **Do not print until Professor Root and the TA approve it.** |

Only the poster PDF, its small preview and the video's cover picture are committed. The
MP4, the 150 dpi PNG and the recorded frames are rebuilt from source, so they are not.

## Brand

Ink, porcelain and a single cobalt accent. Fraunces for display with one italic accent
word, Inter for text, uppercase eyebrows. The copy comes from
`../business/message-architecture.html`:

- the line: "One body. One fit identity. Any store."
- "Honest by construction."
- "A medium is a guess." (the headline), from "The size on the label is a guess dressed
  up as a fact"

There is no retailer logo or model photo anywhere. The product picture is the details
column of the real Uniqlo page (title, colours, sizes), and store names appear only as
text.

## Facts on the poster and in the video

Every number has a source. The poster prints its sources in a footnote, and the video
shows its one stat's source on screen.

1. **24.5%**: Appriss Retail & Deloitte, *2024 Consumer Returns in the Retail Industry*.
   Return rate from online sales 24.52% ($362.16B), all categories, US. Read from the PDF.
2. **#1, 53%**: Coresight Research, *The True Cost of Apparel Returns* (Apr 4, 2023).
   Size/fit is the most-cited reason online apparel is returned: 53% of 100 US apparel
   brand and retailer decision-makers cited it. This is an industry survey, not one of
   ours, and it was sponsored by 3DLOOK.
3. **34%**: Tinuiti, *2024 Apparel Marketing Study*. 34% of apparel shoppers ordered
   multiple sizes or variations in the past year. The sample size is not published.

The product claims ("Built and live") were checked against the code and the live site:

- the site is live and the extension is on the Chrome Web Store;
- it handles US, EU and UK sizes, and Chinese size codes (not JP);
- it offers a 3D fit view based on your measurements.

**Kept off on purpose (founder's review, Oct 16):**
- **The 3D body's 1 cm fit.** It is how closely the model matches the numbers typed in,
  not how accurate a recommendation is, so it is left for questions on the night.
- **103 types / 358 names, the pricing, and the retailer-engine pivot condition.** Too
  much for a 10-second read; they belong in our own discussion material.
- **Absolute coverage claims.** It is not "One click on any product page": the
  extension asks before it sends, and some pages need the size chart opened or a
  re-scan.
- **The privacy line.** It reads "never shared with other users", not "never leave your
  account". Measurements are stored on our server; they are never shown to other users.

No customer interviews have been run yet. The poster says so, and lists the next tests as
hypotheses: will shoppers build a fit profile, and will they come back to it?

## Logos

- **CMU**: the official red square (900 × 900 PNG) from the university brand site.
  Rules: no smaller than 0.75 in, a clear zone of one M-width, not locked up with
  other marks.
- **Integrated Innovation Institute**: the mark from cmu.edu/iii, with the name set as
  text beside it.
- If the course provides its own logo files, swap them into `poster/assets/`.

## The made-up shopper

All product pictures and recordings use a fresh account with the demo closet
(`POST /api/demo`) and an invented body (178 cm, 74 kg, chest 98, waist 84, hip 98,
shoulder 45). It is not anyone's data. The size check is a real read: the extension's
`capture.js` runs on Uniqlo's live product page, and the result is the engine's real
answer (M, 90%).

## Rebuilding

Playwright is not a dependency of the repo. Link a local copy as `node_modules` here
(`poster/` and `video/` link to `../node_modules`):

```sh
npm i playwright@1.64.1 && npx playwright install chromium   # somewhere outside the repo
ln -s <that>/node_modules coursework/startup/showcase/node_modules
```

- **Poster**: `node poster/build.mjs` writes the PDF and PNGs to `out/`. It needs the
  network for Google Fonts. Chrome turns the variable fonts into Type 3 outlines, so the
  PDF is vector and prints sharp, but its text cannot be selected. `poster/measure.mjs`
  logs where each block lands, to check that nothing overflows 3456 px.
- **Product pictures**: these run against the app at `http://localhost:3000`.
  - `capture.mjs` (full pages);
  - `poster-shots.mjs` (the cards);
  - `closet-shot.mjs`;
  - `extension-shot.mjs` (the real extension popup on the Uniqlo page; it uses a copy of
    the extension with that page's origin added to `host_permissions`).
- **Video**:
  1. Build and start the app as production, so there is no dev overlay:
     `npx next build && npx next start -p 3100` (in `app-web/`).
  2. `node video/record-app.mjs` records the size check, the closet and the 3D body
     with Chrome's screencast. The page lays out at 1280 × 606 and is painted at
     1740 × 824 (`--force-device-scale-factor`). The GPU draws the 3D (ANGLE on Metal).
  3. `FFMPEG=<path to ffmpeg> node video/render-stage.mjs` renders every frame of
     `video/stage.html` (title, problem, extension, the recorded product inside the
     same browser window, end card) and joins them into the MP4.
     `render-stage.mjs stills` writes key frames only.
  4. `imageio-ffmpeg` provides a static ffmpeg if none is installed.
