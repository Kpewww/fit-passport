// Check policy — the decisions a size check makes around the engine, pulled out
// of /api/check so they are pure, testable, and applied identically by every
// route that returns a recommendation.
//
//   refusalFor()          when the honest answer is "we can't size this"
//   applyProvenanceCap()  how confident a number may claim to be, given its source
//   sessionGate()         whether an extension request may run without a session
//
// The engine stays pure: it never learns where the size chart came from. These
// are the boundary rules that do know. They lived inline in the check route
// until Session 75, and the cap in particular was not applied by /api/recommend
// at all — so toggling the fit preference on /check lifted an "estimated"
// result's confidence straight past the ceiling the page had just shown.

import type { ExtractedProduct } from "./extractor";
import type { EngineOutput } from "./fitEngine";
import { SCOREABLE_DOMAINS, domainForCategory, domainLabel } from "./sizeSystems";
import { CONFIDENCE_CAPS } from "./scoringConstants";
import { EN_TEXT, type EngineText } from "./engineText";

type Source = ExtractedProduct["source"];

export type RefusalCode =
  | "unreadable"
  | "not-apparel"
  | "unsupported-category"
  | "no-chart-on-page";

export type Refusal = {
  error: RefusalCode;
  /** The sentence the UI shows. A refusal is the product working, so it explains. */
  message: string;
  /** Present on unsupported-category, so the UI can name what it recognised. */
  category?: string;
};

/**
 * The reasons to refuse, most fundamental first, or null to go ahead.
 *
 * Order matters when several apply: "that isn't clothing" and "we don't size
 * footwear" are truer answers about a page than "we found no chart on it".
 */
export function refusalFor(extracted: ExtractedProduct, M: EngineText = EN_TEXT): Refusal | null {
  const { source } = extracted;

  // REFUSE when we never got the page at all — invariant ㊼.
  //
  // A failed fetch plus estimated sizes means NOTHING on screen came from the
  // retailer: the brand is the domain, the category is a word in the URL, and the
  // size ladder is a generic one we keep for brands we know. Measured case that
  // prompted it: patagonia.com serves a bare 10-byte 404 to a non-browser client
  // on product paths; we fetched nothing, invented XS–XL with chest
  // 106/111/116/121/126, and then told the user we couldn't tell them apart.
  if ((source.fetch === "unreachable" || source.fetch === "blocked") && source.sizesFrom === "estimated") {
    return {
      error: "unreadable",
      message: M.refuseUnreadable,
    };
  }

  // REFUSE what isn't clothing — invariant ⑪.
  //
  // Nothing in the URL or the page identified a garment, AND we never found a
  // real size chart: a game top-up page, an article, a login wall. The extractor
  // used to default such pages to "tshirt" and hand back a confident size.
  if (source.categoryGuessed && source.sizesFrom === "estimated") {
    return {
      error: "not-apparel",
      message: M.refuseNotApparel,
    };
  }

  // REFUSE a category we can recognise but cannot honestly score — invariant ㉜.
  //
  // The engine compares body measurements to garment measurements, and there is
  // no foot-length, head or neck field to compare footwear, socks or accessories
  // against. Measured before the guard: a men's sneaker URL returned "XS" at 24%
  // confidence, off the same letter ladder a t-shirt would get.
  const domain = domainForCategory(extracted.category);
  if (!SCOREABLE_DOMAINS.includes(domain)) {
    return {
      error: "unsupported-category",
      message: M.refuseUnsupported(domain),
      category: extracted.category,
    };
  }

  // REFUSE to score an invented ladder on a page the browser handed us.
  //
  // ㊼ only looked at our OWN fetch failing, so a page supplied by the extension
  // that held no chart slipped past it: `fetch` was "extension", the sizes were
  // still `buildSizes()`'s two constants extrapolated, and the engine scored the
  // user against chest measurements no page ever stated (capped at 0.5, which
  // does not make fiction honest). An existing test was even NAMED "still refuses
  // to invent when the supplied page holds no chart" while asserting only the
  // extractor's label — the route served the ladder anyway.
  //
  // Only the invented ladder is refused. A page that listed its real sizes with
  // no measurements still goes through: a closet anchor can rank real labels
  // honestly, and with no evidence at all the engine already says "undetermined".
  // A curated brand chart also goes through — those numbers are the brand's.
  if (source.fetch === "extension" && source.sizesSynthesized) {
    return {
      error: "no-chart-on-page",
      message: M.refuseNoChartExtension,
    };
  }

  // Same situation on a page our SERVER read, when only the page — not the URL —
  // named the garment.
  //
  // Those pages used to be refused as `not-apparel`, because category came from
  // the URL alone, and the message told a user who HAD pasted a garment that they
  // hadn't. Reading the product name fixes the category; it must not also start
  // serving the invented ladder on these pages, which nobody decided. Whether the
  // invented ladder should ever be served on a server-read page is the open
  // BRAND_TABLE question (todo/decisions/03), and its current scope — URL-named
  // garments only — is pinned by a test. This keeps that scope exactly where it
  // was and only makes the reason true.
  if (source.sizesSynthesized && source.categoryFrom && source.categoryFrom !== "url") {
    return {
      error: "no-chart-on-page",
      message: M.refuseNoChartServer,
    };
  }

  return null;
}

