# Brand size-guide collection — 2026-10-23

## Completed

Current total: 31 unverified JSON guides and 39 source/measurement screenshots in app-web/data/brand-guides. Every verifiedBy remains []. No guide is counted by the runtime compiler. This is draft research, not completion of the TODO human-verification target.

Added since the 16-guide checkpoint: L.L.Bean women; Gucci men/women; Moncler men/women; Burberry men/women; Ralph Lauren men/women; Abercrombie & Fitch women. Supplemented printed header mappings for Tommy Hilfiger and Banana Republic. Values, units and printed singleton measurements are preserved. No body/garment sentence was invented to fill an evidence gap.

Correction to earlier checkpoint reports: direct cua_repl is available although absent from functions ALL_TOOLS. Chrome collection resumed in separate window 824150846/tab824150847. After resumed capture, the user's main window824150303 was still focused and work window was unfocused. No main-window tab was navigated. Retailer collection stayed signed out. No CAPTCHA, access block, or binding terms was bypassed.

Latest main d49fa83 was merged into codex/people-tasks as d3302eb. Latest user authorization permits normal push and merge only after validation/checks; it does not verify the data or authorize deployment configuration changes.

## Per-brand result

Done means saved draft plus complete relevant screenshot, NOT human verified. Skip means no compliant draft was produced for the stated reason. Unfinished is explicitly not a retailer refusal.

| Brand | Men | Women | Reason / uncertainty |
|---|---|---|---|
| J.Crew | Done | Done | Earlier official evidence retained. |
| Banana Republic | Done | Done | Women: XXS=000,00; XS=0,2; S=4,6; M=8,10; L=12,14; XL=16,18; XXL=20. |
| Levi's | Done | Done | Standard tops. |
| Tommy Hilfiger | Done | Done | Exact header mappings recorded; men's numeric24 has no visible letter in screenshot. |
| Calvin Klein | Done | Done | Women's malformed M waist omitted rather than interpreted. |
| L.L.Bean | Done | Done | Women's full labels supported by latest main; prior2026-10-22 evidence date retained. |
| Columbia | Done | Done | Standard tops; singletons retained. |
| Under Armour | Done | Done | SM/MD/LG labels retained. |
| Madewell | Not requested | Done | Duplicate printed numeric labels retained. |
| Gucci | Done | Done | Official US general tops tables, printed CM chest singletons; separate body diagram/original instructions. |
| Moncler | Done | Done | Official US tops; printed inches, decimal commas represented by JSON decimal points; no unit conversion. Men's3XL waist41,43 retained. |
| Burberry | Done | Done | Official US classic-fit knitwear size dialogs. Women's numeric and alpha tables differ; alpha table retained without invented mapping. |
| Ralph Lauren | Garment draft | Body draft | Men reclassified per latest TODO09 and screenshot: BACK BODY and short sleeve dimensions contradict the page body label. Do not verify as body. Women numeric/alpha mapping retained. |
| Abercrombie & Fitch | Done | Done | Follow-up: normal US home navigation reached the general Tops guide for men, XXS through printed 3XL. Earlier redirect is resolved; Tall and product garment length excluded. |
| Gap | Skip | Skip | Official guide opens, clicking men/women links did not display numeric chart. Rendering/expansion failure; not proof no chart exists. |
| Old Navy | Skip | Skip | Same: official guide link clicks did not expose numeric table. |
| American Eagle | Skip | Unfinished | Prior men's units unclear; current visit displayed usage banner linking agreement to Terms of Service. No acceptance. Women not separately revisited after banner. |
| Brooks Brothers | Skip | Skip | Official tables readable; explicit body/garment original sentence not established. Women's guide rechecked; numeric data alone not sufficient under09. |
| Everlane | Done | Done | Follow-up: official product Size Guide dialogs provide body tables. Women Body Measurements selected; men explicit chest measurement instructions saved. Mixed ranges/singletons and exact numeric mappings retained. Product garment toggle not collected. |
| Carhartt | Skip | Skip | Earlier explicit Terms and Conditions consent gate; not accepted or retried. |
| Prada | Skip after terms gate | Skip | Follow-up: women Find your size opened a Measmerize service stating use agrees to its ToS. No personal data entered or service continued. Men not separately attempted after this terms gate; no claim that Prada has no chart. |
| Saint Laurent | Done | Done | Follow-up: US product Size Guide dialogs expose general MEN'S SHIRTS and WOMEN READY TO WEAR tables labeled BODY MEASUREMENT, CM selected. Singletons and exact header mappings retained. |
| Balenciaga | Skip | Skip | Follow-up: women guide now visibly expanded; numeric table and units present, but no body/garment original sentence. Same semantic evidence limitation as men. Not an access refusal. |
| Zegna | Skip | Unavailable in inspected US catalog | Women explicitly checked despite repository list saying men only. US home labels Menswear; Ready to Wear page explicitly describes men's collection and no women category was found. No third-party or invented women table. Men retains missing-original-sentence limitation. |
| Nike / Patagonia | Existing baseline | Existing baseline where applicable | Not recollected, per09. |

