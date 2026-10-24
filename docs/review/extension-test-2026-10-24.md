# Extension task: partial results, 2026-10-24

Base: origin/main `0d23cb3bb0ab93eb6f28d5f4b8382d25b5c77423`; branch `agent/extension-test`.

## A: existing offline captures completed

Nine pre-existing local captures were packed: Arc'teryx Atom, Everlane crew, Gap tee, Nike Air Force 1, Nike Legend tee, Nike help page, Patagonia Better Sweater men/women, and Uniqlo AIRism tee. `npm run captures:pack`: 9 packed, 0 refused. These are existing fixtures, not fresh extension captures from this session.

Only `npx vitest run --config vitest.eval.config.ts eval/run.eval.ts` was run: 1/1 test passed. Full paid classifier eval was not run. Evidence: `app-web/eval/results/2026-10-24-run2.md`, matching JSON, `app-web/eval/replay-baseline.json`, and nine `app-web/eval/captures/*.capture.json.gz` files.

Replay covered 11 cases / 9 captures / 11 truth records, with `live:false`. S5 answered 6 and refused 3: 4 correct answers, 2 correct refusals, 2 wrong answers, 1 wrong refusal. Recommendation checks 12/15; guardrails 12/12. A passing harness does not mean every recommendation was correct. Missing DATABASE_URL caused caught brand-offset lookup errors and fallback; no database/environment changes were made. Final unit/build validation is recorded separately.

## B: real extension tests BLOCKED

Chrome HTTP/HTTPS research worked. Opening `chrome://extensions/` was denied by the supported browser route because that protocol is blocked. Native computer control was unavailable. No alternate protocol/CDP workaround was attempted. Installed Fit Passport version and toolbar popup could not be verified or operated. No test account was created, no account code exists, and no permission or login was granted. This is a tooling blocker, not an observed product failure.

| # | Expected outcome | Observed outcome | Status / evidence |
|---|---|---|---|
| 1 | Uniqlo AIRism / Nike Legend: one size, page-extracted source | Extension not executed | BLOCKED; no extension screenshot |
| 2 | J.Crew: own brand chart; Old Navy: estimate, with ranges | Extension not executed | BLOCKED; no extension screenshot |
| 3 | Chest 103.8 or 104 cm: roomier primary, smaller alternative | Profile/extension not executed | BLOCKED; no extension screenshot |
| 4 | Signed-out Taobao/Tmall: extraction or explicit unreadable result | Extension not executed | BLOCKED; no extension screenshot |
| 5 | eBay pit-to-pit: likely fits / tight / loose judgement | Extension not executed | BLOCKED; no extension screenshot |
| 6 | Save, mark bought and fit feedback, then kept entry in /history | Account and save workflow not executed | BLOCKED; no extension screenshot |
| 7 | Website Chinese preference propagates to extension | Language workflow not executed | BLOCKED; no extension screenshot |
| 8 | Shoe and help page refuse with reason | Only old offline fixtures replayed; actual extension not executed | BLOCKED; no extension screenshot |

Totals: 0 real UI tests passed, 0 observed product failures, 8 blocked. Retailer chart screenshots under brand-guides are research evidence only, never extension-test evidence.

## C: new extension captures BLOCKED

H&M, REI, and the three requested eBay measurement variants require the extension's `Show exactly what would be sent` then `Save this capture` workflow. That UI is unavailable for the same reason as B. No substitute browser DOM was passed off as an extension capture. No eBay case or URL was fabricated. No new C captures were packed; A's nine existing captures remain the only capture additions.

## Minimal manual handoff

1. In the user's Chrome, inspect the installed Fit Passport extension and verify Store version 0.9.2. If missing, the user must handle installation and any new permissions. Do not share credentials.
2. At https://www.fitpassport.fit create the fictional `agent-test-2026-10-24` account, personally handle any required credentials/terms, set male / chest 100 cm / regular, and record only the account code in the test report.
3. Run the eight rows above through the actual toolbar popup, save a screenshot per row in `docs/review/screenshots/extension-2026-10-24/`, and record observed output. Restore chest 100 cm after the near-tie check.
4. Stay signed out at retailers. For accessible H&M/REI and real eBay pages, use the extension capture buttons; save files to ignored `app-web/eval/local/captures/<case-id>.capture.json`. Skip CAPTCHA/access/terms gates. Supply actual eBay URLs and measurement truth before adding cases.
5. Once genuine captures/results exist, rerun packing, the single offline eval, and required validation. No installation, CAPTCHA bypass, account deletion, payment, or production change is authorized by this handoff.

## D and publication

D is partial; see `multi-chart-brands-2026-10-24.md`. Four new unreviewed guides have evidence; remaining catalog uncertainty is explicit. No application fixes were made. PR publication is authorized, but this task must not be described as fully completed or merged.