/**
 * Ceilings on confidence by where the size chart came from.
 *
 * Estimated sizes are not measurement at all. A curated brand chart holds real
 * numbers the brand published, but not for THIS product: we do not know which
 * sizes it is offered in, or whether it is the slim or relaxed line. That
 * residual uncertainty is about the garment, which no amount of body data on our
 * side can resolve, so it is a ceiling rather than a penalty. Page and fixture
 * provenance are uncapped — the engine's own confidence already reflects them.
 */
export const PROVENANCE_CAP: Readonly<Partial<Record<NonNullable<Source["sizesFrom"]>, number>>> =
  CONFIDENCE_CAPS.provenance;

/** Returns a copy with every size's confidence held under its source's ceiling. */
export function applyProvenanceCap(result: EngineOutput, sizesFrom: Source["sizesFrom"]): EngineOutput {
  const cap = sizesFrom ? PROVENANCE_CAP[sizesFrom] : undefined;
  if (cap == null) return result;
  const ranked = result.ranked.map((r) => ({ ...r, confidence: Math.min(r.confidence, cap) }));
  // `best` is ranked[0] by reference inside the engine; keep them one object.
  const at = result.ranked.indexOf(result.best);
  const best = at >= 0 ? ranked[at] : { ...result.best, confidence: Math.min(result.best.confidence, cap) };
  return { ...result, ranked, best };
}

/**
 * The provenance a stored product was checked with, read back from `rawJson`.
 * Null for rows written before `rawJson` existed or holding anything malformed —
 * callers then apply no cap, which is what those rows always had.
 */
export function sourceFromRawJson(raw: string | null | undefined): Source | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { source?: unknown };
    const s = parsed?.source;
    return s && typeof s === "object" ? (s as Source) : null;
  } catch {
    return null;
  }
}

/** Header the browser extension sends: `x-fp-client: extension/<version>`. */
export const CLIENT_HEADER = "x-fp-client";

export function isExtensionRequest(headers: Headers): boolean {
  return (headers.get(CLIENT_HEADER) ?? "").toLowerCase().startsWith("extension/");
}

/**
 * An extension request with no session is refused, not given a fresh account.
 *
 * `getCurrentUser()` mints an anonymous user for any request without a cookie.
 * For a page load that is the frictionless first visit it was built for. For the
 * extension it would be a silent failure: the check would run against an empty
 * profile in a brand-new account the user will never see again, and every such
 * click would leave another orphan row behind. The cookie goes missing exactly
 * when the user blocks third-party cookies — Chrome treats an extension's request
 * to a site it holds host permission for as same-site, "and does not apply if
 * third-party cookies are blocked" — or has simply never opened Fit Passport in
 * this browser. Both deserve a sentence, not a wrong answer.
 *
 * A web page cannot fake the header to reach this branch cross-origin: a custom
 * header forces a CORS preflight, and this API answers no preflight.
 */
export function sessionGate(fromExtension: boolean, hasSession: boolean): "proceed" | "not-connected" {
  return fromExtension && !hasSession ? "not-connected" : "proceed";
}

export const NOT_CONNECTED_MESSAGE = EN_TEXT.notConnected;
