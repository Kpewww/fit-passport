# Bundled fonts

Both files are the **latin** variable subsets, self-hosted on purpose: `next/font/google`
fetches fonts **at build time**, so a production build would fail whenever Google
Fonts is unreachable (it did, twice, on a network with no usable IPv6 route). Self-hosting
removes a build-time network dependency from the deploy path entirely.

| File | Family | Licence |
|---|---|---|
| `Inter.woff2` | Inter (variable, 100–900) | SIL Open Font License 1.1 |
| `Fraunces.woff2` | Fraunces (variable, 100–900) | SIL Open Font License 1.1 |

The **SIL Open Font License 1.1** permits bundling and redistribution, including in
commercial work, provided the fonts stay under the OFL and are not sold on their own.
Neither is renamed, so no Reserved Font Name condition is triggered.

- Inter — Rasmus Andersson · <https://github.com/rsms/inter> · OFL 1.1
- Fraunces — Undercase Type (Phaedra Charles, Flavia Zimbardi) · <https://github.com/undercasetype/Fraunces> · OFL 1.1

To refresh, re-download the *latin* subset from the Google Fonts CSS2 API and replace
the files; nothing else needs to change (`src/app/layout.tsx` points at them by path).
