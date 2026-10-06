# The browser extension — why it exists and how it is shaped

> **Status: BUILT (Sprint 5, Sessions 75–75d); design record written Session 78.**
> Operator documentation — install, permissions, what is sent — lives in
> `browser-extension/README.md`. This file is the reasoning behind it, next to
> `fetch-strategy.md` and `brand-size-charts.md`, where the other architecture
> decisions are recorded.

## 1. Why a browser extension at all

Every step of this was measured, and the last step reversed an earlier one, which
is the most important thing in this section.

| Session | Measured | What it meant |
|---|---|---|
| 70 | patagonia.com answers a plain request to a product page with a bare 10-byte `Not found` | Blocked, not unreachable |
| 72b | Same machine, same IP: headless Chromium **refused**, headed Chromium **200** — and Akamai, Home Depot, REI, The North Face all refused the same client | The gate detects **automation**, not our network |
| 72c | Even with access: 1 product page in 4 yielded a chart, at 10–15 s each; and the configuration that works (a real window) cannot run on serverless, where the deployable one (headless) is exactly what is refused | Request-time scraping cannot be the product (invariant (53)) |
| 75d | H&M and REI now refuse automated browsers **even headed**; Patagonia intermittently serves "Hang Tight" | **72b's "headed gets through" no longer holds** |

That last row is why the extension is the durable answer rather than one option
among several. Anything our code drives — headless, headed, from a server or a
laptop — is on the wrong side of a detector that keeps improving. **A person's own
browser, on a page they opened, is not what these systems refuse**, and it is the
only reader that does not get worse over time.

It also sidesteps the legal question that `fetch-strategy.md` §2 decided: nothing
is being circumvented. The shopper is looking at the page; the extension reads what
they can already see.

## 2. The extension decides nothing

Parsing, the body-versus-garment reading, every refusal and the recommendation all
run on the server, in the same code as the website (`extractorLLM.ts`,
`pageParse.ts`, `fitEngine.ts`, `checkPolicy.ts`). The extension's only job is to
**get the page to the server**.

Why this matters more than it looks:

- **One engine, and it is the one with the tests.** A second copy of any rule in
  the extension would drift from the server's, and the extension has no test
  harness a real browser can't bypass.
- **It can be fixed without shipping an extension.** A Chrome Web Store update
  takes review time; a server deploy takes minutes. Every parser fix since Sprint 5
  (fraction inches, the column shift, body waist, stated ranges) reached extension
  users with no extension update.

Where the extension must share a rule with the parser — which tables to keep, the
body/garment sentences, the visibility attribute — it carries its own copy (there
is no build step, so it cannot import), and **`extensionCapture.test.ts` fails the
moment the two copies drift**.

## 3. The capture is an allowlist, not a denylist

A page someone is logged into shows who they are in more places than anyone can
list: the header greeting, the cart, saved addresses, order history, recently
viewed items, a review they wrote. Trying to strip the private parts out of such a
page is a denylist, and a denylist is only as good as the last thing it forgot.

So `capture.js` never edits the page. It **builds a new document** from the few
parts known to be product: title and product meta, schema.org Product / Breadcrumb
JSON-LD cut to a short key list, the first `<h1>`, measurement tables rebuilt as
plain-text cells, the one sentence that says whether the chart is body or garment,
size options, and chart-image addresses. Emails, phone numbers and card-like
numbers that appear in kept text are masked before sending.

**Measured on a real Patagonia product page with the size guide open: 11 KB out of
1.78 MB (−99.4%), in about 16 ms.** The privacy control and the bandwidth control
are the same act.

## 4. The trust boundary

Markup that arrives from a client is not markup we fetched. It is handled
accordingly:

- **Recorded as `fetch: "extension"`**, never `"ok"` — `sizesFrom` says where the
  numbers came from (the retailer's page), `fetch` says who carried them (invariant
  (54)). Claiming `"ok"` would say our server read a page it never requested.
