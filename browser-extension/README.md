# Fit Passport browser extension

Check your size on the product page you're looking at. The extension reads the
page **in your own browser**, sends Fit Passport only the product parts of it, and
shows the size the Fit Passport engine recommends, with its reasons and where
every number came from.

It exists because many retailers refuse server-side requests: their bot
protection detects headless automation, and the configuration that gets past it
needs a real browser window, which a serverless function does not have (see
`docs/design/brand-size-charts.md` §2–2b, invariant (53)). Your browser, looking
at a page you opened, is not what they refuse.

**The extension decides nothing.** Parsing, the body-versus-garment reading, every
refusal and the recommendation itself all happen on the server, in the same code
as the website (`app-web/src/lib/extractorLLM.ts`, `pageParse.ts`, `fitEngine.ts`).
There is one engine, and it is the one with the tests.

## How it works

1. You click the toolbar icon. Chrome's `activeTab` gives the extension access to
   **this tab, now**, and nothing else.
2. `capture.js` builds a small document from the page's product parts (below).
3. The popup shows what it found and how much would be sent. **Nothing leaves
   your browser yet.** "Show exactly what would be sent" displays the payload.
4. You press **Check my size**. The popup sends the payload to `/api/check`
   with your Fit Passport session.
5. The popup shows the size, the confidence, the reasons and the source line, or
   the server's refusal in plain words. **Open full explanation** opens the check
   on the website (`/check?product=<id>`).

If the page's size chart only appears after you open a "Size guide", open it and
press **Re-scan**. The extension never clicks anything on the page for you.

**Save to buy** (0.4.0). From the preview or a result, **Save to buy** opens a short
form — name, brand, the size you mean to buy (the page's sizes, with the one you
picked on the page pre-selected), a note — and saves it to your to-buy list on the
website (`/saved`, `POST /api/saved`). After a check, the stored check is referenced
by id; otherwise the same reduced document the preview shows is sent, and the server
reads name, brand and offered sizes from it without calling a model. Saving the same
product twice (tracking parameters ignored) says so and offers to change the saved
size. A saved product is **not** in your closet and never feeds a recommendation;
"Bought it — add to closet" on the website moves it there once you say how it fits.
No new permission: it uses the same session and host permission as a check.

## Install (development)

1. `chrome://extensions` → enable **Developer mode**.
2. **Load unpacked** → choose this `browser-extension/` folder.
3. Open Fit Passport once in the same browser (that creates your session), then
   open a product page and click the icon.

The manifest pins a public `key`, so the extension ID is the same everywhere:
**`odbdhmcfjbhikmlfmgafbkkbknkkaecp`**. No private key exists or is needed for
unpacked use. A Chrome Web Store listing would get the store's key instead.

For local development, pick **localhost:3000** under *Server* in the popup and run
`npm run dev` in `app-web/`.

## Permissions, and why each one

| Permission | Why |
|---|---|
| `activeTab` | Read the tab you clicked on, once, when you click. No access to any other page, ever. |
| `scripting` | Inject `capture.js` into that tab on the click. There are **no** always-on content scripts. |
| host permission for Fit Passport's own origin | Lets the popup call the API. Chrome treats an extension's request to a site it holds host permission for as same-site, so your Fit Passport session cookie goes with it. |

**Not requested:** access to retailer sites, `<all_urls>`, `tabs`, `cookies`,
`storage`, `webRequest`. If third-party cookies are blocked in your browser, the
cookie is not sent and the server answers "connect Fit Passport first". It never
quietly creates a new, empty account.

## What is sent, and what never is

**Allowlist, not denylist.** A page you are logged into shows who you are in more
places than anyone can list, so the capture never tries to strip the private
parts out of a page. It builds a new document from the few parts known to be
product:

- `<title>` and a few product meta tags (og:title, og:description, site name,
  product:brand, description)
- schema.org Product / ProductGroup / BreadcrumbList JSON-LD, cut down to a short
  list of keys. Reviews (other people's names) and offers are dropped.
- the first `<h1>`
- every table that mentions a measurement, rebuilt as plain-text cells, plus up
  to 1,500 characters from the size-guide dialog or a small section around it
- the one sentence that says whether the chart is body or garment measurements,
  taken from its own element
- the size `<select>`'s options, and short `data-size`/`data-value` swatch values
- `<img>` tags that look like size-chart images: their address and alt text only

**Never sent:** forms and their values, cart, account, header, navigation, footer,
reviews, recommendations, iframes, scripts (other than the JSON-LD above), styles,
cookies, storage. Query parameters other than product/variant identifiers are
dropped from the address, and so is the `#fragment`. Emails, phone numbers and
card-like numbers that appear in kept text are masked before sending.

On a real Patagonia product page with the size guide open, that is **11 KB out of
a 1.78 MB page (99.4% smaller)**, captured in about 16 ms.

**On the server:** the page itself is never stored. Only what was read from it is
kept: brand, name, category, the size rows, and where each came from. A test pins
that the page's prose does not survive into the stored record.

## Tests and tools

- `app-web/src/lib/extensionCapture.test.ts` loads `capture.js` into jsdom and
  checks three things:
  - **Round trip:** the server's parser reads the capture exactly as it reads the
    full page.
  - **Privacy:** a logged-in page's greeting, cart, address, form values, reviews
    and scripts never appear in the capture.
  - **Drift:** the constants `capture.js` shares with `pageParse.ts` still match.
  Runs with `npm test`.
- `scripts/try-pages.mjs` runs the whole pipeline on real product pages in a fresh
  logged-out Chromium profile and records the numbers. It is for measurement only:
  a headed browser reading a handful of pages once, which is the curation use
  invariant (52) allows. It never runs on anyone's behalf.
- `scripts/make-icons.mjs` renders `icons/` from the brand masters in `brand/`.

Both scripts need Playwright, which is deliberately not a project dependency
(same arrangement as `app-web/scripts/capture-chart.mjs`).

## Known limits

- A size chart inside a **cross-origin iframe** or a **closed shadow root** cannot
  be read. Open shadow roots can be.
- Charts that load only when opened need you to open them first, then **Re-scan**.
- When the size guide is a separate page (Nike), the product page holds no chart.
  The server then falls back to the brand's curated chart where one exists, and
  says so.
- Size options offered as radio buttons rather than a `<select>` or swatch
  attributes are not read yet, by the extension or by the server's parser.
- The popup closes if you click elsewhere while it waits for the answer.
