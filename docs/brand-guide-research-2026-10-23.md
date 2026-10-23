# Official brand-guide research checkpoint — 2026-10-23

## Completed

Collected 16 unverified body-size guides from 9 official US brand websites, with 18 screenshots, on 2026-10-22. Files are in `app-web/data/brand-guides/`; each JSON links its screenshot and source URL. All preserve printed inch values and have `verifiedBy: []`. Single values were not widened into ranges. No human verification is claimed.

| Brand | Drafts | Notes for human review |
|---|---|---|
| J.Crew | men, women | Men's ranges; women's printed numeric labels and single values. |
| Banana Republic | men, women | Men's regular outerwear; women's regular tops/sweaters. |
| Levi's | men, women | Standard tops only, no Big & Tall. |
| Tommy Hilfiger | men, women | Numeric labels retained. Women's two printed 0 labels retained rather than corrected. |
| Calvin Klein | men, women | Women's M waist omitted because printed values lack a range delimiter; XL single values retained. Extra measurement-instruction screenshot included. |
| L.L.Bean | men | Regular tops only; no waist data borrowed from pants. |
| Columbia | men, women | Standard tops; XS single values retained. |
| Under Armour | men, women | Printed SM/MD/LG labels retained; extended women's 1X–3X omitted. |
| Madewell | women | Regular tops through 16 / XL. Duplicate 0 / XS retained. Extra body-instruction screenshot included. |

Collection used the user's Chrome in a separate background window, not headless automation. No account, order, address, cookie or credential data was intentionally collected. No product source, production configuration, generated runtime guide data, or formal evaluation truth was changed.

Latest main was fetched and merged without conflicts into `codex/people-tasks` in local commit `6d78ec3`. The branch also retains the earlier evaluation drafts, screenshots and report in `docs/people-tasks-2026-10-22.md`; those are separate from this brand-guide collection.

Validation on 2026-10-23: `npm test -- --exclude 'eval/**'` passed 87 test files and 1469 tests, with 1 file/test skipped. This includes all 20 brandGuides checks: schema, screenshot presence, generated data consistency, and exclusion of unverified guides. Generated runtime guides remain empty. `git diff --check` passed before this report was added. Full paid/external evaluation was not run. `npm run guides` was not run because its script deletes a temporary file; the existing tests validate the same schema/compilation result without that deletion.

## Needs human review or a decision

Every draft needs a person to compare each number, raw label, unit and body/garment evidence with its official source and screenshot. Do not fill verifier names automatically. Existing evaluation ground-truth drafts still require the project's independent human verification process.

The TODO target (10+ US brands and 5+ luxury brands, verified and merged) is NOT complete. These are research drafts only. Commit/push/merge authorization does not constitute human data verification.

Carhartt displayed a consent message explicitly tying continuation to agreement with Terms and Conditions. It was not accepted. L.L.Bean women's complete printed labels exceed the current 12-character schema limit; its screenshot is retained in the local task workspace, but no shortened or invalid JSON was added. No runtime/schema change was made to accommodate it.

## Blocked or unfinished

| Brand/site | Actual status |
|---|---|
| Gap | Official help guide reachable, chart not expanded successfully; not evidence that no chart exists. |
| Old Navy | Official help guide reachable, chart not expanded successfully. |
| Abercrombie & Fitch | Retrieved legacy official guide returned Page Not Found. |
| American Eagle | Men's tops values readable, but units not established from the retrieved table; no inferred units saved. |
| Ralph Lauren | US guide collection unfinished. |
| Carhartt | Men's chart readable; consent/terms gate stopped further collection. No draft finalized. |
| Brooks Brothers | Men's and women's official guide tables reachable; unambiguous body-versus-garment evidence not established. |
| Everlane | Official support article says guides contain body measurements, but provides no generic tops table; product-specific collection unfinished. |
| Gucci | US men's/women's official clothing guide read, but screenshots and JSON were not saved before computer interruption. |
| Prada, Burberry, Saint Laurent, Balenciaga, Moncler, Zegna | Collection not completed. Search discovery is not treated as captured evidence. |
| Taobao | Earlier safety-policy denial remains blocked; no alternate route, proxy or retry used. |

On reconnection, local execution worked but Chrome control was absent from the available tools. Remaining browser research is pending restoration of the authorized Chrome tool. It is not currently waiting on a retailer login. Main deployment settings and old preview failures were not investigated or changed.

Local cumulative report: `C:\Users\Kpew\fit-passport-codex-report.md`. Additional incomplete access screenshots remain in `C:\Users\Kpew\Documents\Codex\2026-10-22\task`; they are not falsely presented as complete capture evidence.