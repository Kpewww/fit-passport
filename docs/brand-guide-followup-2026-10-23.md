# Brand size-guide collection — 2026-10-23

## Completed

Current total: 26 unverified JSON guides and 33 source/measurement screenshots in app-web/data/brand-guides. Every verifiedBy remains []. No guide is counted by the runtime compiler. This is draft research, not completion of the TODO human-verification target.

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
| Ralph Lauren | Done | Done | BODY/IN selected. Men's page labels body but also displays garment-like columns; uncertainty retained. Women's full numeric/alpha mapping recorded. |
| Abercrombie & Fitch | Unfinished | Done | Legacy guide404; current men's US product URL redirected home. Women's general Tops body guide collected, excluding product-specific oversized garment length. No access denial claimed for men. |
| Gap | Skip | Skip | Official guide opens, clicking men/women links did not display numeric chart. Rendering/expansion failure; not proof no chart exists. |
| Old Navy | Skip | Skip | Same: official guide link clicks did not expose numeric table. |
| American Eagle | Skip | Unfinished | Prior men's units unclear; current visit displayed usage banner linking agreement to Terms of Service. No acceptance. Women not separately revisited after banner. |
| Brooks Brothers | Skip | Skip | Official tables readable; explicit body/garment original sentence not established. Women's guide rechecked; numeric data alone not sufficient under09. |
| Everlane | Unfinished | Unfinished | Official support explains product-specific body guides but has no numeric table. No universal chart obtained; not blocked/login-required. |
| Carhartt | Skip | Skip | Earlier explicit Terms and Conditions consent gate; not accepted or retried. |
| Prada | Unfinished | Unfinished | US homepage/FAQ/online-purchases help visited; no general numeric tops guide obtained. No retailer refusal claimed. |
| Saint Laurent | Unfinished | Unfinished | US FAQ accessible; product-page sizing mentioned, no general numeric chart obtained. No retailer refusal claimed. |
| Balenciaga | Skip | Unfinished | Men's table visible but no original body/garment sentence; women's US Size guide click did not produce a visible table. No invented evidence. |
| Zegna | Skip | Not in repository09 scope | US men's shirt table and body diagram visible; no explicit original body/garment sentence. Repository requests men only. |
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
