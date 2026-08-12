# Fit Passport — Development Log

This log doubles as the course-required **Weekly Journal** (20% of final grade,
49-800). One dated entry per work session: what we built, why, what worked, what
didn't, and what's next. Concrete decisions and file references so the log maps
straight into the Reflection Essay at the end of the semester.

Team: Xiangchen Kong · Alyssa Qi. Instructor: Sheryl Root. Fall 2026.

---

## Open engine-tuning findings (running list)

- **[F1] Chest signal can override a good same-brand anchor. → FIXED 2026-08-10 (Sess 02).**
  Walkthrough finding: a slim user (chest 95) with a known-good COS EU 48 in the
  closet got recommended EU 44 for a new COS shirt, because that product's chart
  runs loose and the chest-fit weight (0.45) outweighed the known-good weight
  (0.35). Fix = **adaptive weighting** in `fitEngine.ts`: when the closet has a
  same-brand + same-category item rated ≥4/5 (`hasStrongAnchor`), the engine
  switches from `DEFAULT_W` (chest 0.45 / known-good 0.35) to `ANCHOR_W`
  (chest 0.18 / known-good 0.62) — the anchor dominates and chest-fit becomes a
  tie-breaker. Low-rated anchors (fit ≤3) do NOT trigger this. Cross-brand-only
  closets also stay measurement-led. Covered by 3 regression tests in the
  "anchor dominance [F1]" describe block (11 tests total, all green). This is
  exactly the "which signals actually matter" evidence the proposal calls for
  (§10.2) — we can now show the same product yields different recommendations
  depending on whether the user owns a same-brand anchor.

---

## 2026-08-12 · Session 29 — Metal charge-card passport, 6-metal badge ladder, CS2-style inspect, first logo

**Context:** founder feedback: badge light too strong + motion too fast, and the
3D should apply everywhere; /check hero was visually off-centre; the passport
should be **one slab like an Amex metal card** (metallic, minimal, "flex"
worthy), coloured by the holder's **highest badge metal** (lapis cobalt default),
with the body-type figure removed; badges should be **much harder** and follow a
metal ladder (bronze→silver→gold→platinum→diamond→obsidian) with **special**
colours (amethyst / jade / amber) for unusual feats and **agate-style white
veining** from diamond up. Also: design a logo, and inspect badges the way CS2
lets you inspect a weapon skin.

**Built:**
- **Metal card passport.** `MetalCard` renders one slab: deep metal gradient,
  brushed micro-grain, broad diagonal sheen, slow travelling glint, inset hairline
  bevel. `CARD_THEMES` maps every metal to a card edition (Lapis / Bronze / …
  Obsidian) and the card takes the theme of `highestMetal(earnedBadges)`; top
  metals add agate striations. Layout is card-like: wordmark + Issued, portrait +
  holder, a 3-up detail row, verification + logo. Body-type figure removed from
  the card (now plain text below); all other details moved into panels **below**
  the card so the slab stays clean.
- **Badge ladder, harder.** `Metal` extended to bronze/silver/gold/**platinum**/
  diamond/obsidian + specials **amethyst/jade/amber**; added exported `METAL_RANK`
  (deduped an older local copy), `VEINED_METALS`, `highestMetal()`. Added a 4th
  **platinum** tier to every track (Grand Wardrobe 100 items/20 brands/6
  collections · Fit Scholar 60 refreshes+20 outcomes · Atelier Master 30 posts+500
  likes) and a **Polymath** (jade) special for gold in all three tracks. Every
  threshold raised (e.g. starter 5→8, curator 12/3→20/4, archivist 25/6→45/10,
  stylist 3→6, couturier 8/50→15/150); capstones retiered — acclaimed 100→250
  (diamond), tastemaker 500→1500 (amethyst), head-designer 1000→4000 (obsidian).
  Medallion art gained **agate white veining** for the top metals; fixed a stray
  non-ASCII character hiding in the gold hex (`"#e6ب23d".replace(...)`).
  Tests updated + a new platinum-threshold test (63 total).
- **CS2-style `BadgeInspect`.** Click a medallion → it lifts onto a dark stage:
  drag to turn in 3D, **real thickness** via stacked rim slices, an engraved back
  face with the metal name, a restrained raking light that tracks rotation, slow
  idle drift, and an info panel (title/tier/blurb/lore/progress). CSS 3D, not
  WebGL — the art is already crisp SVG, so we get depth with no shaders and no
  load wait.
- **Softer badge lighting** — `Badge3D` now uses one soft-light sheen (was a bright
  screen hot-spot + a hard glint streak) and slower, weightier tilt; applied to
  **every** badge via `BadgeSeal` (opt out with `flat`).
- **First logo** (`components/Logo.tsx`): a passport arch wrapping an F/P monogram
  over a measurement baseline; SVG + `currentColor`, so it works in ink, on metal,
  or in any badge colour. Wired into the Nav and the card's logo slot.
