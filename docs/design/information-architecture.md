# Information architecture — why the app feels like work, and the shape of the fix

> **Status: SKETCH. Nothing here is built.** Written 2026-08-27 at the founder's
> request for "a rough outline first, don't build it yet". It states the problem
> with measurements, proposes a direction, and stops.

## The complaint, and the measurement

> "每个栏目一点进去东西太多，不会给人想填的欲望" — each section has too much when
> you click in; it doesn't make you *want* to fill it in.

Measured on a 390px phone, logged in, with real data:

| Page | Input controls | Buttons / links | Words | Screens tall |
|---|---|---|---|---|
| `/closet` | **23** | **104** | 117 | 5.5 |
| `/` | 1 | 29 | **578** | **9.8** |
| `/badges` | 0 | 56 | 527 | 5.2 |
| `/community` | 1 | 40 | 456 | 4.5 |
| `/passport` | 1 | 50 | 117 | 2.7 |
| `/outfits` | 6 | 25 | 146 | 2.7 |
| `/check` | 3 | 23 | 150 | 2.4 |
| **`/refresh`** | 0 | **22** | **93** | **1.8** |

Two things fall straight out of that table.

**The closet is the worst page and it is the one that most needs to be inviting.**
23 input controls and 104 tappable elements are visible at once, on the screen whose
entire job is to make someone add three garments. The add form alone asks for brand,
name, type, line, size, region, fit, colour, collection, photo and a URL — before
the user has any evidence that the effort pays off.

**The least dense page is the one that is already guided.** `/refresh` is a card
stack: one garment, one question, swipe. It has the fewest controls, the fewest
words and the shortest scroll of anything in the app — *not* because it does less,
but because it shows one decision at a time. It is the pattern the rest of the app
is missing, and it already exists in this codebase.

## The diagnosis

**The app is organised around its data model, not around what a person came to do.**
Closet, Passport, Outfits, Community and Badges are the nouns of the schema. A
visitor's actual intents are verbs, and there are only about three of them:

1. *Will this fit me?* — paste a link, get an answer
2. *Teach it about me* — so the answer gets better
3. *Show me something* — the social and status layer

Today every intent is spread across several nouns, and every noun shows everything
it holds at full volume the moment it is opened. Nothing is deferred, so nothing
feels optional, so all of it feels like homework.

## Direction

Three moves, in order of value. This is a sketch: each would need its own pass.

**1. One question per screen wherever we ask for anything.**
Generalise `/refresh`. The closet add-form becomes a short sequence — *what brand?
what size? how does it sit?* — with everything else (photo, colour, collection, URL,
name, region) moved behind "add detail" and defaulted. The
[interaction-cost budget](closet-signal-and-interaction-cost.md#32-the-metric--fic-fit-interaction-cost)
already exists to arbitrate this: it prices every field against what the engine
actually gains, and it already says free-text notes and prompted photos do not earn
their cost.

**2. Earn the next question with a visible payoff.**
Right now a person spends effort *before* seeing value. Invert it: let the first
size check run on nothing, show a real answer with an honest low confidence, and
let the app ask for the next thing *because* the user can see what it would buy —
"add one garment you own and this goes from a guess to a recommendation." The
confidence number and `conflictNote` we already compute are the natural hook; they
are currently an explanation, and they could be the invitation.

**3. Intent-led entry rather than a section list.**
The nav lists nouns. It could offer the three verbs and route into the existing
pages underneath. This is the largest change and the one most likely to be wrong on
the first attempt, so it should come last, after the two above have been observed
working.

## Two requests that belong in this plan rather than beside it

**The logo story on the site.** Worth doing — but it is new content, and the same
message that asked for it is the one that says there is already too much to read.
Bolting a design-story section onto a page that is 9.8 screens long makes the
measured problem worse. It belongs *inside* this rework, as part of deciding what a
first-time visitor reads, not as another block appended to the homepage.

**A foundation-shade picker.** This is not a feature, it is a second product
surface, and it deserves to be treated as one:

- It is a *coherent* extension of the thesis. "One profile, any store" is not
  specific to garments, and shade codes are as incompatible across cosmetics brands
  as sizes are across clothing labels. The wedge is the same one.
- It shares almost nothing with the existing engine. Fit is measurement geometry;
  shade is colour science - undertone, depth, device colour calibration. None of
  `fitEngine.ts` transfers.
- **It introduces a more sensitive data class than anything the app holds today.**
  Skin tone is closer to an identity attribute than a chest measurement, and the
  project's own governance line - never infer or store ethnicity - is much harder
  to hold when the input *is* skin colour. That needs deciding before any code.
- Per the standing research rule, it needs its own grounded write-up first
  (how existing shade-matching works, what accuracy is achievable from a phone
  photo, what is claimed versus proven) before it is built.

Recommendation: park it as a **researched proposal**, not a sprint. Building it now
would add a whole new surface to an app whose stated problem this week is that it
already shows too much.
