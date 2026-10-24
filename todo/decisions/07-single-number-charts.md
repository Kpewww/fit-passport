# Decide: use size charts that print one number per size?

**Recommended: yes, as a range reaching halfway to the neighbouring sizes** — the same rule the evaluation
already uses to grade single-number truth (`eval/lib.ts acceptableSizes`).

## Why it matters

Every luxury chart collected so far (Burberry, Gucci, Saint Laurent, Moncler) and several US ones (Banana
Republic women's, J.Crew women's, Levi's women's general, Tommy Hilfiger) print **one chest number per size**
("M 38.6 in"). The rule today (`todo/people/09`) says never widen a single number into a range, so the engine
reads none of them: **zero luxury brands are usable**, against a target of five.

## The options

1. **Keep ignoring them.** Honest, but luxury and much of women's wear stay on the market standard or the US
   consensus.
2. **Halfway to the neighbours** (recommended): M 38.6 with S 37.0 and L 40.2 becomes 37.8–39.4. Derived, not
   printed, so it would be labelled as such and capped like an estimate (0.5), not credited as the brand's chart.
3. **Use the point as is**: no range, the engine's distance to a point. Simplest, but a point says nothing about
   where one size stops and the next begins.

## Why / context

`docs/memory/project-fit-passport-next-steps.md` (brand guides, Session 103); `src/lib/brandGuides.ts` `compile`
drops single numbers today.
