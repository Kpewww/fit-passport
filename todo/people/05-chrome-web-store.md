# Put the extension on the Chrome Web Store

**Who:** the founder (account and payment), then engineering (package and listing).
**Cost:** a one-time **US$5** developer registration fee — once per account, not per
extension, no renewal. **Effort:** ~15 minutes to register; the package and listing
are prepared here; Google's review then takes a few days, longer for a first item.

## 1. Founder — register (only you can)

1. Open the [developer dashboard](https://chrome.google.com/webstore/devconsole) with
   the Google account that should own the extension long-term (a team account is
   better than a personal one: ownership is hard to move later).
2. Accept the developer agreement, pay the US$5, verify the contact email, set the
   publisher name (shown under the extension's name — "Fit Passport").

## 2. Engineering — what the upload needs (DONE, Session 82)

Built: the store package (`node scripts/pack-extension.mjs --store`), `/privacy`,
and the listing with its images in `docs/store/` (`chrome-web-store.md` says what
to paste where). **Still open, all the founder's:**
- ~~the address to publish~~ — set: fitpassporteam@gmail.com (`CONTACT_EMAIL`);
  until then `/privacy` says one is coming, and the listing cannot be submitted;
- trader or non-trader (EU): a trader's legal name, address, email and phone are
  shown on the listing;
- the upload itself, from the account that paid.

**Paying with your own account is fine.** What follows from it:
- the account that pays owns the publisher — one per Google account, for life;
  teammates are added as members with roles, not as co-owners;
- moving the extension to another account later goes through a Google support
  request (about a week), so pay from the account you intend to keep;
- 2-Step Verification must be on before you can publish or update;
- the developer contact email is public on the listing — use a project address,
  not a personal one.

What the original plan said:

- **A store package**, separate from the website's zip: no `"key"` in the manifest
  (the store refuses an upload that carries one and assigns its own ID), and no
  `http://localhost:3000/*` host permission or development origin in `config.js`.
  The server does not check the extension ID, so the new ID needs no server change.
- **A privacy policy page** on the site. The extension sends a reduced copy of the
  product page and the shopper's Fit Passport session to our server, which the store
  counts as handling user data; its "What is sent, and what never is" section
  (`browser-extension/README.md`) is the factual basis.
- **The listing:** short and long description in English and Chinese, a 128 px
  icon (have it), at least one 1280×800 screenshot, a 440×280 promo tile, the
  single-purpose statement, and one line per permission (`activeTab`, `scripting`,
  the site host permission, the optional `*.ebaydesc.com`).
- **After approval:** switch `EXTENSION_DISTRIBUTION` to `{ kind: "store", href }` —
  one edit; `/extension` already renders that branch.

## More sources (Session 82)

- One publisher per account, members by role: [Group publishers](https://developer.chrome.com/docs/webstore/group-publishers).
- Trader declaration: [Trader/Non-Trader developer identification](https://developer.chrome.com/docs/webstore/program-policies/trader-disclosure).
- 2-Step Verification: [Chrome Web Store policy](https://developer.chrome.com/docs/webstore/program-policies/two-step-verification).
- Transfers by support request: [chromium-extensions thread](https://groups.google.com/a/chromium.org/g/chromium-extensions/c/UnEtO_KTAj0).

## Sources

- Google: registration requires "a one-time registration fee" —
  [Register your developer account](https://developer.chrome.com/docs/webstore/register).
- The amount, US$5: [9to5Google, 2020](https://9to5google.com/2020/03/12/chrome-web-store-fee/);
  Google's pages do not print the figure, the dashboard shows it at payment.
- The store refuses a manifest with `key`: reported by developers, e.g.
  [testomatio/browser-extension#391](https://github.com/testomatio/browser-extension/issues/391).
- Upload, listing and privacy tabs: [Publish in the Chrome Web Store](https://developer.chrome.com/docs/webstore/publish).
