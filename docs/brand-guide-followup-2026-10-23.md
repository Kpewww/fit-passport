# Brand guide follow-up — 2026-10-23

Latest main d49fa83 was merged into codex/people-tasks as d3302eb without conflicts. No main merge or auto-merge is authorized; PR #2 remains open and autoMergeRequest is null. Deployment diagnosis is no longer a dependency of this collection task.

## Completed changes

- Added L.L.Bean women's regular tops from the existing 2026-10-22 official-page screenshot. Six exact full labels now fit the updated max24 schema. CapturedAt remains 2026-10-22; no fresh visit is claimed. All chest ranges and printed inches retained; waist omitted because the tops table has none.
- Added letter-to-number header mappings to Tommy Hilfiger men's/women's and Banana Republic women's notes from their saved screenshots. Single measurements remain single; verifier arrays remain empty. Tommy men's 24 has no visible letter above it in the saved screenshot, and the note explicitly records that uncertainty rather than assigning a letter.
- Total: 17 unverified guides and 19 screenshots. This does not complete human verification or the full collection target.
- `npm test`: 87 files passed, 1 skipped; 1471 tests passed, 1 skipped, exit 0. The existing evalCases test is skipped; no paid/full external eval was run. Brand-guide schema and generated-data consistency checks passed. Runtime generated guides remain empty.
- `git diff --check` passed.

`npm run guides` is pending permission for its temporary-file cleanup: the existing script calls rmSync on a newly created system-temp brand-guides-<pid>.cjs. The original instruction requires confirmation before deletion. A specific question was submitted; no deletion or script modification was performed while waiting. Passing schema tests are not represented as execution of that command.

## Per-brand status

Done means draft and screenshot collected, NOT human verified. Unfinished items were not revisited this turn because supported Chrome control tools are absent. This is distinct from a retailer refusing access.

| Brand | Men | Women | Reason / evidence |
|---|---|---|---|
| J.Crew | Done | Done | Prior official screenshots; raw values retained. |
| Banana Republic | Done | Done | Women's header mappings supplemented this turn. |
| Levi's | Done | Done | Prior standard tops screenshots. |
| Tommy Hilfiger | Done | Done | Header mappings supplemented; men's 24 letter unresolved. |
| Calvin Klein | Done | Done | Women's malformed M waist remains omitted. |
| Columbia | Done | Done | Prior standard tops screenshots. |
| Under Armour | Done | Done | Prior regular tops screenshots. |
| Madewell | Not requested | Done | Women's-only task; duplicate printed labels retained. |
| L.L.Bean | Done | Done this turn | Women's saved evidence now accepted by longer-label schema. |
| Gap | Unfinished | Unfinished | Prior official guide reachable; table expansion unresolved. Chrome tool unavailable now. |
| Old Navy | Unfinished | Unfinished | Prior official guide reachable; table expansion unresolved. Chrome tool unavailable now. |
| Abercrombie & Fitch | Unfinished | Unfinished | Previously retrieved legacy guide returned 404; no current recheck possible. |
| American Eagle | Unfinished | Unfinished | Men's table units not confirmed; women's collection incomplete. No invented units. |
| Ralph Lauren | Unfinished | Unfinished | Official US guide collection not completed; Chrome tool unavailable. |
| Brooks Brothers | Unfinished | Unfinished | Prior official tables readable; clear body/garment evidence unresolved. |
| Everlane | Unfinished | Unfinished | Official support page has no generic tops table; product-specific collection unfinished. |
| Carhartt | Skipped | Skipped | Prior explicit terms-agreement popup; not accepted or retried. |
| Gucci | Unfinished | Unfinished | Official US table read before interruption; no saved screenshots/JSON, not counted. |
| Prada | Unfinished | Unfinished | Chrome tool unavailable; no retailer denial established. |
| Burberry | Unfinished | Unfinished | Chrome tool unavailable; no retailer denial established. |
| Saint Laurent | Unfinished | Unfinished | Chrome tool unavailable; no retailer denial established. |
| Balenciaga | Unfinished | Unfinished | Chrome tool unavailable; no retailer denial established. |
| Moncler | Unfinished | Unfinished | Chrome tool unavailable; no retailer denial established. |
| Zegna | Unfinished | Unfinished | Latest user asks both; current repository list originally men only. No collection possible with tools absent. |
| Nike / Patagonia | Existing baseline | Existing baseline where applicable | Repository says skip existing guides; no new claim or verifier added. |

## Blockers and next action

Supported tool discovery finds no cua, browser-control, node_repl or sky entry point. No applicable checkout AGENTS.md or .agents/skills was found. Bundled Computer Use instructions require a JavaScript session tool which is not exposed. No alternative browser, raw browser protocol, foreground UI, or different computer was used. Restore the authorized user-Chrome control tool to continue remaining sites signed out in a separate background window.

Prior Taobao safety denial remains separate and was not retried. No login, CAPTCHA solving, terms acceptance, production changes, payment, store submission, or merge into main was performed.

Evidence: app-web/data/brand-guides/llbean-womens.json and screenshots/llbean-womens.png. Earlier report: docs/brand-guide-research-2026-10-23.md. Cumulative local report: C:\Users\Kpew\fit-passport-codex-report.md.