## Source and incomplete evidence

Saved JSON sourceUrl fields are exact official page URLs. Additional incomplete/rejected evidence remains in C:\Users\Kpew\Documents\Codex\2026-10-22\task; it is not counted among33 completed screenshots:

- gap-guide-not-expanded.png — https://www.gap.com/customer-service/finding-your-size?cid=81268&mlink=55278,1,Footer_SizeGuide#Mtops
- oldnavy-guide-not-expanded.png — https://oldnavy.gap.com/customerService/info.do?cid=83042&mlink=5151,1,Footer_Size_Charts#Mtops
- ae-terms-banner.png — https://www.ae.com/us/en/content/help/men-size-chart
- brooks-womens-no-kind-evidence.png — https://www.brooksbrothers.com/sizeguide?cid=women-shirts-and-tops
- everlane-product-specific-guide.png — https://support.everlane.com/en_us/what-size-am-i-BkLbhH6Ri
- prada-guide-search.png — https://www.prada.com/us/en/info/faqs/online-purchases.html
- ysl-faq-no-general-table.png — https://www.ysl.com/en-us/cp/faq
- balenciaga-mens-kind-unclear.png — https://www.balenciaga.com/en-us/balenciaga-back-medium-fit-t-shirt--grey-764235TRVI88499.html
- balenciaga-womens-guide-not-opened.png — https://www.balenciaga.com/en-us/cropped-t-shirt-balenciaga-grey-814264361.html
- zegna-body-diagram-no-sentence.png — https://www.zegna.com/us-en/ready-to-wear/shirts/product.white-sea-island-cotton-shirt.22889993/

## Validation and integration

At25 guides: npm run guides passed: 25 files,0 invalid,25 waiting for a person to verify,0 counted. npm test passed:87 files and1479 tests, with1 existing skipped evalCases test. Final26-guide validation follows below. The user approved removal only of the guides script's own newly generated brand-guides-PID.cjs temporary bundle; no arbitrary deletion performed.

No paid full eval, production settings, permissions, payment, store submission, formal truth promotion or human verifier name added. Taobao's earlier safety denial remains untouched. This report supersedes the old browser-unavailable and pending-cleanup statements; prior reports remain historical checkpoints.
Final validation: npm run guides:26 files,0 invalid,26 awaiting human verification,0 counted; npm test:87 passed files,1480 passed tests,1 existing evalCases skip,exit0; git diff --check passed. Runtime generated data has no semantic diff.

## Bounded remaining-brand follow-up

Added five unverified guides: Abercrombie & Fitch men, Everlane men/women, Saint Laurent men/women; six screenshots (Everlane men includes a separate measurement-instruction image). Latest browser check confirmed main window824150303 focused and work window824150846 unfocused. All collection was signed out. No previously refused retailer was retried.

Exact follow-up blocked/limited evidence (workspace C:\Users\Kpew\Documents\Codex\2026-10-22\task):

- balenciaga-womens-chart-no-kind-evidence.png: https://www.balenciaga.com/en-us/cropped-t-shirt-balenciaga-grey-814264361.html — table visible; insufficient semantic original text.
- prada-size-service-terms-gate.png: https://www.prada.com/us/en/p/short-sleeved-wool-and-mouline-cashmere-polo-sweater/P24E3P_6348_F0Y20_S_OOO — third-party sizing service terms; stopped without entering data.
- zegna-us-mens-only-navigation.png: https://www.zegna.com/us-en/ready-to-wear/ — inspected official catalog is explicitly men's. Women availability not inferred solely from repository scope.

Unattempted standalone gender follow-ups: Prada men (stopped brand after terms gate) and American Eagle women (previous terms banner, not retried). The other requested remaining items were attempted and have either saved drafts or the specific limitations above. No assertion that unvisited pages have no tables. No broad search or scraping was used.

Merge remains paused: commit353f742 Preview failed in Prisma get-config P1012 because DIRECT_URL was absent, before Next build. See https://github.com/Kpewww/fit-passport/pull/2#issuecomment-6361541052 . No environment/configuration changes, credential handling or merge occurred in this follow-up.

Follow-up validation: npm run guides: 31 files, 0 invalid, 31 waiting for human verification, 0 counted. npm test first run: 1484 passed, 1 failed, 1 skipped; existing foldOffer.test.ts:17 replaces signature first character with x, which is not a mutation when it already starts with x. No authentication code changed. Immediate full rerun: 87 test files passed, 1485 tests passed, 1 existing evalCases test skipped, exit 0. Both attempts are disclosed; no paid full eval. git diff --check passed. Generated runtime guide JSON has no semantic diff.

Integration follow-up: merged main1309fa5 (Preview skips migrations; signature test always mutates). Per new TODO09 review and original screenshot, Ralph Lauren men is now kind=garment with literal BACK BODY evidence; contradictory body label documented. No human verification or measurements changed.

Post-main integration validation: guides31/0 invalid/0 counted; npm test1485 passed,1 existing skipped,87 files passed; node --check scripts/vercel-build.mjs and git diff --check passed. Preview and merge must be verified for the pushed head.
