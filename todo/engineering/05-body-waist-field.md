# A body-waist field, so waist can reach the engine

**Wait for the benchmark. Do not shortcut this one.**

## The situation

`fitEngine.ts` scores waist, and that code **never runs in production**:
`recommendService` does not pass a size's `waistCm`.

That looks like a one-line fix and is not. The parser moves a body chart's chest
into `bodyChestMinCm/MaxCm` but leaves its **waist in the garment `waistCm` field**
— and Uniqlo, Nike and Patagonia all publish body waist columns. Passing waist
today would feed body numbers into a garment slot: **invariant ㊿ again, one column
over**, and the failure mode is the same one that cost a full size on chest.

## The fix, in order

1. Add `bodyWaistMinCm` / `bodyWaistMaxCm` (the Prisma `SizeOption` model already
   has them — the parser does not fill them).
2. Have the parser route a body chart's waist there, the way it already routes chest.
3. Only then pass waist into `EngineInput`.

**A schema change needs a migration** — `db:push` alone is how production went down
once (invariant ㉑, and `schemaMigrations.test.ts` will fail without one).

## Why / context

`app-web/src/lib/engineInput.ts` states this in place; build-state Session 75c
"CORRECTION".
