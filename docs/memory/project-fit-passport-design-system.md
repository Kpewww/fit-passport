---
name: project-fit-passport-design-system
description: "Fit Passport visual design system — black-led + cobalt accent + porcelain, Fraunces serif (as of Session 25)"
metadata: 
  node_type: memory
  type: project
  originSessionId: ff70f30d-84e1-4230-9852-546155e0d6ff
  modified: 2026-08-12T21:51:19.618Z
---

Visual/aesthetic system for the [[project-fit-passport]] web app. The founder chose an **editorial / fashion-magazine** direction (Session 24, 2026-08-12) for an audience of fashion-minded shoppers, bloggers, and taste-sharers: **fashionable, high-end, minimal, tasteful — no text-heavy landing.** See also [[project-fit-passport-build-state]].

**Direction context:** an early question was whether the hosting choice affects how a site looks. It does not: AWS = hosting layer, Node.js = server runtime, React/Next = framework, and **CSS/typography/motion (GSAP/WebGL) is what makes a site look good** — hosting/runtime are irrelevant to visuals. Our stack IS a Node.js site (Next.js). Design candidates were pulled from awwwards.com/websites/design-agencies (real list fetched via WebFetch, but those sites are WebGL-heavy so their visuals weren't verifiable from text).

**Tokens (current — Session 25 re-grounded the palette to BLACK-LED + COBALT; `tailwind.config.ts`):**
- **Black is the primary/statement color** (evidence-backed premium cue). `ink` = cool near-black: DEFAULT `#17181c`, `soft #4c4e57`, `faint #8a8d97`.
- `paper` = cool **porcelain** working surface: DEFAULT `#F3F3F1`, `soft #FBFBFA`, `dim #E6E7E9`. Body is `bg-paper`. **Dual-surface rule: black = statement (hero/brand), porcelain = where you read/use the tool.**
- `brand` token = **cobalt `#2438d6`** (dark `#1a2aa8`, light `#e9ebfb`, tint `#f2f3fc`) — the single RARE accent. Named `brand` on purpose so every `text-brand`/`bg-brand` app-wide is cobalt via one edit. **The old institutional red is fully retired** (was `#A6192E`).
- `line` = `#E2E3E7` hairline. `letterSpacing.editorial` = 0.24em; `rise` reveal animation (`animate-rise`, ~0.7s ease-out).
- Session 24 originally used warm ivory + red-accent; Session 25 replaced it with cool porcelain + cobalt after research + founder pick. If you see warm-ivory values anywhere, they're stale.

**Fonts (`layout.tsx` via next/font/google):** display serif **Fraunces** (`--font-serif`, `font-serif`) paired with **Inter** (`--font-sans`, body default). `globals.css` has `--background`/`--foreground` paper/ink roots, `optimizeLegibility`, `.font-serif` tracking, and an `.eyebrow` helper (uppercase 0.24em small-caps label).

**Component conventions (`components/ui.tsx`):** Button primary = **ink/black bg + paper text** (couture), secondary = `border-line bg-paper-soft`, ghost = `hover:bg-ink/5`. `inputClass` = `border-line bg-paper-soft`, focus → white + `ring-ink/10`. `Card` = white + `ring-line`. **Nav** = serif italic wordmark, underline-on-active links, ink pill for Claim account, `bg-paper/80` bar.

**Research grounding (Session 25):** black = strongest evidence-backed premium cue (expensive/high-quality/authority/sophistication); blue/violet reinforce sophistication; saturation drives excitement (accent used sparingly); ~62–90% of a snap product judgment is color; no universal color (context-dependent). Fashion palette theory: true neutrals → staples (navy/beige/olive) → accents (red/cobalt/butter). Founder's refs = K95 (cobalt WebGL) + NOTHIN' (giant black grotesk); wants their FIRST-IMPRESSION impact but NOT their heavy animation/load-wait. **Impact = scale + black/porcelain contrast + one cobalt accent, delivered fast (one `rise` entrance, no loader, no WebGL for now).**

**Motion stack (ADOPTED Session 26):** **framer-motion@11** + **lenis@1** are installed and used on the homepage. Lenis smooth-scroll is **homepage-scoped** (init/destroy in a `useEffect` in `page.tsx`; other pages stay native) and **disabled under `prefers-reduced-motion`**. Minimal Lenis CSS added to `globals.css`. Still available if wanted later: GSAP (free), Three.js/R3F/OGL/Spline (WebGL/3D — NOT adopted, would add load cost), SplitType, Fontshare fonts, Codrops demos.

**Fashion-scrolling homepage (Session 26, `src/app/page.tsx` full rebuild):** a scrolling narrative — (1) black parallax **Hero** (serif statement drifts+fades via `useScroll`/`useTransform`; keeps the value-first URL form), (2) **StickyHowItWorks** (a `sticky` pinned text column while 3 editorial step panels glide + `whileInView` reveal), (3) **HorizontalShowcase** (tall pinned section; vertical scroll → sideways `x` translate over a measured `distance = track.scrollWidth - innerWidth`; 5 lookbook cards using color fields + `OutfitMannequin` SVG + type; reduced-motion → plain swipeable row), (4) **ParallaxStatement** (giant faint "FIT" bg word moves slower than fg), (5) **ClosingCTA**, plus preserved **NewUserGuide / ReturningUserDashboard**. NO loader, NO WebGL, editorial/own-SVG visuals only (legal). Home first-load ~152kB.

**Applied so far:** tokens + fonts + **black-led landing hero** (`/` = full-width `bg-ink` band, huge serif headline text-6xl→8xl, cobalt italic accent word, glassy URL field + cobalt CTA, staggered `rise`; guided content on porcelain below) + shared UI + Nav; passport & refresh full-page canvases → `bg-paper`.

**Homepage horizontal section (Session 27):** the "Why it works" lookbook is now **user-driven** — drag-to-scroll (pointer capture) + swipe + trackpad + prev/next arrows, proximity snap, `.no-scrollbar`, `data-lenis-prevent`, drag-vs-click guard. NO scroll-jacking (the old pinned `useScroll`→x was removed for feeling heavy/sticky). Lenis tuned to `lerp:0.1`.

**Passport credential card (Session 27→28 — the dark-glass version was REVERTED for breaking cohesion):** VIEW mode (`ViewBook` in `passport/page.tsx`) is now a **cohesive LIGHT card** matching every other page: white card on `bg-paper`, high-contrast `Line` rows (readable ink text). It keeps a designed **metallic banner** = `bg-gradient-to-br from-brand-dark via-brand to-ink` + a static diagonal sheen + a slow moving streak (`animate-[shimmer_6s_ease-in-out_infinite]`) for brushed-metal shine. Status pill = "Issued"; footer has a **rotating dashed seal** (`animate-[spin_20s]`, shows the user's top `BadgeSeal`, else an "Issued 2026" chip), the MRZ verification string (mono), and a **`LogoPlaceholder`** (blank framed slot reserved for a future logo — logo NOT yet designed). The Session-27 dark `.glass-panel` + `CredLine` + `QRMotif` were removed (glass on dark clashed with the light site, text was unreadable, "Passed" didn't fit). `.glass-panel` still exists in globals but is now unused. Refs (Certo/OpenCred/GitHub badges) informed the credential structure only.

**`/check` unified (Session 28):** hero matches the homepage — eyebrow + serif headline + the same pill URL field + ink CTA + hairline demo pills (was a bold non-serif h1 + boxy red-focus input).

**Metal charge-card passport (Session 29 — supersedes the Session-28 light card):** `ViewBook` renders ONE slab via `MetalCard` (in `passport/page.tsx`): deep metal gradient + brushed micro-grain + broad diagonal sheen + slow travelling glint + inset hairline bevel. `CARD_THEMES` maps each metal to a card edition; the card uses `highestMetal(earnedBadges)` (default `lapis` cobalt). Top metals get agate striations. Card contents are deliberately minimal (wordmark+Issued, portrait+holder, 3-up `CardField` row, verification + `Logo`); **body-type figure removed from the card** (plain text below) and all other panels moved BELOW the slab. Founder's reference = Amex metal black card; wants "flex-worthy", clean, metallic. **He said he'll specify finer card details later.**

**Card system (Session 30 — the card now lives in `components/MetalCard.tsx`):** exports `CARD_THEMES` (one theme per metal + `lapis` default), `MetalSurface` (grain + agate veins + static sheen + `animate-glint` + bevel), `MetalCard` (adds a LIMITED 3D pointer tilt, ±7°/±9°, plus a tracked soft highlight), `CardField`, `resolveTheme(chosen, highest)`. **Glint** = custom `glint` keyframe in tailwind config: crosses fast then waits (11s cycle, ~14% duty, low opacity) — founder wanted it subtler/faster/less frequent. **`User.cardMetal`** lets the holder choose their finish but ONLY from metals they own (validated in `/api/profile/prefs` via `earnedMetals()`; `/api/status` returns `cardMetal` + `earnedMetals`; `CardMetalPicker` in passport greys locked metals). **Export** = `lib/cardExport.ts` re-draws the card as a standalone 1600×1000 SVG then rasterises via canvas to a PNG download (no html2canvas; only code-public fields — never measurements). **Community** directory rows are member cards with a metal BANNER in that member's finish (API returns `cardMetal`, falling back to highest metal), avatar overlapping the banner edge.

**Badge silhouettes + true 3D (Session 30):** `BadgeDef.shape` gives each track its own frame — **shield** = The Wardrobe, **circle seal** = The Fit Record, **hexagon** = The Atelier, **rosette** = Rare Honors (`shapePath()` in BadgeMedallion; fluting only on round seals; the engraved ring follows the silhouette). **`components/BadgeWebGL.tsx`** = a REAL three.js coin (cylinder rim + textured faces, `MeshPhysicalMaterial` metal, procedural PMREM studio env so rotation gives real specular travel, drag + idle drift, graceful fallback). `BadgeInspect` has a **Flat / True 3D** switch and loads three.js via `React.lazy` only on demand (so `/badges` first load stays ~106kB); the face texture is the medallion SVG serialized from a hidden node with `XMLSerializer`. Deps added: `three@0.169` + `@types/three`.

**Aesthetics (Session 30):** homepage `ConvergingStack` = an oversized 26vw word behind three cards that start spread and **slide together into one stack on scroll** (founder's "elements overlap when you move"); closing CTA type at 8.5rem. `/check` has `LiveConverter` (faers pattern: pick tops/bottoms/shoes → live regional equivalents from `lib/sizeConvert`, auto-detected source scale highlighted, dashes until parseable, inline "indicative only" note). ALL page h1s are now `font-serif text-4xl` (13 pages converted).

**Badge ladder (Session 29 — much harder):** `Metal` = bronze/silver/gold/**platinum**/diamond/obsidian + specials **amethyst/jade/amber**. Exported `METAL_RANK`, `VEINED_METALS` (diamond+ get agate white veining in the medallion art), `highestMetal(ids)`. Each track now has a 4th **platinum** tier (`grand-wardrobe`, `fit-scholar`, `atelier-master`) plus a jade **`polymath`** special (gold in all 3 tracks). Thresholds raised across the board (starter 8, curator 20/4, archivist 45/10, stylist 6, couturier 15/150; acclaimed 250 diamond, tastemaker 1500 amethyst, head-designer 4000 obsidian). `/help` no longer duplicates earn rules — it renders each badge's `blurb` (single source of truth). 63 tests.

**Badge inspect (Session 29):** `components/BadgeInspect.tsx` = a **CS2 weapon-inspect-style** stage (founder's explicit reference). Dark set, drag to turn in 3D, **real thickness** from `SLICES` stacked rim divs, engraved back face with the metal name, restrained raking light that follows rotation, slow idle drift, Esc/backdrop close, info panel. Opened by clicking any medallion on `/badges`. **CSS 3D on purpose, not WebGL** (art is crisp SVG → depth with no shaders/load). Founder is still interested in a true WebGL/Three.js badge — not built.

**Logo (Session 29):** `components/Logo.tsx` — passport arch + F/P monogram + measurement baseline, SVG using `currentColor` (works in ink, on metal, in any badge color). Used in `Nav` and the metal card's logo slot. First pass; open to iteration.

**Interactive 3D badges (Session 28):** `Badge3D` in `components/Badges.tsx` — a pure-CSS-3D wrapper (no libs) giving cursor-tracked `rotateX/Y` tilt + moving gloss so a medallion turns like a struck coin; reverts on leave. Applied on the `/badges` trophy case (wraps `BadgeSeal`). Adopted the badge-tool ideas as **SVG medallion + CSS ring/gloss**, not raster AI art (crisp, fast, on-palette). Small seals elsewhere (passport/home/community) stay static to avoid conflicting with tooltips.

**Rollout still TODO (per-page):** closet, check, passport card, outfits, community, badges — carry black/porcelain/cobalt + serif headings + magazine spacing; small `bg-neutral-50/100` insets remain as subtle accents (fine). Optional next: Framer Motion + Lenis for tasteful fast motion; real product-photography treatment. **Keep cobalt rare; lean on black + porcelain + serif + whitespace.**

**REVERSAL (Session 42, 2026-08-25) — badges are FLAT by default; the CARD stays lavish.** The "every badge is a dimensional struck medal, no flat variant" rule had a measured cost (~140 composited layers + 40 filter passes on `/badges` alone) that made the tab heavy on the founder's Windows machine — see [[project-fit-passport-performance]] for the arithmetic. `BadgeCoin` now takes `dimensional`, **default false**; the dimensional treatment survives in `BadgeInspect` only. Founder's exact framing: **"暂时都做成 flat,除了卡片,卡片还是要炫酷,不变的"** — `MetalCard` is deliberately untouched. This is temporary pending a dedicated badge redesign; restoring it is one default flip.

---

**MOBILE (added Session 48, 2026-08-25).** The app was audited at real phone
viewports (390 and 360) with `app-web/scripts/mobile-audit.mjs`, which measures
element rectangles rather than document scroll width.

**Why the script measures rectangles:** `body` carries `overflow-x-clip` — on
purpose, so the oversized display type can't scroll the page sideways. The side
effect is that **an overflow bug is CLIPPED, not scrollable**, so "does the page
scroll horizontally?" reports clean while content sits off-screen and untappable.
A card 402px wide in a 390px viewport had a Report button nobody could reach.

**Rules that came out of it:**

- **`min-w-0` belongs on BOTH levels.** A flex item AND a grid item both default
  to `min-width: auto` and refuse to shrink below their content, so `truncate`
  alone does nothing. Fixing the insides is not enough — the card itself was a
  grid item sizing to min-content and overflowing its own track.
- **Mobile navigation exists and must keep existing.** Every nav link is
  `hidden … sm:block`; below `sm` the menu button + panel in `Nav.tsx` IS the
  navigation. Before Session 48 nothing took their place and the app was
  unreachable past the homepage on a phone.
- **Gutters:** `px-4` on phones, `px-6` from `sm`. 24px each side is 13% of a
  360px screen.
- **Text beside a button stacks below `sm`** (`flex-col … sm:flex-row`), or the
  copy becomes a three-word column.
- **Tap targets grow by PADDING, not font size** — `min-h-[44px]` with
  `sm:min-h-0`, so labels keep their size and desktop density is untouched. Grow
  vertically only in tight rows: horizontal padding once made an overflow worse.
- **The metal card's 8–9px micro-lettering is DELIBERATE and stays.** It reads as
  embossing, it renders well on a phone, and the card is the one object that stays
  as designed. Do not sweep font sizes across it.

Verified: 26 page × viewport combinations plus 12 logged-in ones, zero overflow.