- **Capped at 1 MB**, sized against the measurement above rather than a guess.
- **Never scored against an invented ladder** (invariant (59)): a supplied page with
  no chart is refused, not answered from `BRAND_TABLE`'s constants.
- **Rate-limited** on `/api/check`, per session first (a campus network or a demo
  room puts many people behind one IP), per IP as a backstop.

Someone could send invented markup. The only recommendation they would corrupt is
their own, nothing they send is learned across users, and every number still
arrives labelled with where it came from.

## 5. Identity: never mint an account for the extension

`getCurrentUser()` creates an anonymous account for any cookieless request. For the
website that is the right onboarding. For the extension it would mean a silent
check against an empty profile, answered with the confidence floor, which looks
like the product not working.

So an extension request with no session gets **401 `not-connected`**, decided
before `getCurrentUser()` runs (invariant (60)). Chrome treats an extension's
request to a site it holds host permission for as same-site, so the `fp_session`
cookie (SameSite=Lax) does travel — **verified against production** — unless the
user blocks third-party cookies, in which case they are told to connect first
rather than being handed an empty account.

## 6. Which table the shopper was looking at

A tabbed size guide keeps several charts in the DOM with all but one hidden —
men's and women's, tops and bottoms. The parser used to take the chart with the
most rows, so a hidden one could win. The capture marks each table it keeps with
`data-fp-visible` (on screen or not), and since Session 78 the parser prefers a
visible chart over any hidden one, falling back to row count only among equals. A
server-fetched page carries no marks and behaves exactly as before.

## 6b. Marketplace listings — Tmall, Taobao, JD (Session 79a)

Found on a real Tmall item, captured by the founder in their own logged-in
browser (the capture stays local): the popup said **"No product details"**, and
the server named the brand **"Detail"** (from the host `detail.tmall.com`) and the
product **"Detail T-shirt"**. The size chart itself was read correctly.

The cause was not the picture-only description (图文详情) the founder suspected.
These pages publish no JSON-LD, no `og:title`, no `<h1>` — the three places the
name and brand were read from. What they do have, and what is read now:

| Page part | Read by | Rule |
|---|---|---|
| `<title>` with "-tmall.com天猫" / "-淘宝网" / "【…】-京东" | server `cleanTitle`; popup title | the product's name when nothing better exists |
| 参数信息 label/value pairs (hashed class names) | capture, **by label** | allowlist `ATTR_LABELS` only; a label pairs with a value only as the two children of one box, or dt/dd, th/td — so a "品牌" link in a navigation bar never pairs with a neighbour |
| a scale value (版型: 紧身 … 超宽, one marked active) | capture | only the marked option; none marked means nothing is sent |
| size buttons under a "尺码" label | capture | `title` attributes only, in a box of ≤ 400 characters — the page's first "尺码" is the image gallery's tab, and reading text around it collected a rating and prices as sizes |
| 适用性别 / "T恤男" / "男女同款" | server | the parameter wins; then the title's marketplace forms |

