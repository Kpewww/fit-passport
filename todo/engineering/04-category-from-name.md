# Take the category from the product name, not only the URL

**Wait for the benchmark to rank it. Small and well understood.**

## The problem

`detectCategoryStrict` reads the URL path only. Gap's "Classic T-Shirt" and the
Uniqlo case were both refused **`not-apparel`** — with a message telling the user
to paste a link to a specific garment, which they had done.

A false refusal with a confident, wrong explanation is worse than a plain failure:
the user is told they made a mistake they did not make.

## The fix

Feed the product name (from `<h1>` and JSON-LD, both already captured) into
category detection alongside the URL.

## Watch out

`CATEGORY_KEYWORDS` is order-sensitive — the first regex that matches wins — and
its Chinese entries must not use `\b` (invariant ⑫: word boundaries are
ASCII-defined and never match at a CJK boundary, which silently kills the group).

Also already known and not yet fixed: `.../mens-dri-fit-training-t-shirt`
classifies as `shirt`, not `tshirt`, because `shirt` sits earlier in the list.
Harmless today (both are the `top` domain) but wrong.

## Done when

Gap and Uniqlo stop being refused as not-apparel, with a test per case.
