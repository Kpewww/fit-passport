# Size charts that are not `<table>` — needs a real capture first

**Blocked on evidence, not on code.** Do not write a parser until a real page
shows the structure it would parse.

## What changed in Session 78

The Session 75d evaluation recorded Gap as a chart built from `<div>`s and
Arc'teryx as one held in framework JSON. In Session 78 Gap's product page
(`pid=440775082`), with **Size Guide** pressed in a headed browser, held **no
measurement chart in the DOM at all**: no `<table>`, no ARIA `role=table/grid/row/
cell`, and no element containing "chest", several size labels and numbers together.
The only "chest" on the page was the customer-review fit summary ("Chest average
2.0 of 3, Tight ↔ Loose").

Either the guide loads somewhere automation does not reach, or it is not a
measurement chart. Writing a parser for a structure nobody has observed would be
guessing at the retailer's markup — exactly what this project refuses to do with
numbers.

## What unblocks it

A **hand capture** from a real browser (the extension popup → "Show exactly what
would be sent" → "Save this capture") on a page whose size guide visibly shows a
chart that is not a `<table>`. Then: a fixture from that capture, red, a parser,
green.

## Already done around it (Session 78)

- The `<h1>` the capture sends is now read, so Gap's "Classic T-Shirt" is
  recognised as a t-shirt instead of refused as not-apparel.
- Sizes read by the LLM path now follow the same body/garment rule as tables.
- **Worth noticing:** Gap's review summary is a crowd fit signal ("Chest: Tight ↔
  Loose, average 2.0 of 3"). It is cross-user data about the garment, which this
  round deliberately does not consume — recorded here for the cross-user decision.