Never read: **the shopper's own size profile** that the size section shows
("我的档案：177 厘米 69 公斤", "和您身材相似的买家购买了 XL"). It is the user's data,
not the product's, and is dropped from context text; a test puts it in the same box
as the chart and requires it absent. Nor a measurement as an attribute (the size
picker's "衣长: 72.5cm" describes one size, not the product).

A marketplace host is never a brand: `marketplaceFor(host)` names the retailer
(Tmall, Taobao, JD.com …) and leaves the brand empty until the page says it.

The popup adds a neutral line when a listing's description is all pictures — only
on a page with a parameter list, since nearly every product page has large photos.
The picture is not sent to the vision reader: picking the size chart out of thirty
description images is unsolved (todo/engineering/10).

**A page standing in for the product (Session 80f).** Two things Taobao showed a
signed-in automated browser on real items: an item link redirected to
`login.taobao.com`, and an item page whose 参数信息 and 尺码信息 were replaced by
**访问异常提示** ("商品详情页将在一段时间后自动恢复") while the price and size buttons
stayed. Before 0.5.1 the first was answered "not apparel" and the second with an
estimated ladder and no pick. Now the capture reports `found.gate` — `login` (a
sign-in host or a title that is only 登录 / Sign in) or `paused` (that notice, in a
visible element) — read as yes/no and never sent, and the popup says what happened,
offers **Re-scan**, and (paused only, the name and sizes being there) **Save to buy**.
No check is offered: it could only guess.

## 6c. Language (Session 79c)

The popup has its own 中 | EN switch (`i18n.js`), remembered in the extension's
storage and defaulting to the browser's language — independent of the site's
cookie, because the popup is used on other sites. Every check sends the choice as
`x-fp-lang`, which the server ranks above its own cookie (`src/i18n/config.ts`), so
reasons and refusals come back in the popup's language. The manifest's description
and tooltip use Chrome's `_locales` (en, zh_CN); the name stays Fit Passport.
`extensionI18n.test.ts` holds the popup to the site's rules: same keys and
placeholders, nothing left in English, the spacing rule, and every key the popup
asks for present.

## 7. Distribution

Until the extension is on the Chrome Web Store it ships as a **zip on the website**
(`/extension`), loaded unpacked in Developer mode. The zip is built
deterministically from `browser-extension/` and a test rebuilds it and compares
bytes, so the download can never drift from the source. Where it is offered is
one constant (`extensionDistribution.ts`): switching to the Web Store is a single
edit when the listing exists.

The manifest pins a public `key`, so the extension ID is the same for everyone who
loads it — `odbdhmcfjbhikmlfmgafbkkbknkkaecp` — and the store listing will get the
store's key instead.

**The store package (Session 82)** is built from the same folder by
`pack-extension.mjs --store`: no `key` (the store refuses one), no localhost
permission or server, no "Save this capture". Listing copy, permission
justifications, data disclosures and images: `docs/store/`; the privacy policy the
listing points to: `/privacy`.

## 8. Limits — which are permanent and which are merely unbuilt

**Permanent** (the platform does not allow it):
- A chart inside a **closed shadow root** cannot be read. Open shadow roots can.

**Needs a permission** (corrected in Session 80): a **cross-origin iframe** is out
of `activeTab`'s reach, but not out of the platform's — with host permission for
the frame's origin, `executeScript({ allFrames: true })` reaches it. eBay puts the
seller's description in an `itm.ebaydesc.com` frame; 0.5.0 asks for that one host,
**optionally and on a click**, and reads only measurement lines from it.

**Unbuilt** (would take work, no platform obstacle):
- Size options offered as **radio buttons** rather than a `<select>` or swatch
  attributes — neither the capture nor the parser reads them yet.
- Charts that exist only as **non-table markup**. Note the evidence here is thin:
  Session 75d recorded Gap as a div-built chart, but in Session 78 Gap's product
  page, with "Size Guide" pressed, held **no measurement chart in the DOM at all** —
  no table, no ARIA grid, nothing with chest, sizes and numbers together; the only
  "chest" on the page was the customer-review fit summary. A parser for a
  structure nobody has observed would be guessing, so it waits for a real capture.

**By design** (the extension will not do it):
- It never clicks anything on the page for the user. A chart behind a "Size guide"
  button needs the user to open it and press **Re-scan**.
- It never runs on a page the user did not click the icon on: `activeTab` +
  `scripting`, no always-on content scripts, no `<all_urls>`.

## 9. One-off listings (Session 80)

A second-hand listing is one garment in one size with no size chart; what it often
has is the seller's tape measure. Measured on five real eBay shirts: four wrote
pit-to-pit in the title (`24" Pit To Pit 30" Long`), one in the item specifics
(`Chest Size: 25" Pit to Pit`), one had a length in the description frame — and the
listing page also showed other sellers' items with their own pit-to-pit, so free
text on the page is never read.

| Page part | Read by | Rule |
|---|---|---|
| title / `<h1>` | already sent | server `sellerMeasurements.ts` |
| item specifics | capture, **by label** (`SPEC_LABELS`) | measurement values kept here, unlike marketplace attributes |
| description frame | capture's `measureLines`, injected with the optional permission | measurement lines only, masked, ≤ 20 |

The server doubles a flat width into the garment's circumference (never the body's),
drops what is ambiguous (a bare "Chest 22", "29x20") for the user to confirm, and
answers with a **judgement** (`listingJudgement.ts`) on the engine's own target and
verdict scale. Our server is refused by eBay (an "Error Page"), so on the website a
listing is judged from measurements the user types.

