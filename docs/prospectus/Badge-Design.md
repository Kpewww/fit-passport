# The Badge System — Design Document

*Fit Passport · prestige layer · design rationale and specification*

> A badge is not a sticker. It is a claim about a person, made in metal, that the
> person cannot buy — only earn. This document explains why the system exists, the
> principles that govern how every medal looks, the full ladder as built today,
> and — with no regard for production cost — how the medals *should* be made if the
> only constraints were the founder's: **restrained, refined, never gaudy.**

---

## 1. Why badges exist at all

The sizing engine is the reason a person *arrives*. It is not, by itself, a reason
to *return* — once you know your size in a brand, that job is done. Products that
last in apparel last on **ecosystem**, and an ecosystem needs a reason to
contribute: to log honest fit ratings, to answer a stranger's question, to post a
look. The badge system is that reason.

Its single design constraint governs everything below:

> **Status must be earned, never bought, and never faked.**

Every badge is derived from *real* data — items you actually logged, answers other
people actually found useful, likes your looks actually drew. There is no store,
no shortcut, no cosmetic tier. That is what makes a badge worth showing, and it is
why the passport card takes its finish from your highest earned metal: the card is
a *summary of a claim you can defend.*

---

## 2. The five design principles

**I. Rank must be legible in one glance.** A ladder that needs a legend has
failed. Metals get *further apart* as they climb — not a smooth gradient but a set
of unmistakable materials (see §4). This is why platinum was retired: its pale cool
grey sat too close to silver two rungs below, and a viewer couldn't tell rank from
across a table. Titanium replaced it precisely because it is *unmistakable.*

**II. Depth is real, not painted.** A medal that is a flat disc with a gradient
"skin" reads as a coin sticker. Ours have genuine relief — a struck field, a
raised rim, a beveled edge, a contact shadow, and physical thickness you can see
when you turn them. The medallion is dimensional at rest and rotates under the
cursor; clicking lifts it onto an inspect stage that extrudes its *actual
silhouette* in WebGL. **UPDATE 2026-08-25:** list views now render a FLAT medallion by default — the dimensional build cost ~140 composited layers on the trophy case and was too heavy on lower-powered machines — so the dimensional treatment lives in the inspect stage. The original intent, and the reasoning below, are unchanged and restoring it is one prop (`BadgeCoin dimensional`). Previously there was deliberately no flat variant anywhere in the
product.

**III. Ornament escalates; taste does not.** Every badge carries a `finish` value
from 0 to 5. Low tiers are plain struck tokens with a faint sheen. High tiers gain
deeper relief, an engraved guilloché field, a double bevel, and — at the very
summit — a laurel that overflows the rim. But even the top medal is *restrained.*
More prestige buys more depth and more precision, never more noise.

**IV. Every mark means something.** No badge is decorated at random. Each track has
a silhouette drawn from how craft actually frames rank (a heraldic shield, a guild
mark), and each medal carries a **motif** — a real object from textile and dress
history (a Roman fibula, a Jacquard loom, a bone sewing needle 40,000 years old).
The art carries meaning, so a holder who reads the lore learns something.

**V. One object, everywhere.** The badge on the passport, in the community
directory, on a public profile, and in the help gallery is the *same* object with
the *same* behaviour. Consistency is itself a mark of quality; a badge that looked
premium in one place and cheap in another would undermine the whole claim.

---

## 3. Structure — tracks, tiers, and capstones

The system has two parts: four **progression tracks** that give everyone a ladder
to climb, and a set of **rare capstones** that sit above the tracks and are
genuinely hard to reach. Scarcity is the point of the second part.

### The four tracks (bronze → silver → gold → titanium)

| Track | What it rewards | Silhouette | Why this shape |
|---|---|---|---|
| **The Wardrobe** | Building a real, organised closet | Heraldic shield | A shield is what you build and defend — the base of an identity |
| **The Fit Record** | Honest fit outcomes logged over time | Round seal | The oldest form of a certified record; a struck civic seal |
| **The Atelier** | Posting looks the community responds to | Flat-top hexagon | Engineered, crafted, made — reads as construction |
| **The Counsel** | Answering others usefully | Quatrefoil guild mark | The four-lobed mark a workshop stamped on work it stood behind |

The Counsel is deliberately the **hardest track to fake**, because it needs *other
people* to find you useful — you cannot grind it alone.

### The rare capstones (above the ladder)

| Capstone | Metal | How it's earned |
|---|---|---|
| **Acclaimed** | Diamond | 250+ likes on a single look |
| **Tastemaker** | Amethyst *(special)* | 1,500+ total likes across your looks |
| **Polymath** | Jade *(special)* | Gold or above in all four tracks |
| **Head Designer** | Obsidian | 4,000+ total likes — the pinnacle |

