# Chrome Web Store listing — what to paste where

**Live since 2026-10-05:** https://chromewebstore.google.com/detail/fit-passport/ciecejomnniicliemefagfegkmgfkgfe
(0.6.0). Next update: **0.8.0** (supersedes 0.7.2) — 0.7.2's background worker that
opens the welcome page on first install, plus "I own this, add to closet" (a
screenshot of the tab, cropped to the product picture) and links into the site. No
new permission: the screenshot uses `chrome.tabs.captureVisibleTab` under `activeTab`.

Everything the Developer Dashboard asks for, ready to paste. The upload is
`app-web/store-build/fit-passport-extension-<version>-store.zip`, built with
`node scripts/pack-extension.mjs --store` (from `app-web/`). Who does what, and
the open decisions, are in `todo/people/05-chrome-web-store.md`.

## Package tab

Upload the store zip. It differs from the website download in two files only,
pinned by `extensionZip.test.ts`:
- `manifest.json` has no `key` (the store refuses one and assigns its own ID) and
  no `http://localhost:3000/*` host permission;
- `config.js` has only the production server, so the popup shows no server choice.

## Store listing tab

**Name:** Fit Passport (the brand is never translated).

**Category:** Shopping. **Language:** English, with a Chinese (简体中文) listing.

**Summary** (132 characters at most):
- EN: `Your size at any clothing store — weighed against the clothes that already fit you, with the reason shown.`
- 中文：`在任何服装店找到你的尺码：对照你已经合身的衣服给出推荐，并说明理由。`

**Description — English**

> Fit Passport tells you which size to buy on the product page you are looking at,
> and why.
>
> Click it on a clothing product page. It reads the page's size chart and size
> options, weighs them against your Fit Passport — your measurements if you gave
> them, your preferred fit, and the clothes you own that fit well — and answers
> with one size and the reasons behind it. When two sizes are equally good, it
> says so instead of guessing.
>
> • Second-hand listings: no size chart? It reads the seller's measurements
>   (pit to pit, length) and tells you whether the item is likely to fit.
> • Save to buy: keep a product on your to-buy list, separate from your closet,
>   and move it into the closet once you own it.
> • Private by design: it reads a page only when you click, and only the tab you
>   are on. It sends a reduced copy of the product's title, size chart and size
>   options — never forms, your cart, your account or reviews — and shows you
>   exactly what will be sent first.
> • English and Chinese.
>
> You need a free Fit Passport at fit-passport.vercel.app; no sign-up form —
> open the site once and you have one.

**Description — 中文**

> Fit Passport 在你正在看的商品页上，告诉你该买哪个尺码，以及为什么。
>
> 在服装商品页点击它：它读取页面上的尺码表和尺码选项，对照你的合身护照——你填写的
> 身形数据、版型偏好，以及衣橱里真正合身的衣服——给出一个尺码和判断依据。两个尺码
> 同样合适时，它会直说，不替你猜。
>
> • 二手商品：没有尺码表？它会读取卖家实测的尺寸（腋下平铺宽度、衣长），告诉你较
>   可能合身、可能偏紧还是可能偏松。
> • 加入待购：把想买的商品放进待购，和衣橱分开；买到之后再转入衣橱。
> • 隐私优先：只在你点击时读取，且只读当前标签页。它只发送商品标题、尺码表和尺码
>   选项的精简副本，不包含表单、购物车、账户或评价，并在发送前把内容展示给你。
> • 支持中文和英文。
>
> 需要一个免费的 Fit Passport（fit-passport.vercel.app），无需注册表单，打开网站
> 即可拥有。

**Images** (in `docs/store/`, made by `docs/store/make-images.mjs`):
- icon: `browser-extension/icons/icon128.png`;
- screenshots, 1280×800: `screenshot-1-answer`, `-2-what-is-sent`, `-3-save`, each
  `-en.png` and `-zh.png` (upload the `-zh` set to the Chinese listing);
- small promo tile, 440×280: `promo-tile-440x280.png`.

**Official URL / homepage:** https://fit-passport.vercel.app
**Support URL:** https://fit-passport.vercel.app/help

## Privacy tab

**Single purpose:**
> Recommend a clothing size on the product page the user is viewing, based on the
> user's own Fit Passport profile, and let them save that product for later.

**Permission justifications:**

| Permission | Justification |
|---|---|
| `activeTab` | Reads the product page the user is viewing, only after they click the extension's icon. |
| `scripting` | Runs the extension's own page-reading script in that tab after the click, to build a reduced copy of the product's title, size chart and size options. |

`activeTab` also covers 0.8.0's screenshot: only when the user presses "I own this, add
to closet", the visible tab is captured once, cropped to the product picture, and saved
to that user's own closet (shown to no one else). Add this sentence to the `activeTab`
justification when uploading 0.8.0.
| Host `https://fit-passport.vercel.app/*` | Sends that reduced copy to the Fit Passport service with the user's session and receives the size recommendation; saves a product to the user's to-buy list when they press Save. |
| Optional host `https://*.ebaydesc.com/*` | eBay shows a seller's description in a frame from itm.ebaydesc.com. Requested only when the user presses "Read the seller's description", to read measurement lines such as "Pit to pit 22 in". |

**Remote code:** No. All JavaScript is in the package.

**Data usage** — tick:
- **Website content** — the reduced copy of the product page, and (0.8.0) a cropped
  screenshot of the product picture when the user adds the item to their closet.
- **Web history** — the product page's address and title go with it and are kept
  as the checked product. (Over-declaring is safer than under-declaring.)

Leave unticked: personally identifiable information, health, financial,
authentication information (the extension never reads credentials; the browser
sends the site's own session cookie), personal communications, location, user
activity.

**Certify all three:** not sold to third parties; not used or transferred for
purposes unrelated to the single purpose; not used to determine creditworthiness.

**Privacy policy URL:** https://fit-passport.vercel.app/privacy — contact: fitpassporteam@gmail.com (set 2026-09-30).

## Distribution tab

Free · Public · all regions. The trader / non-trader declaration is the founder's
(see the todo file): a trader's name, address, email and phone are shown on the
listing.

## Test instructions tab (for the reviewer)

> 1. Open https://fit-passport.vercel.app once in this browser (this creates a free
>    Fit Passport; no sign-up). Optionally enter a chest measurement on the Passport page.
> 2. Open a clothing product page, for example
>    https://www.patagonia.com/product/mens-better-sweater-fleece-jacket/25528.html
>    and open its "Size Chart" (many shops load the chart only when it is opened).
> 3. Click the Fit Passport icon → "Check my size". A size and its reasons appear.
> 4. "Save to buy" → Save; the product appears at https://fit-passport.vercel.app/saved.
> No credentials are needed.