## 10. A size chart that is only a picture (Session 83)

Some listings print their chart only as a photo — an eBay listing's fifth picture,
a Taobao description's tenth — with nothing on the page saying which. Sending every
picture to a vision model costs money and sends pictures that are not the chart, so
**the shopper picks it**:

- The capture lists the page's sizeable pictures (`pickablePictures`: at least
  120 px, https, not in the header, a form or a shopper's profile box; chart-named
  ones first; at most 30), asking two marketplaces' thumbnails for full size (eBay
  `/s-l140.` to `/s-l1600.`, alicdn `_400x400q90.jpg` stripped). The list stays in
  the popup; **no picture address leaves the browser unless one is picked**.
- After an answer with no measurements, the popup offers **The size chart is a
  picture** — only when the server says it can read pictures (`features.chartImage`,
  true when `ANTHROPIC_API_KEY` is set) and the page has pictures.
- `/api/check` takes `chartImage` (the address only). `chartImage.ts` reads it once
  for everyone: the numbers are cached by address in `ChartImageRead`, and so is
  "not a chart"; a failed read is not cached. A table on the page still wins. The
  model also copies the chart's own heading word for word, so the existing
  page-wording rules decide body or garment — not the model.
- 20 picks per user per hour (working value). Provenance says "read by AI from the
  picture you picked" (`extractedBy: "picked-picture"`).
- We keep the numbers read from a picture, never the picture (no scraped imagery).

Checked end to end in a headed browser with a cached read (no key locally): no chart
on the page, M at 50% from the closet; picked the picture; S at 61% from the
picture's garment measurements. **Not yet checked: a real vision read** — the key is
set in production (`features.chartImage: true`), so the first real pick is the check
(todo/people/06).

## 11. "I own this, add to closet", and a way into the site (Session 88d, 0.8.0)

- **The screenshot.** Only when the shopper presses the button, the popup calls
  `chrome.tabs.captureVisibleTab` (covered by `activeTab`, granted by the click on the
  icon; no new permission) and crops to `found.mainPicture` — the largest picture on
  screen (≥ 150 × 150 CSS px, not in the header, a form or a profile box), reported by
  `capture.js` with the viewport width so CSS pixels scale to the screenshot's. The crop
  is cover-fitted to the site's closet size (600 × 750 JPEG, ~90 KB). The shopper can
  choose the whole screen or no photo instead.
- **Saved as the wearer's own closet piece**: brand (now also from JSON-LD), name, type,
  the size they have, how it sits, the product link, `photoFrom: "shop"`. `/api/closet`
  POST refuses an extension request with no session, like `/api/saved`.
- **Shown only to them**: no public route returns closet photos
  (`closetPhotoPrivacy.test.ts`).
- **Into the site**: the name in the header opens Fit Passport; a row under every
  screen links to the closet, to-buy list, passport and /check.

Checked in a headed Chromium: the cropped product picture (13 KB), "Cable-knit cardigan",
M, sweater, `photoFrom` shop, the product link. Automation cannot click the toolbar
icon, so `activeTab` is never granted there; the run used a scratch copy of the
extension with `<all_urls>` added — the shipped manifest is unchanged. The real
click-granted path is a manual check.