Capstones use a **rosette** — a scalloped medal edge reserved for honours that
don't belong to any single track.

---

## 4. The metal ladder — colour and material

Colour is where rank is read, so the palette is designed for *distance between
neighbours*, not smoothness. Each metal is specified as a six-stop material
(highlight, mid, shadow, rim, engraving ink, ambient glow) so the SVG can light it
like a struck surface rather than fill it like a shape.

| Metal | Rank | Character | The reading it gives |
|---|---|---|---|
| **Bronze** | 1 | Warm, matte, low relief | "You've started. This is real." |
| **Silver** | 2 | Bright, cool, clean specular | Competent, everyday achievement |
| **Gold** | 3 | Warm yellow, high specular | Mastery within a track |
| **Titanium** | 4 | **Mid-dark, violet-warm, brushed** | Aerospace-grade; the top of a track |
| **Diamond** | capstone | Glassy, pale cyan, agate veining | A single brilliant achievement |
| **Obsidian** | pinnacle | Near-black volcanic glass | Rare, dark, exacting — the summit |
| **Amethyst** | special | Gem violet with white veining | Sets the taste (once valued with diamond) |
| **Jade** | special | Imperial green, agate veined | Breadth across everything |
| **Amber** | special | Fossil-orange, warm | Reserved for commemorative honours |

**Why titanium, not platinum.** Platinum's colour was a pale cool grey — almost
the same value and temperature as bright silver two rungs below it. On a passport
card at banner size, a viewer genuinely could not tell them apart, which defeats
Principle I. Titanium is **mid-dark and violet-warm with a brushed grain**: against
bright silver, yellow gold, and glassy obsidian it is instantly its own thing. It
also carries the right cultural association — the material of watch cases, aircraft,
and surgical tools: *earned through engineering, not bought for show.*

**Agate veining.** Diamond and above gain irregular white veins, authored as
hand-drawn curves in a unit box and clipped to the medal body — the striations of
real agate, or the inclusions in a cut stone. It signals "this is a rare material,"
and it only ever appears at the top, so it can never be mistaken for a lower tier.

---

## 5. The current medals, in full

Everything below is *built and live.* Thresholds are intentionally hard — a ladder
that everyone maxes out in a week rewards nothing.

### The Wardrobe — shield
- **Verified Closet** · bronze · 8+ garments logged · *motif: a hanger.* "Every archive begins with a first inventory."
- **Curator** · silver · 20+ items across 4+ collections · *motif: guardaroba shelves.* The Renaissance keeper of a well-ordered wardrobe.
- **Wardrobe Archivist** · gold · 45+ items across 10+ brands · *motif: an imperial silk archive.*
- **Grand Wardrobe** · titanium · 100+ items, 20+ brands, 6+ collections · *motif: an obelisk.* Scale that must be administered, not merely owned.

### The Fit Record — round seal
- **Truth-Teller** · bronze · 5+ fit outcomes recorded · *motif: a Roman wax tablet.* The honest ledger of what fit and what didn't.
- **Calibrated** · silver · 25+ comfort refreshes · *motif: a sundial's gnomon.* Measurement kept true as the body changes.
- **Open Closet** · gold · listed publicly with a substantiated closet · *motif: a cartographer's compass rose.*
- **Fit Scholar** · titanium · 60+ refreshes and 20+ outcomes · *motif: a surveyor's rod.*

### The Atelier — hexagon
- **First Look** · bronze · posted your first outfit · *motif: a bone needle, the oldest tool of dress.*
- **Stylist** · silver · 6 outfits posted · *motif: the tailor's shears.*
- **Couturier** · gold · 15 outfits and 150+ likes · *motif: the Jacquard loom.*
- **Atelier Master** · titanium · 30 outfits and 500+ likes · *motif: a maison's head atelier.*

### The Counsel — quatrefoil
- **Sounding Board** · bronze · answered 3 questions · *motif: a thimble* — the humblest tool, the one that protects the hand doing the work.
- **Trusted Voice** · silver · 10 answers, 8 voted helpful · *motif: the tailor's tape.*
- **Fit Oracle** · gold · 30 answers, 40 helpful, 3 accepted · *motif: a medieval guild mark.*
- **Community Pillar** · titanium · 80 answers, 150 helpful, 12 accepted · *motif: the Roman fibula* — the clasp that held the whole garment together.

### Rare capstones — rosette
- **Acclaimed** · diamond · 250+ likes on one look.
- **Tastemaker** · amethyst · 1,500+ total likes.
- **Polymath** · jade · gold in all four tracks — breadth, not just depth.
- **Head Designer** · obsidian · 4,000+ total likes — the pinnacle.