- **/check** hero centred; **/help** stopped duplicating earn rules (drives text
  from each badge's `blurb`, single source of truth).

**Verified:** `tsc` clean · 63/63 vitest green · `next build` clean · live: home,
passport, check, closet, help, outfits, community, badges all 200; new badges +
Platinum/Amethyst render on /help; logo present in the nav.

**Next:** founder will specify the card's finer details; optional true-WebGL badge
(Three.js) if CSS depth isn't enough; faers-style live calculator on /check.

---

## 2026-08-12 · Session 28 — Cohesion fixes (passport + check) + interactive 3D badges

**Context:** the dark-glass passport (Sess 27) broke cohesion — low-contrast
text (unreadable), a banner that differed from the body and from every other
(light) page, lost metallic sheen, a "Passed 2026" seal that doesn't fit
"filled out a passport," and a QR motif. Also home's check field ≠ the /check
page. Founder wants ONE unified style, and better/3D-interactive badges.

**Fixed:**
- **Passport back to the cohesive LIGHT system** (matches every other page):
  white card on `bg-paper`, high-contrast ink text (readable). Restored a
  **designed metallic banner** — cobalt→ink gradient with a static diagonal
  sheen + a slow moving light streak (`animate-[shimmer_6s]`) for a brushed-metal
  look. Seal word "Passed" → **"Issued"** (and the status pill → "Issued"); the
  **QR motif → a blank `LogoPlaceholder`** reserved for our future logo. Removed
  the dark `.glass-panel`/`CredLine`/`QRMotif` treatment; reused the readable
  `Line` component.
- **/check unified with the homepage**: eyebrow + serif headline, the same pill
  URL field + ink CTA family, hairline demo pills (was a plain bold h1 + boxy
  input with red focus). Dropped the now-unused `Button` import.
- **Interactive 3D badges**: new `Badge3D` wrapper (pure CSS 3D, no libs) —
  cursor-tracked `rotateX/Y` tilt + a moving gloss so a medallion can be "turned"
  and viewed like a struck coin; reverts smoothly on leave. Applied on the
  /badges trophy case; also cleaned that page's stray gray tokens to `paper/line`.
  (Adopted the referenced badge-tooling ideas — SVG medallion + CSS ring/gloss —
  rather than raster AI art; keeps it crisp, fast, on-palette.)

**Verified:** `tsc` clean · 62/62 vitest green · `next build` clean · live:
home/check/passport/closet/badges/outfits/community all 200; /check serves the
new serif hero.

**Next:** design an actual logo for the placeholder; optional faers-style live
calculator on /check; carry serif headings into remaining page headers.

---

## 2026-08-12 · Session 27 — Lighter homepage scroll + glass "credential" passport

**Context:** founder feedback on the fashion-scroll homepage — the pinned
"Why it works" horizontal section scroll-jacked (you had to scroll the whole
block to reach the last card; felt heavy/sticky). Also shared open-source
credential/badge references (Certo/Open Badges 3.0, OpenCred/W3C-VC Apple-Wallet
cards, GitHub Learn geometric badges) + a glassmorphic "cyber passport + collectable
badge wall" HTML template, to adopt. Chose (via options) the **cobalt-black luxe
glass** skin (not the template's neon-purple, which reads dev-portfolio not fashion).
Also noted faers.tech's clean live-calculator pattern for a future /check pass.

**Built:**
- **Homepage horizontal section reworked** to be **user-driven** (no scroll-jack):
  a drag-to-scroll row (pointer capture) + swipe + trackpad + prev/next arrows,
  proximity snap, hidden scrollbar, `data-lenis-prevent`, and a drag-vs-click
  guard. Removed the pinned `useScroll`→`x` mechanic. Tuned Lenis `duration:1.1`
  → `lerp:0.1` (snappier, less "sticky").
- **Passport VIEW rebuilt as a glass credential** (`ViewBook`): dark `bg-ink`
  band with ambient cobalt glow; a **holo foil edge** (cobalt→sky gradient 1px
  border) over a **dark frosted `.glass-panel`**; header wordmark + pulsing
  "Verified" pill; portrait in a cobalt ring; identity rows (`CredLine`, mono
  IDs); achievements (hover-meaning medallions); signature look (dark select +
  mannequin); body-type figure; and a footer with a **rotating dashed seal**
  (the user's top medallion, `animate-[spin_20s]`), the MRZ verification string
  (mono), and a decorative **QR motif**. All in the black/cobalt/porcelain system.
  Edit mode unchanged. Added `.glass-panel` to globals; `.no-scrollbar` util.

**Verified:** `tsc` clean · 62/62 vitest green · `next build` clean · live:
home + passport/closet/badges 200 (credential renders in VIEW mode once the
passport has content; markup validated by build).

**Next (optional):** apply the collectable-wall polish to the /badges page;
faers-style live calculator on /check; real product imagery in the lookbook.

---

## 2026-08-12 · Session 26 — Fashion-scrolling homepage (Lenis + Framer Motion)

**Context:** founder wants the homepage to be a "fashion scrolling design" —
parallax depth, sticky product-pinning, horizontal-scroll lookbook, scroll-driven
reveals — borrowing the immersive magazine feel but WITHOUT the impractical
load-wait/heavy intros. Asked for a complete first version to review.

**Built (`src/app/page.tsx`, full rebuild):** added deps **framer-motion@11** +
**lenis@1**. Homepage is now a scrolling narrative:
- **Lenis smooth inertia scroll**, homepage-only (init/destroy in a `useEffect`,
  scoped so other pages stay native) and **disabled under `prefers-reduced-motion`**.
- **Hero** (black band): the bold serif statement, now with a subtle scroll
  **parallax** (content drifts up + fades via `useScroll`/`useTransform`) + an
  animated scroll cue.
- **Sticky "how it works"**: a `sticky` pinned text column while three editorial
  step panels glide past and reveal (`whileInView`) — the sticky-pinning pattern.
- **Horizontal-scroll showcase**: a tall pinned section where vertical scroll
  translates a row of 5 lookbook cards **sideways** (measured distance →
  `useTransform` x). Cards use safe editorial visuals (color fields, the SVG
  `OutfitMannequin`, type) — no scraped/brand imagery. Reduced-motion falls back
  to a normal swipeable row.
- **Parallax statement**: layered depth — a giant faint "FIT" background word
  moves slower than the foreground serif statement.
- **Closing CTA** + the preserved **value-first content** (URL form in hero,
  returning-user dashboard / new-user guide) so nothing functional was lost.

**Practicality kept:** no loader, no WebGL, one light dep set; all motion degrades
gracefully. Legal: only type/color/our-own-SVG visuals — no brand images/video.

**Verified:** `tsc` clean · 62/62 vitest green · `next build` clean (home 152kB
first-load, framer-motion cost — acceptable for a marketing page) · live: home
serves all sections; closet/passport/check still 200 (Lenis scoped to home).

**Next:** optional real product photography/video into the lookbook frames;
carry the system into inner pages; consider Spline 3D garment later (opt-in).

---

## 2026-08-12 · Session 25 — Black-led + cobalt palette (research-grounded), bold black hero

**Context:** founder shared two awwwards refs (K95 — cobalt WebGL portfolio;
NOTHIN' — giant black grotesk) — loves the *first-impression impact* but finds
them impractical (heavy animation, load-wait). Directive: borrow the "眼前一亮"
moment, not the heavy motion; main color = high-end black + lighter tones; and
research color/typography psychology first. Grounding (Wikipedia color-psychology
synthesis, since Vogue blocked fetch): **black is the strongest evidence-backed
premium cue** (expensive/high-quality/authority/sophistication); **blue/violet
reinforce sophistication**; **saturation drives excitement** (use a strong accent
sparingly); ~62–90% of a snap product judgment is color; no universal color
(context-dependent). Fashion palette theory: true neutrals base → staples (navy/
beige/olive) → accents (red/cobalt/butter). Founder picked **cobalt** as the rare
accent (via previewed options).

**Built:**
- **Palette re-grounded** (`tailwind.config.ts`): retired warm-ivory/red for a
  cool **black-led + porcelain** system. Repointed the `brand` token to **cobalt
  `#2438d6`** (dark/light/tint) so *every* `text-brand`/`bg-brand` across the app
  flips to cobalt in ONE place. `paper` → cool porcelain (`#F3F3F1`), `ink` → cool
  near-black (`#17181c`), `line` cooled. `globals.css` roots + `ConfidenceRing`'s
  hardcoded `#A6192E` updated to cobalt.
- **Dual-surface principle:** black = statement (hero/brand), porcelain = the
  working surface you read/use (closet, passport…). Keeps impact AND usability.
- **Landing hero rebuilt black-led** (`page.tsx`): full-width `bg-ink` band, huge
  serif headline (text-6xl→8xl, `leading-[0.95]`), the accent word in cobalt
  italic, a glassy translucent URL field with a **cobalt CTA**, one clean staggered
  `rise` entrance — no loader, no wait. Guided content sits on porcelain below.

**Deliberately NOT done (practicality):** no WebGL/3D, no intro loader, no heavy
motion — impact is scale + contrast + one accent. Framer Motion / Lenis noted as
optional future polish; open-source refs given (GSAP now free, Three/R3F, Lenis,
SplitType, Fontshare, Codrops).

**Verified:** `tsc` clean · 62/62 vitest green · `next build` clean · live:
home + passport/closet/check/outfits/community/badges all 200; hero serves the
black `bg-ink` band + cobalt accent.

**Next:** carry cobalt/black/porcelain deeper per page; consider Framer Motion +
Lenis for tasteful fast motion; then real product-photography treatment.

---

## 2026-08-12 · Session 24 — Editorial design system (foundation pass): fashion-magazine aesthetic

**Context:** the founder wants a cross-cutting visual upgrade — "fashionable,
high-end, minimal, tasteful" for an audience of fashion-minded users, bloggers,
and taste-sharers; no text-heavy landing. Also cleared up a tech misconception
(AWS = hosting, Node = runtime; neither determines how a site *looks* — that's
CSS/typography/motion). Chosen direction (via a previewed options prompt):
**Editorial / fashion-magazine** — warm ivory paper, a characterful serif
display, hairline rules, generous whitespace.

**Built (foundation + landing, first pass):**
- **Design tokens** (`tailwind.config.ts`): `paper` ivory canvas (#F7F3EC + soft/
  dim), warm near-black `ink` (#201c18) + warm grays, `line` hairline color,
  `letterSpacing.editorial`, `boxShadow` warmed, new `rise` reveal animation.
  `fontFamily.serif`/`sans` via CSS vars.
- **Fonts** (`layout.tsx`): pair **Fraunces** (editorial serif display, `--font-serif`)
  with **Inter** (`--font-sans`); body defaults to sans on the `bg-paper` canvas.
  `globals.css`: paper/ink root vars, `optimizeLegibility`, `.eyebrow` small-caps
  label helper, serif tracking.
- **Landing hero** (`page.tsx`): rebuilt editorial — an eyebrow line, a large
  serif headline ("Know what fits, / *anywhere.*"), one supporting sentence, a
  refined pill URL field with an ink CTA, staggered `rise` entrance, and a
  hairline divider. Step numbers + section headings now serif.
- **Shared UI** (`ui.tsx`): primary button → **ink/black** (couture) with `paper`
  text (brand red demoted to a rare accent); secondary/ghost + inputs use the
  `line` hairline + `paper-soft` fills. `Card` ring → `line`.
- **Nav**: serif italic wordmark, underline-on-active links (no more red pills),
  ink pill for "Claim account", `bg-paper` bar.
- **Canvas cohesion**: swapped the full-page gray canvases (passport ×2, refresh
  ×2) to `bg-paper` so the whole site reads as one ivory surface. Small gray
  insets/chips left as subtle accents.

**Verified:** `tsc` clean · 62/62 vitest green · `next build` clean (Fraunces+Inter
fetched) · live: home/passport/closet/refresh 200; landing serves the new serif
hero markup.

**Next (rollout):** carry the editorial system deeper into each page (closet,
check, passport card, outfits, community, badges) — headings to serif, spacing/
imagery to magazine rhythm; consider Framer Motion/GSAP for richer reveals; then
a real product-photography treatment. Also still pending: drag-DnD reorder,
deployment, course deliverables.

---

## 2026-08-12 · Session 23 — Folder polish: custom colors, in-file inline edit + edit history, reorder mode, signature look

**Context:** founder review of the Session-22 folder view produced a batch of
fixes. (1) Folders should have a *user-chosen color*, settable at creation and
changeable later. (2) Clicking into a file gave no way to edit — edit should
happen right in the file. (3) The detail should show created / last-modified /
full edit-history times, where a "formal" edit is only counted once the user
stops editing for a while (rapid edits coalesce). (4) Community's toggle should
just say "Unlist". (5) Passport should optionally feature a *signature outfit*.
(6) The closet Refresh control needs a tooltip explaining what it does. (7)
Reorder was always-on and cluttered — folders AND items should reorder only
behind a single toggle.

**Built:**
- **Folder colors.** `Collection.color` (nullable key). `FOLDER_COLORS` map
  (8 named sleeves) + `FolderColorPicker` swatch row. Chosen at creation ("Folder
  color" field) and editable later via a swatch button in each folder header
  (grid view; Uncategorized excluded). `folderColorFor(color, seed)` falls back
  to the position-based auto color when none is picked. `/api/collections`
  POST/PATCH accept `color`.
- **In-file inline edit + timestamps.** `KnownGoodItem.editHistory` (JSON array
  of ISO timestamps). Closet PATCH now fetches the row, checks whether a tracked
  *content* field actually changed (reorder/move excluded), and **coalesces**:
  edits within a 30-min window advance the last history entry, longer gaps append
  a new one — so bursts count as one formal edit. `DetailSheet` now edits inline
  (renders the existing `EditRow` right inside the sheet, no bounce to the list)
  and shows a History block: Created · Last modified · expandable list of recorded
  edits. Verified via API: two rapid edits → 1 entry; a sortIndex-only PATCH adds
  none.
- **Reorder mode.** One `⇅ Reorder` toggle in the toolbar. OFF = clean (no
  arrows). ON = folder ▲▼ arrows in each collection header (swap sortIndex with
  neighbor via two collection PATCHes) + item ▲▼ arrows in the list, plus a hint
  banner. Item reorder arrows are now gated behind this instead of always showing.
- **Signature look on the passport.** `User.signatureOutfitId`; `/api/profile/prefs`
  accepts it (validated to be one of the user's own outfits); `/api/status`
  returns it. Passport VIEW gained a "Signature look" section: a dropdown of your
  outfits + an `OutfitMannequin` render of the chosen look (title/occasion/pieces/
  likes). Falls back to a compose-an-outfit link when you have none.
- **Community unlist** button label simplified from "Listed ✓ · Unlist" → "Unlist".
- **Refresh tooltip.** Both the per-folder and top "Refresh fit" controls now
  carry a title explaining it re-rates how pieces fit right now.

**Verified:** `tsc --noEmit` clean · 62/62 vitest green · `next build` clean ·
live: closet/passport/community/outfits/badges 200; collection color create +
PATCH, edit-history coalescing, and reorder-exclusion all confirmed via API.

**Next:** true drag-and-drop reorder (arrows shipped); global aesthetic pass;
deployment (SQLite→Postgres); course deliverables.

---

## 2026-08-12 · Session 22 — Full-path URL extraction, real filing-cabinet folder view, passport badge tooltips

**Context:** three founder asks. (1) The URL auto-fill was weak — the example
`patagonia.com/product/womens-fitz-roy-down-hoody/85506.html?dwvar_85506_color=SMTB`
returned an empty name + wrong category ("tshirt") even though the URL clearly
carries brand, garment, and gender. (2) The Session-21 "manila tile per item"
did not match the founder's mental model: a folder should be a real folder
holding *stacked file cards*, each peeking one key-info row, front file open,
hover to peek, click to pull fully out onto a "desk", plus a side "bucket" to
set a few items aside for comparison (mirroring pulling clothes out to plan an
outfit). (3) The passport should show the holder's badges and reveal each
medallion's meaning on hover.

**Built:**
- **Extractor upgraded to whole-path parsing (`lib/extractor.ts`).** Root cause:
  we only read the LAST path segment as the slug, so a trailing SKU (`85506.html`)
  hid the descriptive segment. Now: parse ALL path segments; `pickNameSlug()`
  scores each segment by real-word count and picks the richest; `detectCategory`
  + new `detectGender` run over the full path. Expanded category keywords to the
  whole taxonomy (bottoms/footwear/accessories) with order-sensitive matching —
  insulated outerwear (`down`, `puffer`, `parka`) matches as *jacket* before the
  generic hoodie rule, so "down hoody" → jacket. Gender detection (womens/mens/
  unisex, women-before-men) added to `ExtractedProduct` and threaded through
  `/api/closet/extract` → the closet add form now prefills the Line/gender field.
  Pure-numeric tokens ("00", "42") are dropped from names. New `garmentNoun()`
  gives a clean fallback ("Uniqlo T-shirt") when no name is recoverable.
- **7 new tests** in `extractor.test.ts` (Patagonia, Zara bare-SKU, Levi's/J.Crew
  bottoms, Nike footwear, women≠men, id-only URLs, unknown-brand provenance).
  Verified live: the Patagonia URL now returns Patagonia · Fitz Roy Down Hoody ·
  jacket · womens (was: empty name · tshirt).
- **Folder view rebuilt as a real filing cabinet (`closet/page.tsx`).** Each
  *collection* is now a colored, tabbed folder sleeve (6-color palette + neutral
  for Uncategorized) that is visually distinct from the white "file" cards inside.
  Items stack with a slight negative-margin tuck; every file shows one key-info
  row (glyph · color · name · type · size), the front-most file is open, and
  hovering any file expands its overview in place (thumb, brand, fit stars, color,
  ＋Bucket). Empty collections render an explicit empty-folder graphic.
  - **Detail sheet** (`DetailSheet`): clicking a file pulls it fully out onto a
    right-side desk sheet with the large thumb, all fields, per-variant size rows
    (edit/remove each), notes, Move-to-collection, and Add-to-bucket. Backdrop
    click closes. Reuses `MoveMenu`/`ItemThumb`/`safeNotes`.
  - **Comparison bucket** (`BucketPanel`): a floating panel that holds items set
    aside for side-by-side viewing; add from any file or the sheet, remove/clear,
    click a chip to reopen its sheet. Page-level `compareItems` state, reconciled
    against the latest item data on every reload (stale ids dropped). Explicitly
    labeled "not a saved list."
  - Old per-item `ItemTile` removed.
- **Passport badges (`components/Badges.tsx`, `passport/page.tsx`).** New
  `BadgeHoverSeal` shows a styled tooltip (title · metal tier · what it means ·
  cultural lore) on hover, anchored below-left so it stays inside the
  `overflow-hidden` passport card. `EarnedSealRow` renders ALL earned badges
  (pinned first). Passport now pulls `earnedBadgeIds` from `/api/status` and shows
  the full set with a "hover a medallion for its meaning" hint (was: pinned-only
  with a native title tooltip).

**Verified:** `tsc --noEmit` clean · 62/62 vitest green · `next build` clean ·
live: closet/passport/badges 200, extract endpoint returns correct
brand/name/category/gender for Patagonia + Uniqlo/H&M/Nike samples.

**Next:** collection drag-reorder; global "Apple-level" aesthetic pass;
deployment (SQLite→Postgres); course deliverables (interviews, midterm PO deck).

---

## 2026-08-11 · Session 21 — Manila-folder tiles, icon view toggle, variant grid, corner-save placement

**Context:** founder UI polish (with a reference image of tabbed folder dividers):
folder view should look like stacked file folders where hovering makes a "file"
pop out toward the top-right revealing photo+info; view toggle should be a small
icon button; merge-variant list should be small tiles with hover-popover
descriptions; and the edit corner-save belongs INSIDE the card (not on the edge).

**Built:**
- **`ItemTile` redesigned as a manila folder:** a tab + gradient folder front
  showing just the name/type; on hover a "file" (photo + name + type + size +
  stars) slides up-and-right out of the folder's top-right corner (CSS
  translate + opacity, 300ms). Matches the founder's reference.
- **View toggle → icon buttons:** list = 3-line glyph, folders = folder glyph
  (SVG), with tooltips, replacing the "☰ List / ▦ Folders" text pills.
- **Merge variants → tiles:** the expanded variant list is now a 3–4 col grid of
  small tiles (thumbnail + size); hovering a tile pops a description card above
  it (size · color · stars + Edit/Unmerge/Remove).
- **Edit corner-save back inside the card:** `right-3 top-3` within the card; the
  Photo row reserves `pr-20` so its helper never sits under the button (the
  earlier overlap is gone without pushing the button off the edge).

**Verify:** `tsc` clean · `next build` clean · closet renders 200; the two dev-log
lines are just Fast-Refresh full-reload notices from editing, not runtime errors.

---

## 2026-08-11 · Session 20 — Security hardening: email reset, rate limits, export, image-gen, account controls

**Context:** founder batch — fix the edit-card corner-save overlap, add email as a
login method + username rules, then the deferred security/backlog set: real email
password reset, rate limiting, code-export button, a real image-gen provider, and
account safety (password reset without changing the code + soft-deactivate).

**Built:**
- **Bug fix:** edit-card corner "Save" no longer overlaps the Photo helper text —
  moved to the card's outer top-right (`-right-2 -top-2`) + `pr-14` on the Photo row.
- **Email login + username rules:** login & reset now accept **username / email /
  account code** (email detected by "@"). Username claim now rejects anything that
  looks like an email (would collide with email login); uniqueness already enforced.
- **Rate limiting** (`lib/rateLimit.ts`, in-memory fixed-window, per-IP): login
  10/5min, request-reset & recover 5/15min, reset 10/15min, `/api/view` 60/min,
  export 20/min. Returns 429 + Retry-After. (Per-process; swap for Redis before
  multi-instance prod.) Verified: 11th login → 429.
- **Real password reset (token flow):** schema `resetTokenHash` + `resetExpiresAt`.
  `/api/auth/request-reset` finds by identifier, stores a hashed one-time token
  (30-min expiry), emails a link via **Resend** (`lib/email.ts`); if email isn't
  configured it returns a `devLink` so beta can still reset. `/api/auth/reset`
  verifies token+expiry, sets the new password, logs in. **Account code never
  changes.** `/recover` rewritten to "send link"; new `/reset` page. Old
  `/api/auth/recover` kept for back-compat.
- **Export by code:** `/api/view/[code]/export` returns closet JSON as a download,
  **only when `exportPolicy === "anyone"`** (else 403); `/u/[code]` shows a
  "⬇ Export as JSON" button when allowed. Coarse-only, respects showBodyType.
- **Real image-gen:** `tryonImage.ts` gained a **Replicate FLUX schnell** provider
  (~$0.003/image) — set `REPLICATE_API_TOKEN` and the "✨ Photoreal preview" works
  with zero endpoint wiring (async create→poll→output). Generic `TRYON_API_URL`
  still supported as fallback. `.env.example` documents Replicate + Resend + APP_URL.
- **Account safety:** `/api/auth/change-password` (logged-in, verifies current pw,
  code unchanged) and `/api/auth/deactivate` (soft delete: `deactivated=true`,
  unlists from community, clears session). Deactivated accounts are rejected by
  login, `/api/view`, export, and the community directory. `/account` gained
  collapsible "Change password" + a red "Deactivate account" danger zone.

**Cost note (founder asked for cheapest model):** wired **Replicate FLUX schnell**
as the default photoreal path (~$0.003/img) — but I have no key and won't use a
fake one; founder adds `REPLICATE_API_TOKEN` to turn it on. Email = Resend free tier.

**Verify:** `tsc` clean · 55/55 tests · `next build` clean · live smoke: email-format
username rejected, email login works, devLink returned w/o mail provider, export 200
when policy=anyone, change-password 401/200, deactivate 401/200 → view 404, login
rate-limit 429 on 11th.

---

## 2026-08-11 · Session 19 — Closet add-by-URL + item photos + grid view, outfit closet-picker, bug fixes

**Context:** founder feedback batch — fix the outfits preview dead-end, drop the
ugly passport "FP" circle, let closet items be added by URL / named / photographed,
add a folder grid view, let outfits pull from the closet, and a corner Save on edit.
Plus questions on image-gen recommendation + brand-logo legality.

**Built:**
- **Bug fix — outfit preview dead-end:** the photoreal preview had no way back to
  the mannequin. Added a "← Stylized view" button and robust reset when pieces
  change; the "not set up" note no longer sticks.
- **Passport banner:** removed the right-side "FP" circle in both view & edit
  banners. The view banner still shows a real earned+pinned badge seal (that's
  meaningful), but no generic FP placeholder.
- **Closet item photos + names:** schema `KnownGoodItem.displayName` +
  `imageDataUrl` (user-uploaded, client-resized 320px JPEG — deliberately the
  user's OWN photo, never scraped brand art). Closet add + edit forms gained a
  photo upload and a Name field; list rows show a thumbnail + the name.
- **Add-by-URL:** paste a product URL → `/api/closet/extract` (reuses `extractSmart`)
  pre-fills brand / suggested name / category / sizes; user reviews, picks size,
  and can add their own photo before saving.
- **Folder/grid view:** a List ↔ Folders toggle. Grid renders stacked-card tiles
  showing the name; hover reveals info + photo. (`ItemThumb`, `ItemTile`.)
- **Outfits from closet:** composer got "+ Add from my closet" — a searchable
  picker that appends closet items as outfit pieces (with their brand/size/color).
- **Edit card corner Save:** small "Save" button pinned top-right of the edit card,
  in addition to the bottom button.

**Founder Q&A recorded:**
- *Image try-on:* recommend a dedicated **virtual-try-on API** (Google Vertex VTO,
  Kling/Kolors, FASHN.ai, or Replicate-hosted IDM-VTON) for garment-on-body
  fidelity; a plain text-to-image (Flux/SDXL/DALL·E via Replicate/Fal) for a
  cheaper stylized model shot. `/api/tryon` is provider-agnostic — set `TRYON_API_URL`.
- *Brand logos — LEGAL NOTE:* do **not** ship real brand logos by default.
  Trademark law permits *nominative* text reference ("this is a Nike item"), but
  displaying a brand's LOGO implies endorsement/affiliation (many brand guidelines
  forbid it) and hotlinking their image files adds copyright + bandwidth issues.
  Chosen safe path: brand shown as **styled text**; imagery is **user-uploaded
  photos of their own items** only. Revisit only with per-brand permission/official
  affiliate assets.

**Verify:** `tsc` clean · 55/55 tests · `next build` clean · live smoke: URL
extract fills brand/name/sizes, displayName + image persist, outfit-from-closet
posts, all pages 200.

---

## 2026-08-11 · Session 18 — Badge taxonomy (tracks + rare capstones) + escalating medallion craft

**Context:** founder wanted badges sorted, tiered per category, and rarer at the
top ("物以稀为贵"), plus a shape/finish that grows more refined with rank — with
real cultural/textile-history depth, tasteful (Roman/Chinese/art references), not
gaudy. Chose the **Tracks + Capstones** scheme with a **circle→relief→laurel**
finish ladder.

**Built:**
- `lib/badges.ts` restructured into **3 progression tracks × 3 tiers** + **3 rare
  capstones** (12 total):
  - The Wardrobe: Verified Closet → Curator → Wardrobe Archivist
  - The Fit Record: Truth-Teller → Calibrated → Open Closet
  - The Atelier: First Look → Stylist → Couturier
  - Rare Honors: Acclaimed (100 likes/look) → Tastemaker (500) → Head Designer (1000)
  Each badge gained `track`, `tier`, `finish` (0–5 ornateness), `motif` (icon key),
  and `lore` (a real history note — Roman fibula/wax tablet, guardaroba, Jacquard
  loom, imperial jade, etc). Renamed `public-figure`→`open-closet`; added
  `first-look`/`couturier`/`tastemaker`. New `badgesByTrack()` for grouped UI.
- `components/BadgeMedallion.tsx` reworked around the **finish ladder**: low tiers
  = plain struck coin + faint sheen; higher tiers add denser fluting, engraved
  rings, a guilloché field, deeper shadow/relief, a soft halo, rim star-points,
  and — only at the top (finish 5) — a **laurel wreath overflowing the rim**.
  Restraint tuned so it reads refined, not busy. Motif engravings are custom
  geometric line-art per badge (hanger, shelves, archive, wax tablet, gnomon,
  compass rose, needle, shears, loom, gem, obelisk, crown).
- `/badges` now **grouped by track** (tiers in order) with earned ✓ / dimmed
  unearned states, lore lines, and pinning kept (earned-only).
- `/help` earn-conditions updated for the new ids + shows lore.
- Lightweight extra: closet add form got an **in-store-only** checkbox (schema +
  API already supported `onlineAvailable`).

**LLM guidance recorded:** text extraction → Claude Haiku 4.5 (cheap, already
wired), Sonnet only for hard pages; images → external VTO/text-to-image (Claude
can't render), integration already key-gated.

**Verify:** `tsc` clean · 55/55 tests (badge-track grouping + new thresholds
covered) · `next build` clean · live smoke: 12 badges total, starter earns at 5
items, all pages 200.

---

## 2026-08-11 · Session 17 — Premium badge medallions + photoreal try-on integration

**Context:** founder felt the emoji-in-a-circle badges looked cheap and wanted
designed, glossy medallions; also greenlit wiring the real photoreal try-on path.

**Built:**

*Premium badge medallions:*
- `components/BadgeMedallion.tsx` — each badge is now a struck-metal SVG coin:
  metallic radial sheen per tier, a fluted/notched edge (36 notches), a recessed
  inner disc with rim bevel, a specular gloss arc, and a **custom geometric
  line-icon per badge** (hanger, shelves, archive, clipboard-check, target,
  globe, scissors, gem, crown) instead of emoji. Palettes tuned per tier
  (bronze/silver/gold/obsidian/diamond/jade). Scales cleanly; locked → grayscale
  + lock chip.
- `BadgeSeal` now delegates to `BadgeMedallion` (takes `id` for the icon; `glyph`
  kept for back-compat but unused). All callers (passport seal, badge library,
  help, chips, pinned seals) pass `id`.

*Photoreal try-on (honest, key-gated — same pattern as the LLM extractor):*
- `lib/tryonImage.ts` + `/api/tryon` — OFF unless `TRYON_API_URL` is set. When
  configured, POSTs a privacy-safe prompt (coarse body descriptor + garment list,
  **never** precise measurements) to a provider-agnostic text-to-image / VTO
  endpoint and returns an image URL/data-URL. Any failure → null.
- Outfits composer got a "✨ Photoreal preview" button: shows the generated image
  when available, otherwise a clear "isn't set up yet — using the stylized view"
  note. The stylized SVG mannequin remains the default. `.env.example` documents
  `TRYON_API_URL` / `TRYON_API_KEY`.
- Verified live: no key → `/api/tryon` returns `{configured:false}`, UI keeps the
  mannequin.

**Verify:** `tsc` clean · 54/54 tests · `next build` clean · pages 200 · no dev
runtime errors.

**Note:** photoreal output requires the user/founder to supply an image-gen API
(cost + provider theirs to choose). The integration + fallback are done; only the
external endpoint is unconfigured.

---

## 2026-08-11 · Session 16 — Outfits + likes (top badges made real), stylized try-on preview, passport/privacy polish

**Context:** founder greenlit the outfit-posting + likes line to make the
obsidian/diamond/jade badges real, asked for an "in-store only" flag, a virtual
try-on preview, and a batch of passport/privacy refinements + a help page.

**Built:**

*Outfits + likes (the top-badge engine):*
- Schema: `Outfit`, `OutfitItem`, `OutfitLike` (+ `KnownGoodItem.onlineAvailable`,
  `User.showBodyType`). Likes are anonymous-friendly — keyed by session id
  (`voterKey`), unique on (outfitId, voterKey) so one like per session; claimed
  users also store userId.
- APIs: `/api/outfits` (GET mine/feed, POST create, DELETE), `/api/outfits/like`
  (toggle, deduped).
- `/outfits` page: compose a look (garment types + colors), **live mannequin
  preview**, post; see your outfits with like counts. `/community` gained a
  "Latest looks" feed (most-liked first) with like buttons.
- **Top badges are now REAL** (were locked): Stylist = 3 posts, Acclaimed = 100
  likes on one look, Head Designer = 500 total likes. `badgeStats` feeds real
  outfitPosts / topOutfitLikes / outfitLikes. Verified live: 3 posts → Stylist.

*Stylized try-on preview (honest about scope):*
- `components/OutfitMannequin.tsx` — a deterministic layered SVG that morphs by
  body type and paints each garment layer in the outfit's colors (top→torso,
  bottom→legs, shoe→feet, hat→head, scarf→neck), with neutral defaults so a
  single-item look still renders. **Photoreal generation is NOT possible with
  our LLM** (Claude can't render images); `generatePhotoPreview()` is a
  documented scaffold that throws until an external image-gen/VTO API is wired.
  Told the founder this plainly.

*In-store-only flag:*
- Outfit + per-piece `onlineAvailable`; posts show a 🏬 "In-store only" tag (or
  "some pieces in-store only"). Closet API accepts the flag too.

*Passport / privacy polish:*
- Body type is now **hideable** — a `showBodyType` checkbox; `/api/view` and
  `/api/community` null out the body type when hidden. Re-verified no cm leak.
- "Notes" → **"Memo"**.
- Claim now **requires an explicit body-type choice** ("Prefer not to say" is a
  valid pick; empty placeholder blocks submit), with a separate show-publicly
  checkbox. Coarse types already expanded (petite…plus) in Session 15.

*Help page:*
- `/help` — how the app works + a badge table generated from the `BADGES` source
  of truth (never drifts), with plain-language earn conditions.

*Nav:* added Outfits + Help; condensed labels.

**Verify:** `tsc` clean · 54/54 tests · `next build` clean · live smoke: claim →
3 outfits earns Stylist; like dedups (double-like stays 1); in-store flag shows;
showBodyType=off hides body type in public view; no cm leak; all pages 200.

**Still staged (needs real scale, not faked):** photoreal try-on (needs an
image-gen/VTO API + key); Acclaimed/Head Designer require real like volume.

---

## 2026-08-11 · Session 15 — Prestige layer: badges, avatars, passport view-mode, community directory

**Context:** founder wants the passport to become a show-off object — an official
seal, earnable metal-tier badges (bronze→silver→gold→obsidian→diamond→jade),
titles like "Head Designer", avatars everywhere, a beautiful read-only passport
card after first fill, and an opt-in community directory with a "post yourself"
option. Explicitly agreed (AskUserQuestion): build what's real now, stage the
outfit/like-driven tiers as visible-but-locked; passport defaults to the polished
card, Edit flips to the form.

**Built:**

*Badge system (transparent, earned from real data — like the fit engine):*
- [`src/lib/badges.ts`](app-web/src/lib/badges.ts) — 9-badge ladder with metal
  tiers + a `METAL_STYLE` visual map. Earned badges: Verified Closet (5 items),
  Curator (12 items/3 collections), Wardrobe Archivist (25 items/6 brands),
  Truth-Teller (3 outcomes), Calibrated (10 refreshes), Open Closet (listed in
  community). **Staged/locked** with "coming soon": Stylist (obsidian), Acclaimed
  (diamond), Head Designer (jade) — these need outfit posts + likes, which don't
  exist yet, so they're shown locked rather than faked. Every badge has a
  plain-language blurb + progress text. `evaluateBadges`/`earnedBadgeIds`/`parsePinned`.
- [`src/lib/badgeStats.ts`](app-web/src/lib/badgeStats.ts) — one server helper
  computes real stats (closet size, brands, collections, outcomes, refreshes,
  community-listed) so status/view/community all agree.
- [`Badges.tsx`](app-web/src/components/Badges.tsx) — shared `Avatar`, `BadgeSeal`
  (metal medallion), `BadgeChip`, `PinnedSeals`.
- 8 new badge tests (54 total). Guard tested: locked badges never earn even with
  maxed stats; unearned badges can't be pinned (server filters).

*Passport view/edit mode:*
- `/passport` now defaults to a polished READ-ONLY card once it has content
  (avatar + official seal = your top pinned badge, or "FP" if none; identity
  lines; an Achievements row of pinned seals; body-type figure). An "✎ Edit"
  button flips to the existing inline-editable book; "Done editing" flips back.
  Empty passports open straight into edit.

*Badge library:*
- New `/badges` page — trophy case grouped into Earned / In progress / Coming
  soon, with progress text, and **pin up to 3** earned badges to the passport
  (writes `/api/profile/prefs`).

*Avatars + badges everywhere:*
- Home dashboard: identity strip (avatar + earned-badge count + pinned seals).
- `/u/[code]` public view: avatar + pinned/earned seals in the header.
- Community.

*Community directory + post-yourself:*
- New `/api/community` (opt-in listing, coarse info only, prestige-sorted).
- `/community` rewritten: a "Post yourself to the community" toggle (opt-in,
  claim-gated, unlist anytime), the code lookup, and a public grid of listed
  closets showing avatar + badges + item counts.

*Misc founder asks:*
- Coarse body types expanded to petite/slim/lean/average/athletic/curvy/broad/
  tall/plus (claim form + enum).
- Post-claim screen now leads with "View my passport →".
- BMI already removed (Session 14).

**Schema:** `User.listedInCommunity Boolean`, `User.pinnedBadges String`. New
route `/api/profile/prefs` (write-guarded by canEdit) for pinning + listing.

**Privacy:** re-verified `/api/view/[code]` leaks NO cm measurements even with
avatar/badges added. Avatar is cosmetic and intentionally public; precise body
data still never leaves the server.

**Staged for a future session (not faked):** outfit posting + likes + the
obsidian/diamond/jade "acclaim" tiers, and the Head Designer leaderboard. The
ladder shows them locked so the aspiration is visible.

**Verify:** `tsc` clean · 54/54 tests · `next build` clean · live smoke: claim →
add 5 clothes earns "starter" → pin + list → appears in community directory + on
public view; unearned-badge pin correctly rejected; no measurement leak; all
pages 200.

---

## 2026-08-11 · Session 14 — Size module cleanup + passport UX overhaul

**Context:** founder feedback: the size/converter block is the product's core but
was cluttered and confusing (converter always showed "43", no way to change the
scale cleanly). Plus a batch of passport asks and a claim-flow dead-end.

**Built:**

*Size module (the core) — decluttered & reusable:*
- `SizeConverter` is now **collapsible** — hidden behind a "Know it in another
  scale? Convert →" toggle so the size field stays clean. When open: pick your
  scale, and the input's **example placeholder follows the scale** (EU→"43",
  US→"10", cm→"27") instead of a fixed "43". Equivalents render as tap-to-adopt
  chips; adopting closes the panel.
- Each `Scale` gained an `example` field ([sizeConvert.ts](app-web/src/lib/sizeConvert.ts));
  scale labels are now human ("S / M / L", "EU number", "Waist (inches)").
  Scale parsers accept the bare value (scale already selected) so you just type
  "27" not "27 cm".
- `SizeInput` restructured to 4 clean rows: chips → input → one help line with a
  "what do these mean?" toggle → collapsed converter. The pants explainer moved
  behind that toggle.

*Passport:*
- **cm/in + kg/lb unit toggles** on Measurements. Fields STORE cm/kg but DISPLAY
  the chosen unit (`LenField`/`WeightField` convert on commit). Storage/engine
  untouched.
- **Region explained** inline ("which country's size labels to show first…").
- **Preferred fit is now multi-select, up to 3**, first = primary (badge "1st").
  Stored as CSV in the existing `preferredFit` column (no migration). Engine +
  recommendService use the FIRST token as the default; the Check page still
  previews any single fit. Server validates 1–3 valid tokens.
- **BMI removed** from the body-type card (founder said unnecessary).
- **Portrait upload** — click the portrait, image is client-resized to a 256px
  square JPEG data URL, stored in new `FitProfile.avatarDataUrl` (≤300KB,
  server-validated as a data:image). Falls back to initials. Never exposed by
  account code.
- **Sticky save bar** at the bottom of /passport: a live save dot + "Changes
  save automatically" + explicit Closet / claim actions, so users always know
  edits persist and how to keep them.

*Account:*
- Claim form is **no longer a dead-end** — added "← Edit my passport / closet"
  back links and copy clarifying nothing is locked until claim is pressed.

**Schema:** `FitProfile.avatarDataUrl String?` added; `preferredFit` semantics
changed to CSV (same column). `prisma db push` applied.

**Verify:** `tsc` clean · 46/46 tests · `next build` clean · live smoke: CSV
preferredFit stored + primary drives rec (oversized,slim → XL), avatar stored,
4-fit over-cap rejected (400), cm-entered chest round-trips.

---

## 2026-08-11 · Session 13 — Size converter + pants-number explainer

**Context:** founder didn't understand what the numeric pants sizes mean, and
wanted to enter a size in any scale (e.g. "I wear EU 43 shoes") and see the
equivalents.

**Built:**
- [`src/lib/sizeConvert.ts`](app-web/src/lib/sizeConvert.ts) — per-domain scale
  tables. Each domain (shoe / top / bottom) has a set of Scales that parse a raw
  string into a canonical rung and render it back. `convert(domain, raw, fromScale)`
  → equivalents in every scale. Shoes: EU ↔ US(men) ↔ UK ↔ cm (EU as canonical,
  US = EU−33, UK = US−1). Tops: alpha ↔ EU numeric. Bottoms: waist-inches ↔ cm
  ↔ alpha. Socks/accessories have no converter (returns []). Everything labeled
  "≈" — cross-scale is approximate.
- [`SizeConverter`](app-web/src/components/SizeConverter.tsx) — a panel under the
  size field: pick your scale, type your size, see equivalents as tap-to-adopt
  chips. Rendered by `SizeInput` for domains that support it.
- **Pants-number explainer** in `SizeInput`: "Numbers are inches: a single
  number is your waist (32 = 32″ ≈ 81cm). 32×34 = waist 32″ × inseam 34″
  (inseam = inner-leg length)." Shown as a 💡 hint for bottoms; a shorter one
  for shoes points at the converter.

**Verify:** `tsc` clean · 46/46 tests (9 new in `sizeConvert.test.ts`, incl. the
founder's EU 43 → US 10 / UK 9 / 27cm case) · `next build` clean.

---

## 2026-08-11 · Session 12 — Multi-garment domains, cross-domain disclaimer, body type + figure, brand-bias learning, LLM extractor scaffold

**Context:** the founder asked to knock out the whole roadmap in one pass so
they could experience it. I built four self-contained items end-to-end and
scaffolded a fifth (LLM extraction) as a dormant upgrade path — pets deliberately
deferred to its own session per their earlier directive.

**Built:**

1. **Garment taxonomy — the app now knows about more than tops.**
   [`src/lib/garments.ts`](app-web/src/lib/garments.ts) is the single source of
   truth: 18 garment types across four sections (Tops / Bottoms / Footwear /
   Accessories), each with a display label, emoji glyph, and size domain
   (derived from `sizeSystems.ts`). Closet add + edit forms now use a new
   sectioned `<CategoryPicker>` with `<optgroup>`s; the flat 7-type list is
   gone. `sizeSystems.ts` already knew the domains → shoes are numeric, socks
   are S–XL, pants are waist / W×L, accessories can be "One size." Default
   collections extended (Bottoms / Footwear / Accessories folders auto-file).
   Closet + refresh cards render `garmentLabel(category)` and `garmentGlyph`.

2. **Cross-domain disclaimer — "3 pairs of shoes → shirt rec" no longer lies.**
   The engine now derives the product's domain and the closet's domains. If
   they don't intersect (`domainRelevance === "cross"`), we (a) do NOT feed the
   irrelevant known-good items into the anchor signal, (b) hard-cap confidence
   at 0.35, (c) emit a plain-language `domainNote` the check page renders as an
   amber banner: "Your closet is footwear, but this is a top item. Sizing
   across garment types is unreliable…" Verified end-to-end via HTTP.

3. **Body-type derivation + illustrative figure + respectful out-of-scope path.**
   [`src/lib/bodyType.ts`](app-web/src/lib/bodyType.ts) derives two axes from
   the passport measurements — a volume band from BMI (petite / lean / average
   / solid / broad / extended) and a torso shape from chest-vs-waist (tapered /
   straight / full-waist). Degrades gracefully when data is missing. The two
   extreme bands trigger a **respectful scope note** — the wording talks about
   what standard S–XXL charts cover, never editorializes the person's body
   ("Your measurements sit above the range most standard S–XXL charts cover…").
   A `<BodyFigure>` SVG shows an abstract, faceless silhouette that widens /
   narrows by band and shape. Rendered as a new section on `/passport`.

4. **Per-user brand-bias learning — with pollution guards.**
   [`src/lib/brandBias.ts`](app-web/src/lib/brandBias.ts) reads THIS user's
   outcomes. Guards baked in (all founder-stated concerns): per-user only (no
   cross-user contamination), min-evidence threshold (≥2 same-direction
   outcomes), cancellation on contradictory reports, hard ±1-step cap. When a
   brand accumulates "too big" or "too small" signals, we shift the
   recommendation one alpha step, adding a new `brand-bias` signal to the
   engine with an explainable reason ("You've reported 2 Uniqlo items running
   too big — sized down one"). To make this actually MOVE the recommendation
   (an anchor rating goes stale), a non-neutral brand-bias downgrades the
   engine from `ANCHOR_W` to `DEFAULT_W`. Verified live: same closet + same
   product, 2 "too big" returns switched the pick from **M → S** with the
   right reason attached.

5. **LLM extractor scaffold — dormant until a key is set.**
   [`src/lib/extractorLLM.ts`](app-web/src/lib/extractorLLM.ts) — `extractSmart(url)`
   drop-in async replacement for `extractFromUrl`. If `ANTHROPIC_API_KEY` is
   unset, or the LLM call fails, or Zod validation fails → falls back to the
   deterministic extractor and the app behaves exactly as before. When enabled:
   Claude Haiku 4.5, `temperature=0`, strict JSON, timeouts + body-size caps,
   polite UA. **Never sends user body measurements** — only page text. Wired
   into `/api/check`. `.env.example` documents the switch.

**Test coverage:** 37/37 green. New test files: `sizeSystems.test.ts` (already
existed, 6), `bodyType.test.ts` (6), `brandBias.test.ts` (7), plus 3 new
cross-domain cases in `fitEngine.test.ts` (now 18).

**Verify:** `tsc` clean · 37/37 tests · `next build` clean (32 routes) · live
smoke passed for cross-domain, brand-bias direction shift, and body-type
rendering.

**Not done this session (intentional):**
- Pets — founder said separate session; PetProfile is in schema, ready.
- Aesthetic pass — deferred pending focused design session; piecemeal edits
  now would risk the "fancy but messy" outcome the founder warned about.
- Real LLM run — needs an ANTHROPIC_API_KEY.

**Governance selling point (for the reflection essay):** brand-bias is the
first example of the app learning from outcomes without becoming a black box.
Every shift attaches a plain-language reason; the guards (per-user, ≥2
evidence, cancellation, ±1 cap) are all in one auditable file — exactly the
"we can evaluate why the engine did what it did" story the proposal committed
to. The cross-domain disclaimer is the second: instead of returning a plausible
wrong answer, we say "we don't have the right evidence."

---

## 2026-08-11 · Session 11 — Size regularization + Refresh picker & smoother cards

**Context:** founder gave a broad roadmap (brand-bias learning, multi-dimensional
body types with an image + out-of-scope path, more garment domains incl. a
separate pets session, cross-domain rec disclaimers, LLM-as-judge exploration,
deployment). We discussed all of it (recorded in memory `project-fit-passport-roadmap`)
and picked the two concrete "fix now" items to implement this session.

**Built:**

1. **Sizes are now regularized per garment type.** Bug: the closet size field was
   a raw `<input>`, so `<` (or any junk) saved and displayed. New
   `src/lib/sizeSystems.ts` = single source of truth: garment category → size
   *domain* (top / bottom / shoe / sock / accessory) → valid shapes (regex),
   preset chips, and a human hint. New `SizeInput` component (one-tap preset
   chips + validated free text with inline error) replaces the raw input in both
   the closet add form and the edit row. Server-side, `/api/closet` POST & PATCH
   gained a Zod `.refine()` that rejects sizes not matching the category's
   domain. Verified live: `tshirt` `<` → HTTP 400; `tshirt` `M` → 200; `shoes`
   `M` → 400 (shoes aren't alpha-sized). 6 new tests, 21 total green.
   - **Design choice:** `sizeSystems.ts` is deliberately forward-compatible —
     pants/jeans/shorts/skirt/shoes/sneakers/boots/socks/hat/belt/scarf already
     have domains + patterns, so adding those garment types later (roadmap item
     #3) is just extending the closet CATEGORIES list + per-type input widgets,
     not reworking validation.

2. **Fit Refresh got a "pick what to refresh" step + smoother cards.** The
   `/refresh` page now has two phases: **pick** (choose one/several
   collections or Everything, pre-seeded from the `?collections=` link but always
   adjustable) → **cards**. Card motion is now velocity-aware: a quick flick
   commits even if the drag is short; release animates on a spring curve
   (`cubic-bezier(.22,1,.36,1)`); the next card rises + scales up to meet you as
   you drag; swipe-hint chips fade/scale with drag progress.

**Verify:** `tsc` clean · 21/21 tests · `next build` clean · live size-API smoke
passed. Committed 6e1f450, pushed to origin/main.

**Founder Q&A this session (for the reflection essay):** walked through the
current scoring logic (transparent 5-signal engine, adaptive anchor weights),
whether to move to "LLM as judge" (advised: no for the size decision — keep the
explainable engine as the course differentiator + governance answer; yes for
extraction, explanation polish, and an optional confidence-only judge layer),
LLM cost (~$14 Haiku / ~$54 Sonnet per ~2000 checks, plus caching), and
deployment (SQLite is the blocker → Postgres on Vercel with pooled connections,
or Railway/Render with a persistent disk; ~$0–20/mo + a few $ LLM for beta).

**Next up:** LLM extraction (real size charts + product images, deterministic
fallback) is the highest-leverage next step; aesthetic polish pass; then the
larger roadmap items (brand-bias learning with pollution guards, body-type
dimensions, new garment domains).

---

## 2026-08-11 · Session 10 — Fit Refresh (card-stack comfort re-rating)

**Goal:** a delightful way to update how clothes feel as the body changes — a
Tinder-style card stack, one garment per card, a comfort slider that starts at
the current rating; swipe right / Save to record, swipe left / Skip = no change.
Triggerable per-collection, all, or prompted after a passport measurement edit.

### Schema
- New `ComfortCheck` (itemId, userId, rating 1-5, note?, reason, createdAt).
  `KnownGoodItem.fitRating` always mirrors the LATEST check; ComfortCheck keeps
  the full time-series for future trend analysis. `reason` ∈ refresh |
  measurement-change | add.

### API — `/api/closet/refresh`
- GET `?collections=<id,id|all>` → ordered items with `currentRating` (slider
  start) + collection name.
- POST `{itemId, rating, note?, reason?}` → txn: update item.fitRating +
  append ComfortCheck. POST `{itemId, skip:true}` → no write.

### UI — `/refresh`
- Card stack with a peek of the next card. Pointer-drag with rotation; release
  past ±110px commits save/skip; snap-back otherwise. Exit animation flings the
  card off-screen. Comfort `<input type=range>` 1–5 with labels
  (Doesn't fit…Perfect), starts at current, shows "Changed from X → Y".
  Button fallback (Skip / Save) + keyboard (←/→, number keys 1-5). Progress bar
  + completion summary (updated N · skipped M). Placeholder `GarmentThumb`
  (color swatch + emoji glyph) with a clear seam for a future real product image.

### Triggers
- Closet header: "↻ Refresh fit" button (all). Per-collection "↻ Refresh" link
  in each collection header (skips the virtual Uncategorized bucket).
- Passport: editing any body measurement (with ≥1 closet item) surfaces a
  dismissible "Your measurements changed → Refresh" banner.

### Verified
- `tsc` clean · `vitest` 15/15 · `next build` clean (32 routes) · live: demo
  seed → GET 5 items → record 5→3 (writes ComfortCheck, reason recorded) → skip
  writes nothing → item.fitRating=3 with 1 history row.

---

## 2026-08-11 · Session 09 — FIX passport persistence, fancy passport UI, garment gender, claim nudge

**Goal:** user report — "passport didn't save; no prompt to claim; even after
claiming, data wasn't retained; want fancy real-passport-looking editable UI;
add optional garment gender line (M/W/Unisex)."

### [BUG-01] Passport data disappearing — ROOT CAUSE + FIX
- **Diagnosis:** confirmed via reproducer — on first visit, the browser fires
  several concurrent no-cookie requests (`/api/auth/me`, `/api/status`,
  page HTML). Each API request hit `getCurrentUser()`, which created a NEW
  anonymous user and set its own Set-Cookie header. Browser kept only the
  last cookie → the profile/closet the user had just POSTed lived on a
  now-unreferenced userId. The DB test showed **3 User rows created in a
  single first visit.**
- **Fix:** added **`src/middleware.ts`** (Edge runtime) that mints the session
  cookie on any page navigation BEFORE any /api call fires. Middleware runs
  once per request, atomically, so all client-side /api calls carry the same
  cookie. `getCurrentUser()` reworked to **upsert by cookie's userId**
  (idempotent — concurrent same-cookie requests converge, they don't race);
  caught P2002 unique-constraint edge case with a re-read fallback.
- Added a parallel Edge-safe signing lib **`src/lib/authEdge.ts`** using Web
  Crypto (`crypto.subtle.sign`) so middleware can verify + issue the same
  HMAC-signed cookies as Node's `auth.ts` (byte-compatible).
- Verified live: 3-way concurrent first-visit → **1 User row**, profile
  survives, closet survives, and claiming preserves everything.

### Fancy passport UI at /passport
- New `src/app/passport/page.tsx`, replacing plain `/onboarding` as the primary
  entry (old route still works for bookmarks; Nav + all internal links now
  point to `/passport`). Design:
  - Gradient cover strip with subtle diagonal shine ("FIT PASSPORT · Sizing
    Identity")
  - Passport-photo-styled avatar (initials in a framed portrait box)
  - Mono-font "identity block" (Holder / Passport no. / Region / Preferred fit)
  - Sections: Sizing reference (sex chips + shopsFor multi-chips), Preferred
    fit (4 chips), Measurements (8 optional cm/kg fields), Region, Notes
  - Inline autosave on every change (blur/Enter for numeric+text; instant for
    chips) with a "Saved ✓ / Saving…" status line
  - Decorative MRZ-style footer that reflects the actual values you entered
- Style stayed restrained per the "simple + high-end, not gimmicky" directive.

### Garment gender line
- `KnownGoodItem.gender` = `"mens" | "womens" | "unisex" | null` (optional).
  Directly supports the cross-department shopping story (a woman buying
  men's tees is a real use case).
- Closet add/edit form: new "Line" chip select (—/Men's/Women's/Unisex).
- Item cards + public `/u/[code]` show a small **M/W/U** color badge.
- Demo seeder + view API + engine input all pass gender through.

### Guided flow — ClaimNudge floating card
- `src/components/ClaimNudge.tsx` mounted in root layout. Appears ONLY when:
  the user is unclaimed AND has actually entered data (`hasBody` or
  `closetCount ≥ 1`). Hidden on `/account`, `/login`, `/recover`. Dismissible
  per tab. Copy: "Save your passport — set a username + password so this
  doesn't disappear when you close the browser."

### Verified
- `tsc` clean · `vitest` 15/15 · `next build` clean (30 routes) · live
  concurrent-first-visit → single user, saved data survives claim.

---

## 2026-08-11 · Session 08 — biological sex, username login, email-only recovery

**Goal:** three founder requests: (1) add biological sex to the profile — as a
sizing reference AND to support cross-department shopping (men buying women's,
women buying men's); (2) let people log in by username, not just account code;
(3) recovery code was too clunky in practice — drop it and use email.

### Sex + cross-department shopping
- `FitProfile` gains `sex` (`male`/`female`/`unspecified`, all optional) and
  `shopsFor` (comma-separated of `mens`/`womens`/`unisex`). Onboarding has a
  new "Sizing reference" card with two rows of chip buttons + copy explaining
  a user can shop any department regardless of biological sex.
- Public view `/api/view/[code]` now returns `sex` + `shopsFor` (still no
  precise measurements — verified live: chest 92 does not leak). The public
  page surfaces a "⚡ Cross-department shopper — useful reference…" note when
  the shopper's departments differ from their biological sex.

### Username login
- `/api/auth/login` accepts `{ identifier }` (username OR account code), with
  a heuristic (looks like `FP-…`? → accountCode; else → username). Legacy
  `{ accountCode }` still works for backward compat. Uniform error message.
- `/login` UI has a single "Username or account code" field with an example
  showing both formats.

### Recovery = email only (recovery code removed)
- `/api/auth/claim` no longer generates/returns a recovery code and no longer
  writes `recoveryHash` (column kept in schema for now; explicitly nulled on
  claim to purge any residue).
- The scary red "save this code" warning + confirm checkbox is GONE. Account-
  ready screen now shows just the account code + (only if no email) a soft
  amber warning that they can't recover without an email.
- `/api/auth/recover` reworked: `{ identifier, email, newPassword }` — verifies
  the account with that identifier has EXACTLY that email on file, then resets
  and logs in. No emails are actually sent yet (course-MVP; noted in code that
  real send-token flow is required for prod). Uniform error message.
- `/recover` UI matches.
- `/api/auth/me` now exposes the user's own email so the Account status page
  can show it (with an explicit "none — can't reset password" if missing).

### Verified live
- profile stores `sex=female shopsFor=womens,mens` · claim response has no
  `recoveryCode` field · username login works, code login still works · email
  recovery works and rejects wrong email · public view exposes coarse sex but
  not chest.
- `tsc` clean · `vitest` 15/15 · `next build` clean (29 routes).

---

## 2026-08-10 · Session 07 — recovery/email, color wheel, reorder, merge UI, demo data

**Goal:** User feedback after the GitHub push: (1) recovery email + strong
"save your recovery code" warning; (2) color picker with a color wheel + two
rows of trendy colors; (3) finish the deferred Phase-2 items (reorder, merge-UI);
(4) one-click demo data.

### Recovery + email
- `email` (already on `User`) now collected at claim (optional, unique, lower-cased).
- `POST /api/auth/recover`: reset password via the one-time recovery code;
  rotates BOTH password and recovery code (old code invalidated), logs in,
  returns a fresh recovery code. Verified: old code rejected after use.
- Claim result screen rewritten as a **red, high-severity warning** with a
  copy button and a **"I've saved my recovery code" checkbox that gates the
  Continue button**. Claim form gained a "Recovery email (strongly
  recommended)" field. `/recover` page + link from `/login`.
- Email-based reset (send link to stored email) needs mail infra — deferred
  with an honest "coming soon" note; the recovery-code path works fully today.

### Color picker
- Expanded to **20 on-trend apparel colors in a 2-row swatch grid** + free-text
  + a **native color-wheel** (`<input type=color>`) styled as a swatch button.
  Preset map synced to the public `/u/[code]` view's `ColorDot`.

### Reorder + merge (finished the Phase-2 deferrals)
- `POST /api/closet/reorder` (assign sortIndex by array order, txn, user-scoped).
  Up/down arrows on standalone item cards; disabled at ends; reorders within a
  collection's standalone items.
- `POST /api/closet/group` (merge selected ids under a shared groupId / ungroup).
  Closet gained a **"Merge duplicates" select mode**: toggle → checkboxes on
  cards → Merge. Verified merging two Uniqlo items into one variant group.

### Demo data
- `POST /api/demo` resets the current user's closet/collections and seeds a
  chest-95 regular profile + 5 realistic items across collections. Surfaced as
  a subtle "Load demo data" link in the home new-user guide → redirects to /closet.

### Verified
- `tsc` clean · `vitest` 15/15 · `next build` clean (29 routes) · live smoke of
  demo load, email claim, recovery (+ old-code invalidation + relogin), merge.

---

## 2026-08-10 · Session 06 — closet organization (Phase 2)

**Goal:** The user's closet-organization request: default categories that are
user-renamable/movable, color tags, ordering, and merging same-garment
different-size/color into one card. Pure data + UI; the fit engine is untouched.

### Naming decision (important)
`KnownGoodItem.category` (tshirt/shirt/jacket) is the GARMENT TYPE the engine
matches on — NOT user-editable. The user-facing renamable folders are a new
`Collection` model, shown in the UI as "collections". Adding an item auto-files
it into the default collection for its garment type (Uniqlo tshirt → "T-Shirts").

### Schema
- New `Collection` (userId, name, sortIndex). `KnownGoodItem` gains
  `collectionId` (onDelete: SetNull), `color`, `sortIndex`, `groupId`,
  `groupName`. Grouping is DISPLAY-ONLY — the engine still reads every item
  individually, so variant-merging can't corrupt recommendations.
- `User` gains `collections` relation.

### Backend
- `src/lib/collections.ts`: garment-type → default-collection map, 5 default
  folders (T-Shirts/Shirts/Sweaters/Jackets/Other), `ensureDefaultCollections`
  (seed on first list), `collectionForGarment` (find-or-create on add).
- `GET/POST/PATCH/DELETE /api/collections` (list w/ item counts, create, rename/
  reorder, delete → items fall back to Uncategorized).
- `/api/closet` extended: POST auto-files + assigns end-of-list sortIndex; PATCH
  now partial (edit any field, move collection, recolor, reorder, group/ungroup).
- `/api/view/[code]` now returns collections + item color/collectionId (still
  NO precise measurements).

### Frontend
- `/closet` reworked: items grouped into collection sections; each section
  rename/delete; per-item Edit / Remove / move-to-collection dropdown; a color
  picker (9 presets + free text) with color dots on cards; "add collection"
  form; variant groups (shared groupId) collapse into one card with per-variant
  Edit/Unmerge/Remove.
- `/u/[code]` public view groups the shared closet by collection with color dots.

### Verified (live)
- Auto-file: tshirt→T-Shirts, shirt→Shirts, jacket→Jackets. Colors persist
  (preset name + custom hex). Rename T-Shirts→Tees + new "Gym" both work. Public
  view groups by collection and still leaks NO precise measurements.
- `tsc` clean · `vitest` 15/15 · `next build` clean (24 routes).

### Deferred (noted, not built)
- Manual up/down reorder UI (sortIndex is stored + honored; no drag/arrows yet).
- A "merge these into variants" trigger in the UI (grouping renders and unmerge
  works; creating a group needs a select-two-items affordance).
- Collection reorder UI (API supports sortIndex).

---

## 2026-08-10 · Session 05 — code-based identity, sharing, community (Phase 1)

**Goal:** Build the founder's novel identity idea: sign up → get an account
**code**; anyone with the code can VIEW the closet (read-only); editing needs a
**password** (= login). Plus a community entry point. Design + threat model
written first in `docs/design/identity-and-sharing.md`; decisions taken with the
user: (a) code exposes closet + COARSE body type only, never precise
measurements; (b) password REQUIRED at claim; (c) build identity before the
closet-organization work.

### Concept framing
Not true PKI — it's **capability(read) + credential(write)**. Account code =
bearer read-capability; password = bcrypt-hashed write-credential. Documented
that bearer codes can't be revoked once shared (offered rotation as future
escape hatch).

### Backend
- **Schema** (`User`): `claimed`, `accountCode` (unique, high-entropy),
  `username` (unique), `passwordHash`, `recoveryHash`, `bodyType` (coarse,
  shareable), `exportPolicy` ("owner"|"anyone"). Precise cm stays in FitProfile.
- **`src/lib/auth.ts`**: `generateAccountCode()` (Crockford base32, ~65-bit,
  `FP-XXXX-XXXX-XXXXX`), `normalizeAccountCode()`, `generateRecoveryCode()`,
  bcrypt `hashSecret`/`verifySecret`, and HMAC-signed session cookies
  (`encodeSession`/`decodeSession`, constant-time verify, no external JWT dep).
- **`src/lib/session.ts`** reworked: first visit mints an ANONYMOUS unclaimed
  user + signed cookie (keeps "just start adding clothes" frictionless);
  `getCurrentUser`, `setSession`, `clearSession`, `canEdit`.
- **Auth API**: `POST /api/auth/claim` (anon→claimed, returns code + one-time
  recovery code), `POST /api/auth/login` (code+password→edit session, uniform
  error to avoid code-existence leak), `POST /api/auth/logout`, `GET /api/auth/me`.
- **`GET /api/view/[code]`** — PUBLIC read-by-code. Prisma `select` deliberately
  OMITS `fitProfile`, so precise measurements can't leave the server. Returns
  username, coarse bodyType, closet items only.

### Frontend
- `/account`: claim form (username/password/coarse body type/export policy) →
  one-time reveal of account code + recovery code; status view when claimed
  (with public-view link + logout).
- `/login`: code + password.
- `/u/[code]`: public read-only closet view ("Viewing {username}'s closet",
  read-only badge, "measurements never shared by code" note, CTA to sign up).
- `/community`: code-entry to view a closet + "how sharing works" explainer;
  notes the public directory will be opt-in (Phase 3).
- `Nav`: shows `@username` when claimed, else a "Claim account" CTA; re-checks
  on navigation.

### Verified (live)
- Full flow: anon session stores chest 95 + closet → claim → code
  `FP-…` + recovery issued → **public view leaks NO precise measurements**
  (chest/waist/height/fitProfile absent; only closet + coarse "athletic") →
  login rejects wrong password, accepts correct → unknown code 404.
- `tsc` clean · `vitest` 15/15 · `next build` clean (all auth + view routes).

### Deferred / next
- Password recovery via recovery code (endpoint not built yet — code is issued
  and hashed, ready to wire).
- Rate-limiting on `/api/view` and `/api/auth/login` (noted in threat model).
- Code rotation escape hatch.
- Phase 2: closet organization (categories, tags, colors, ordering, merge
  same-garment variants) — the user's other request, intentionally after identity.

---

## 2026-08-10 · Session 04 — anchor-vs-preference fix, closet edit, brand autocomplete

**Goal:** Three user reports from the Session-03 review.

### [F2] "Every fit preference returns L on a Hermes shirt" — FIXED
- Root cause: the [F1] anchor-dominance fix (Session 02) worked *too* well. With
  a same-brand+same-category anchor (Hermes shirt L, 5/5), `known-good` weight
  (0.62) swamped everything, and `scoreKnownGood` measured distance from the
  EXACT anchor size — so slim/regular/relaxed/oversized all collapsed to L.
- Fix: a strong anchor now sets a **baseline** that the fit preference shifts.
  New `preferenceShift()` in `sizing.ts` (slim −1, regular 0, relaxed +1,
  oversized +2). `scoreKnownGood` targets `anchorIndex + preferenceShift(pref)`
  for strong (same-brand+same-cat) anchors; weak/cross-brand anchors are left
  un-shifted (their ladder alignment is already approximate). Explanations now
  read "Sized down from your Hermes L for a slim fit", etc.
- Removed the old, near-dead `scorePreference` signal (its shift logic was mostly
  0 and it now double-counted). `preferenceBonus` weight retired from use.
- Verified live with the user's exact closet: Hermes shirt now gives
  slim→M, regular→L, relaxed→XL, oversized→XL.
- Tests: updated the [F1] block to use `regular` for the exact-match assertion,
  added a 4-case "fit preference moves a strong anchor [Hermes bug]" block
  (incl. "the four preferences don't all collapse"). **15 tests, all green.**

### Closet editing
- `PATCH /api/closet` (user-scoped `updateMany` guard). Closet page now has an
  inline **Edit** mode per item (`EditRow`) alongside Remove — fixes "if I add
  something wrong I have to delete and re-add".

### Brand autocomplete (suggest, never lock)
- `src/lib/brands.ts`: ~70 well-known apparel brands + `suggestBrands()` with
  prefix-then-substring ranking, accent- and case-insensitive (so "her" →
  "Hermès"). Explicitly NOT a whitelist.
- `src/components/BrandInput.tsx`: free-text field with a suggestion dropdown
  (keyboard nav, outside-click close) that always allows typing an unlisted
  brand ("Not listed? Just type it — any brand works."). Wired into both the
  closet add form and the edit row.

### Verified
- `tsc` clean · `vitest` 15/15 · `next build` clean (16 routes) · live smoke of
  Hermes preference sweep + PATCH edit.

---

## 2026-08-10 · Session 03 — URL-aware extraction, fit toggle, interactive breakdown

**Goal:** Act on user feedback from the Session-02 walkthrough:
1. Default fit = regular, but let the result page preview slim/relaxed/oversized.
2. "Every URL returns M, doesn't look like it's actually running." → make the
   tool visibly read the specific page pasted.
3. Show the extracted product info (name, retailer, size chart) so the user
   trusts we read *their* page.
4. The ranked-sizes list felt static/misleading — make rows expandable.

### Extractor — now URL-aware (`src/lib/extractor.ts`)
- Two layers: (1) curated fixtures for the 3 demo products; (2) **URL-derived**
  extraction for everything else. Layer 2 parses the real URL: brand from the
  domain (`BRAND_TABLE` of 13 retailers, each with its own chest base + step +
  fit-notes so charts differ), category from slug keywords, product name from
  the slug. Unknown brands still derive retailer + name + a generic chart.
- Added `source` provenance (`host`, `derived`, `slug`) to every result so the
  UI can prove it read that page.
- `slugToName()` strips CMS noise (`productpage`, `p12345`, SKU-ish tokens,
  file extensions). Verified: Zara/H&M/Nike URLs now yield clean names.
- **Root cause of "everything returns M"**: the old extractor had ONE generic
  fallback, so every non-demo URL produced the same product+chart. Fixed.
  Verified live: Zara sweater→L, Nike hoodie→S, H&M shirt→L, Patagonia→S.

### Fit preference toggle
- New **`/api/recommend`** endpoint recomputes for an already-stored product
  with an optional `preferredFit` override — no duplicate product row, no
  mutation of the saved profile.
- Extracted shared `src/lib/recommendService.ts` so `/api/check` and
  `/api/recommend` assemble identical engine input.
- Result page has a slim/regular/relaxed/oversized segmented toggle; changing it
  re-runs the engine live (with an opacity transition). Seeds from the saved
  profile (default regular).

### Interactive breakdown + provenance UI (`/check`)
- New **provenance card**: "Read from {host}" badge, product name, a detail grid
  (retailer/brand/category/material/#sizes/fit-note), and the clickable source URL.
- Ranked size rows are now **expandable** (`SizeRow`): tap to reveal the signals
  it's based on (with per-signal weight, red dot for negative/outcome signals),
  the garment measurements pulled from the page (chest/shoulder/sleeve/… chips),
  and the match-score + confidence footer. The pick is expanded by default.

### Engine polish
- Added an **edge-of-range note** to explanations: when the pick is the
  largest/smallest size offered but the target implies wanting to go further,
  it says so plainly ("This is the largest size offered — for an oversized fit
  you're at the top of the range") instead of a confusing lone "chest N cm
  smaller than target" line. Article agreement (a/an) handled.

### Verified
- `tsc` clean · `vitest` 11/11 · `next build` clean (16 routes incl. new
  `/api/recommend`) · live smoke: URL variety + fit toggle + slug cleanup +
  edge note all confirmed.

### Next up
- Real LLM/VLM extraction to replace layer 2 for unknown pages (W6 milestone);
  keep the "confirm what we extracted" step.
- One-click "load demo data" for E-of-E.
- Let the user EDIT extracted product fields before scoring (proposal's
  user-confirmation mitigation) — the provenance card is the natural home.

---

## 2026-08-10 · Session 02 — [F1] engine fix + UX overhaul

**Goal:** Fix the [F1] anchor-weighting finding surfaced during the Session-01
walkthrough, then redesign the UI around one insight: *a visitor only wants to
know "what size should I buy?"* — so get them to value fast, then guide them to
add data that improves accuracy.

### Engine — [F1] fixed
- Added **adaptive weighting** to `fitEngine.ts`. `hasStrongAnchor()` detects a
  same-brand + same-category closet item rated ≥4/5. When present, the engine
  uses `ANCHOR_W` (known-good 0.62 / chest 0.18) instead of `DEFAULT_W`
  (chest 0.45 / known-good 0.35) — the owned-size anchor dominates and chest
  becomes a tie-breaker. Refactored all `score*` fns + `combine` to take a
  `Weights` param (no module-level mutable weight).
- 3 new regression tests ("anchor dominance [F1]"): owned-size wins; a low-rated
  anchor (fit ≤3) does NOT trigger dominance; cross-brand-only stays
  measurement-led. **11 tests total, all green.**
- Verified live: COS Oxford shirt for a slim chest-95 user who owns a COS EU 48
  now recommends **EU 48** (was EU 44 in Session 01).

### UX overhaul — value-first + guided
- **Design system** `src/components/ui.tsx`: `Button`, `LinkButton`, `Card`,
  `Field`, `EmptyState`, `ConfidenceRing` (SVG), `AccuracyBadge`, `Skeleton`.
  Extended Tailwind theme (brand tints, `ink` scale, card/lift shadows,
  fade-in-up + shimmer animations).
- **`/api/status`** (new): profile completeness snapshot — steps checklist,
  accuracy tier (low/medium/high), next-step pointer, last recommendation.
- **`/api/products`** (new): lists checked products. Fixes a real UX bug — the
  old history page derived the product picker from existing outcomes, which was
  circular (couldn't record a first outcome). Now you can log an outcome for any
  product you've checked.
- **Home** rebuilt as a guided dashboard: hero paste-URL box (submits straight
  to `/check?url=`), new-user 3-step guide vs returning-user progress checklist
  with accuracy badge + last-recommendation recap.
- **/check** is now the hero: auto-runs a URL passed from home, loading
  skeletons, big answer with `ConfidenceRing`, score bars per size, red dots for
  negative (outcome) signals, and a **benefit-framed accuracy nudge** ("add 3
  clothes you own → sharper sizing") driven by `/api/status`.
- **Onboarding**: preferred-fit as tappable cards (highest-signal/lowest-effort
  first), chest marked "most useful", save → guided next step.
- **Closet**: X/3 progress, star ratings, empty state, "goal met" celebration
  card linking to /check.
- **History**: empty state when nothing checked yet, primitives throughout.
- **Nav**: sticky, active-route aware, backdrop blur.

### Verified
- `tsc --noEmit` clean · `vitest` 11/11 · `next build` clean (all routes) ·
  live smoke of status→setup→check→[F1] path.

### Next up
- Optional: a one-click "load demo data" button for E-of-E so the dashboard
  shows a populated state instantly.
- W2 discovery: start shopper interviews with `docs/course/interview-guide.md`.
- Consider migrating SQLite→Postgres + real auth before beta (W12).

---

## 2026-08-10 · Session 01 — Repo bootstrap & core MVP loop

**Goal:** After Prof. Root's approval email (Aug 9), turn the Fit Passport
proposal into a repo that (a) demos end-to-end today, (b) can grow into a real
beta by W13 per the 15-week plan, and (c) has course deliverables framed up.

### What we built
- Repo layout at `/Users/xkk/Desktop/Kong Info/Self-Project/`:
  - `docs/proposals/` — archived the four PDFs (syllabus, official form, detailed proposal).
  - `docs/course/` — course-facing deliverables live here.
  - `app-web/` — Next.js 14 (App Router, TypeScript, Tailwind v3) MVP.
- **Data model** in Prisma (`app-web/prisma/schema.prisma`): `User`, `FitProfile`,
  `KnownGoodItem`, `Product`, `SizeOption`, `FitRecommendation`, `FitOutcome`,
  `PetProfile` — mirrors §10.1 of the detailed proposal. SQLite for dev; the
  schema is portable to Postgres for beta.
- **Fit engine** (`src/lib/fitEngine.ts`): transparent, rule/score-based, no
  black-box ML in the recommendation step. Signals: chest-fit (Gaussian around
  body+ease), known-good similarity (alpha-ladder distance × brand/category
  match × trust), fit-preference bonus, outcome learning (returns penalize,
  keeps boost), completeness-driven confidence. Every recommendation carries
  per-signal reasons — the engine is auditable, not oracular.
- **Regional size normalization** (`src/lib/sizing.ts`): EU numeric → US alpha
  mapping for jackets; deterministic label parsing that also handles "US M",
  "EU 48", "M/L" ambiguity.
- **Extractor** (`src/lib/extractor.ts`): fixture-first for 3 demo retailers
  (Uniqlo, COS, Levi's). Real LLM extraction can slot into `extractFromUrl()`
  later — the consumer interface won't change. Chose fixtures deliberately per
  §16 Risk row on scraping (demo-safe on Nov 4 without depending on live
  retailer pages).
- **API routes** (`src/app/api/*/route.ts`): `/api/profile`, `/api/closet`,
  `/api/check`, `/api/outcome`. Zod-validated. Ownership-scoped by `userId`.
- **Screens** (App Router): landing (`/`), onboarding (`/onboarding`), closet
  (`/closet`), check-a-product (`/check`), fit history (`/history`).
- **Tests**: 8 vitest cases in `src/lib/fitEngine.test.ts` — cold-start,
  measurement-driven ranking, monotonicity across `slim → oversized`,
  outcome-learning penalty, explanation grounding. All green.

### Key decisions & tradeoffs
- **Next.js 14 + React 18** (not the latest Next 16). Node 18.20 on this
  machine can't run Next 16 or the latest Prisma. Pinned versions:
  `next@14.2.15`, `react@18.3.1`, `prisma@5.22.0`, `vitest@1.6.0`. Trade: no
  newest features (React 19 form actions, RSC-only mutations). Win: reliable
  install, well-understood upgrade path when Node is bumped.
- **Tailwind v3 (not v4)** — the scaffold left v4-flavored configs; I
  normalized to v3 which is stable in the Next 14 ecosystem.
- **No auth for MVP.** Single "demo user" shim in `src/lib/session.ts`. Every
  API route calls `getCurrentUser()`. Swapping to NextAuth/Clerk later is a
  one-file change. Rationale: proposal §9 explicitly de-scopes auth.
- **Fit engine is NOT an LLM.** The proposal (§10.2) says a transparent scoring
  model is preferable for the course "because it can be evaluated." Following
  that literally. LLMs may still assist in *extraction* upstream, but the size
  decision is auditable arithmetic. This also directly addresses Prof. Root's
  "customer problem clarity" concern: we can show the reasoning, not just a
  guess.
- **SQLite** now for zero-config; migrate to Postgres before beta (W12–W13).

### What worked
- End-to-end smoke: `POST /api/profile` then `POST /api/check` with a Uniqlo
  URL returns a recommendation of "M" at 75% confidence for a body chest of
  92cm with regular fit, plus a grounded explanation. This proves the schema,
  engine, extractor, and API all agree.
- The unit tests caught two test-spec mistakes (I had confused garment
  measurements with body ranges). Fixing the tests, not the engine, was the
  right call — the engine's ease-based reasoning is correct.

### What didn't (yet)
- Latest Next.js scaffold assumes Node 20+. Wasted a few minutes reconciling
  configs. Documented pinned versions above so this doesn't recur.
- No auth means no real multi-user beta yet. Intentional but visible.
- Extractor is fixture-based. Real HTML parsing / LLM extraction not
  attempted this session — deliberately punted to W6 per the 15-week plan.

### Next up
- Wire the four course docs (project plan, BMC, VPC, interview guide, risks/
  legal) into `docs/course/`. Draft in this same session so the team has one
  coherent artifact set from day one.
- (Sess 02) First 5–8 shopper interviews via the guide — W2 milestone.
- (Sess 02) Add a "region + size chart" seed for a fourth retailer so we can
  demo cross-region recommendations at the mid-review.
- (Sess 03+) LLM extraction spike as a fallback when a URL doesn't match any
  fixture, gated behind a user-visible "we extracted this — confirm" step.

### Files touched
```
docs/proposals/*.pdf                          (moved from repo root)
docs/course/*                                 (created)
app-web/package.json                          (pinned Next 14 / React 18 / Prisma 5.22 / Vitest 1.6)
app-web/prisma/schema.prisma
app-web/src/app/layout.tsx, page.tsx
app-web/src/app/onboarding/page.tsx
app-web/src/app/closet/page.tsx
app-web/src/app/check/page.tsx
app-web/src/app/history/page.tsx
app-web/src/app/api/profile/route.ts
app-web/src/app/api/closet/route.ts
app-web/src/app/api/check/route.ts
app-web/src/app/api/outcome/route.ts
app-web/src/lib/db.ts, session.ts, sizing.ts, extractor.ts, fitEngine.ts
app-web/src/lib/fitEngine.test.ts             (8 tests, all green)
app-web/src/components/Nav.tsx
app-web/tailwind.config.ts, postcss.config.mjs, next.config.mjs, .eslintrc.json
DEVLOG.md, README.md, .gitignore              (created)
```
