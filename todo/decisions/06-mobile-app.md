# A phone app — what to decide before planning it

**Who:** the founder and the team. **Status:** parked for a detailed plan later
(raised 2026-10-08). Nothing here is built.

The product's core moment is clicking the extension on a desktop product page.
On a phone, most clothes are bought inside a shop's own app (Taobao, Dewu, Shein,
Zara), where no extension can read the page. So an app is not the extension
copied; it needs its own way to receive the product.

## How the product gets into the app — pick one or more

1. **Share a link in.** The shop app's Share → Fit Passport → the server reads the
   link, as `/check` already does. Smallest change. Shop links often cannot be read
   by our server; then the shopper picks the garment (`pick-category`) or types
   the chart.
2. **iOS Safari extension.** Safari on iOS runs web extensions, and much of
   `browser-extension/` could be reused; it ships inside an app. Helps only people
   shopping in Safari.
3. **A photo of the size chart.** A screenshot read as a chart. The chart-picture
   reader in extension 0.7 is not yet proven on a real page (`todo/people/06`).

## How it is built — lightest first

| Route | Cost | When |
|---|---|---|
| PWA (the site, "Add to Home Screen") | days | to learn whether anyone uses it on a phone |
| Capacitor shell around the site | weeks | when share-in, camera or notifications are needed |
| React Native / native | months | at scale |

Recommendation: the PWA first, a Capacitor shell when share-in is needed. One
interface, not two, for a four-person team.

## Store rules to check against the official text before planning

These are from memory and need their sources found (principle: research-grounded):
- Apple developer program yearly fee; Google Play one-time fee.
- Apple rejects an app that is only a website in a frame (App Review Guideline 4.2,
  minimum functionality): the shell needs native value (share-in, camera, offline closet).
- An app that creates accounts must let people delete the account in the app
  (Apple 5.1.1(v)). Fit Passport makes an account on first visit, so deletion
  must exist first.
- Privacy labels (App Store) and Data safety (Google Play) must match `/privacy`;
  body measurements are sensitive.
- Mainland China app stores: software copyright and ICP filing — a separate assessment.

## Product questions

- **One account across app and web.** The app's cookies are not the browser's. The
  account-code read / password write scheme (`docs/memory/project-identity-sharing-idea.md`)
  can carry an account across, but the flow needs designing.
- **Closet photos** grow with an app; move them to Vercel Blob first (open item).
- **No brand imagery** holds in the app too: product pictures only user-uploaded.
- **Demand first:** read the phone share of visits in Vercel Analytics before
  committing to more than the PWA.