---

## 6. If cost were no object — the ideal medal

The brief: *most creative, most beautiful, most fashionable, most artful — while
staying simple, restrained, and never gaudy.* Here is how each medal would be made
if difficulty and cost did not exist and only that taste governed.

### 6.1 The material would be lit, not filled

A real struck medal has no "colour" — it has a **material under a light**. The
ideal build renders every medal with a physically-based surface: a measured index
of refraction per metal, anisotropic brushing on titanium that catches the light in
a single direction, true Fresnel rim-light so the edge glows where it turns away
from you, and a studio environment reflected in the field (a soft key, a cool fill,
one hard rim). Turning the medal would sweep a real specular highlight across a real
surface — the way you tilt a coin under a lamp to read it. *We already do a
restrained version of this in the inspect stage; the ideal makes it the default
everywhere, at a fraction of the intensity so it never shouts.*

### 6.2 The silhouette would be quieter and more precise

Fashion-world restraint means **fewer lines, cut exactly.** The ideal silhouettes
drop every decorative flourish and keep one confident geometric gesture each:

- **The Wardrobe** — not a literal heraldic shield but its *essence*: a single
  tapered plane, like a garment bag seen edge-on, with one fold of relief.
- **The Fit Record** — a perfect circle with a single engraved concentric ring, the
  way a spirit level or a lens is machined. Precision *is* the ornament.
- **The Atelier** — the hexagon, but softened to the proportions of a spool end,
  with the six edges chamfered so light breaks differently on each.
- **The Counsel** — the quatrefoil reduced to four tangent circles, a knot, so it
  reads as *connection* rather than decoration.

### 6.3 The centre would be a single deep-relief mark

Not an icon sitting *on* the surface — a form **struck into** it, with the metal
piled up at the edges of the stroke the way a real die displaces material. One
motif per medal, drawn as a continuous line with no fill, catching a hairline of
highlight on its raised edge and a pool of shadow in its valley. The motifs stay as
they are — they already carry real meaning — but they'd be *sculpted*, so the
thimble, the fibula, the loom read as objects you could run a thumbnail across.

### 6.4 Colour would be almost monochrome — until it isn't

The most fashionable, most "high" version of this system is **nearly achromatic.**
Bronze, silver, gold, titanium, obsidian are all rendered as *tones of metal* — the
whole ladder could sit on a black card and read as jewellery, not as a video-game
loot table. The colour restraint is what makes the three **special** metals
(amethyst, jade, amber) land: after a wall of disciplined greys and warm neutrals,
a single veined violet or imperial green *means* something. Rarity you can see.

### 6.5 Motion would be the luxury signal

Cheap things flash. Expensive things move slowly and settle. The ideal medal drifts
almost imperceptibly at rest (a fraction of a degree, as if breathing), turns with
weight and a touch of inertia when you push it, and settles rather than snaps. The
raking light tracks the rotation so the surface *tells you it is metal* without a
single sparkle. This is exactly the note the K95 / NOTHIN' sites hit — first-second
impact — but paid for in **material and motion**, not in loaders and wait time.

### 6.6 The set would be designed as a set

The final, most artful move: the eight metals and five silhouettes are designed as
**one coherent family**, the way a fashion house designs a hardware collection —
the same rim profile, the same bevel angle, the same light rig across all twenty
medals, so that laying them out together looks like a *jewellery case*, not a
sticker sheet. Coherence at the set level is the difference between "achievements"
and "a collection." That is the bar.

---

## 7. Anti-patterns — what this system refuses to do

- **No purchasable tiers.** The moment status can be bought, it stops being status.
- **No rainbow.** More colours would read as a game UI. The ladder is metal; colour
  is spent only on the three rare specials.
- **No flat fallback.** A flat badge would break Principle II the instant it
  appeared next to a dimensional one.
- **No sparkle, no burst, no confetti.** Restraint is the brand. Prestige is shown
  with depth and precision, not with particle effects.
- **No fake data.** The founder/demo account can *display* the full ladder for a
  pitch, but even then the underlying stats stay honest — nothing about the engine
  or the leaderboards is distorted.

---

*Implementation lives in `app-web/src/lib/badges.ts` (the ladder and thresholds — the
single source of truth), `src/components/BadgeMedallion.tsx` (the struck-metal SVG
art, palette, silhouettes, and veining), `src/components/BadgeCoin.tsx` and
`BadgeInspect.tsx` (the dimensional coin and the turn-to-inspect stage), and
`src/components/MetalCard.tsx` (the passport card finish that follows your highest
metal).*
