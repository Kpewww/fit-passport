# Decide: do the evaluation captures go in the repo?

**Recommended: yes — the reduced, attribute-stripped captures, taken logged out.**

## The choice

| | If committed | If left local |
|---|---|---|
| Reproducibility | Anyone can re-run the benchmark and get the same numbers | Only the person who captured can |
| `npm test` | `src/lib/evalCases.test.ts` starts replaying **real pages** as regression tests | It stays skipped (it says so honestly today) |
| What is in the repo | ~11 KB per page of product parts, logged out | Nothing |

## What a capture actually contains

Not the page. `capture.js` builds a new document from an **allowlist**: title and
product meta, Product/Breadcrumb JSON-LD cut to a short key list, the `<h1>`,
measurement tables as plain-text cells, the body-vs-garment sentence, size options,
chart image addresses. Forms, cart, account, reviews, navigation and scripts are
never included, and emails/phones/card-like numbers in kept text are masked.

Measured on Patagonia: **11 KB out of 1.78 MB**.

## The argument against, stated fairly

It is still someone else's page content sitting in our repo, even reduced, and the
repo is private today but may not always be. If that matters more than
reproducibility, take the alternative: commit only ground truth and results, and
accept that nobody else can re-run the benchmark.

## Decide by

Before the Sprint 5 report cites numbers — a benchmark nobody else can reproduce
is weaker evidence, and reviewers ask.
