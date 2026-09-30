import { describe, it, expect, vi, afterEach } from "vitest";
import { judgeListing, type ListingInput } from "./listingJudgement";
import { EN_TEXT, ZH_TEXT } from "./engineText";
import { readSeller } from "./sellerMeasurements";
import { extractSmart } from "./extractorLLM";
import { refusalFor } from "./checkPolicy";
import { verdictFromDelta } from "./fitEngine";

const profile = { chestCm: 100, waistCm: 80, preferredFit: "regular" as const, chestIsEstimated: false };
function listing(title: string, over: Partial<ListingInput> = {}): ListingInput {
  const seller = readSeller({ title });
  const chest = seller.measurements.find((m) => m.field === "chest")?.cm ?? null;
  const waist = seller.measurements.find((m) => m.field === "waist")?.cm ?? null;
  return {
    option: { label: seller.sizeLabel ?? "—", chestCm: chest, waistCm: waist },
    category: "shirt",
    categoryGuessed: false,
    profile,
    easeCm: 10, // regular
    knownGood: [],
    seller,
    ...over,
  };
}
const shirt = (size: string, garmentChestCm: number | null, fitDirection: number | null = 0) => ({
  brand: "Uniqlo", category: "shirt", size, fitDirection, garmentChestCm, garmentMeasuredFrom: garmentChestCm ? "page" : null,
});

describe("judging a one-off listing against a garment the wearer owns", () => {
  it("compares garment with garment: 24 in pit to pit is 121.9 cm, 3.9 cm more than a 118 cm shirt that fits", () => {
    const j = judgeListing(listing(`Shirt Mens L 24" Pit To Pit`, { knownGood: [shirt("L", 118)] }), EN_TEXT);
    expect(j).toMatchObject({ basis: "closet-garment", outcome: "may-be-loose", strength: "strong", verdict: "relaxed" });
    expect(j.deltaCm).toBeCloseTo(3.9, 1);
    expect(j.reasons).toHaveLength(2);
    expect(j.reasons[0]).toMatch(/24 in pit to pit, laid flat — about 121\.9 cm all the way round/);
  });

  it("moves the target by the owned garment's fit report, the way the engine moves an anchor", () => {
    // A 110 cm shirt reported too tight: the wearer wants a full size step more (8.3 cm).
    const j = judgeListing(listing(`Shirt 23.25" pit to pit`, { knownGood: [shirt("M", 110, -10)] }), EN_TEXT);
    expect(j.targetCm).toBeCloseTo(118.3, 1);
    expect(j.outcome).toBe("likely-fits");
  });

  it("prefers a garment of the same kind, and one the wearer has reported on", () => {
    const j = judgeListing(listing(`Shirt 24" pit to pit`, {
      knownGood: [{ ...shirt("XL", 130), category: "hoodie" }, shirt("L", 122), shirt("M", 110, null)],
    }), EN_TEXT);
    expect(j.reasons[1]).toMatch(/Uniqlo L/);
  });
});

describe("judging against the wearer's own measurements", () => {
  it("uses the engine's target: chest + the stated preference's ease", () => {
    const j = judgeListing(listing(`Shirt 26" pit to pit`), EN_TEXT);
    expect(j).toMatchObject({ basis: "body", targetCm: 110, outcome: "too-big", strength: "strong" });
    expect(verdictFromDelta(j.deltaCm!)).toBe("too big");
  });

  it("is weak on a regional-average chest, and says why", () => {
    const j = judgeListing(listing(`Shirt 26" pit to pit`, { profile: { ...profile, chestIsEstimated: true } }), EN_TEXT);
    expect(j.strength).toBe("weak");
    expect(j.notes.join(" ")).toMatch(/regional average/);
  });

  it("says when a hand measurement could change the answer, and lowers its strength", () => {
    // 22 in → 111.8 cm against a 110 cm target: +1.8 cm, a centimetre from "relaxed".
    const j = judgeListing(listing(`Shirt 22" pit to pit`), EN_TEXT);
    expect(j.outcome).toBe("likely-fits");
    expect(j.strength).toBe("moderate");
    expect(j.notes.join(" ")).toMatch(/Close to the line/);
  });

  it("judges trousers on the waist: 16 in flat is 81.3 cm against 80 + 8", () => {
    const j = judgeListing(listing(`Levi's 501 waist flat 16"`, { category: "jeans" }), EN_TEXT);
    expect(j).toMatchObject({ basis: "body", outcome: "too-small" });
    expect(j.targetCm).toBe(88);
  });
});

describe("with only a printed size", () => {
  it("compares it with a size of the same kind in the closet, and never calls that strong", () => {
    const same = judgeListing(listing("Shirt Mens L", { knownGood: [shirt("L", null)] }), EN_TEXT);
    expect(same).toMatchObject({ basis: "label", outcome: "likely-fits", strength: "weak" });
    expect(same.next).toContain("enter-chest");
    const bigger = judgeListing(listing("Shirt Mens XL", { knownGood: [shirt("M", null)] }), EN_TEXT);
    expect(bigger.outcome).toBe("too-big");
  });
});

describe("when nothing settles it, it says what would", () => {
  it("asks for the seller's pit to pit when there is no measurement", () => {
    expect(judgeListing(listing("Plain shirt, great condition"), EN_TEXT)).toMatchObject({ outcome: "unknown", next: ["enter-chest"], confidence: 0 });
  });
  it("asks for the wearer's measurement when there is nothing of theirs to compare with", () => {
    const j = judgeListing(listing(`Shirt 24" pit to pit`, { profile: { ...profile, chestCm: null } }), EN_TEXT);
    expect(j).toMatchObject({ outcome: "unknown", next: ["add-body"] });
  });
  it("asks which kind of garment it is rather than guessing the measurement to judge", () => {
    expect(judgeListing(listing(`24" pit to pit`, { categoryGuessed: true }), EN_TEXT).next).toEqual(["choose-category"]);
  });
  it("asks to confirm a bare 'chest' instead of reading it as a pit to pit", () => {
    expect(judgeListing(listing("Shirt chest 22"), EN_TEXT).next).toEqual(["enter-chest", "confirm-measure"]);
  });
});

describe("the same numbers in both languages", () => {
  it("changes only the words", () => {
    const input = listing(`Shirt Mens L 24" Pit To Pit`, { knownGood: [shirt("L", 118)] });
    const en = judgeListing(input, EN_TEXT);
    const zh = judgeListing(input, ZH_TEXT);
    expect({ ...zh, reasons: [], notes: [] }).toEqual({ ...en, reasons: [], notes: [] });
    expect(zh.reasons[0]).toContain("换算为一圈约 121.9 cm");
  });
});

// Through the real extractor, on the page shape the extension sends for an eBay item.
const EBAY = "https://www.ebay.com/itm/137301446035";
const page = (h1: string, specs = "") =>
  `<!doctype html><html lang="en"><head><title>${h1} | eBay</title></head><body><h1>${h1}</h1>${specs}` +
  `<p>${"padding ".repeat(30)}</p></body></html>`;

describe("an eBay listing through the extractor and the refusal policy", () => {
  afterEach(() => { vi.unstubAllGlobals(); });
  it("becomes one garment, measured by the seller, never a ladder", async () => {
    const ex = await extractSmart(EBAY, { html: page(`Coleman Shirt Mens XXL Red Buffalo Plaid Flannel Check 24" Pit To Pit 30" Long`) });
    expect(ex.sizes).toHaveLength(1);
    expect(ex.sizes[0]).toMatchObject({ label: "XXL", lengthCm: 76.2 });
    expect(ex.sizes[0].chestCm).toBeCloseTo(121.9, 1);
    expect(ex.source).toMatchObject({ listing: true, sizesFrom: "seller", measurementKind: "garment", extractedBy: "seller-title" });
    expect(ex.source.sizesSynthesized).toBeUndefined();
    expect(refusalFor(ex, EN_TEXT)).toBeNull();
  });
  it("reads a measurement from the item specifics the extension sends", async () => {
    const ex = await extractSmart(EBAY, { html: page("Free Planet Men's Flannel Shirt Size L", `<dl data-fp="specs"><dt>Chest Size</dt><dd>25" Pit to Pit</dd><dt>Size</dt><dd>L</dd></dl>`) });
    expect(ex.source.extractedBy).toBe("seller-specs");
    expect(ex.sizes[0].chestCm).toBeCloseTo(127, 0);
  });
  it("keeps a printed size with no measurement as a real, unmeasured label", async () => {
    const ex = await extractSmart(EBAY, { html: page("Tommy Hilfiger Mens Shirt Size L Blue") });
    expect(ex.sizes).toEqual([{ label: "L" }]);
    expect(refusalFor(ex, EN_TEXT)).toBeNull();
  });
  it("refuses a listing with nothing about its size — asking for the seller's numbers, not a size guide", async () => {
    const ex = await extractSmart(EBAY, { html: page("Vintage flannel shirt red plaid") });
    expect(refusalFor(ex, EN_TEXT)?.error).toBe("no-measurements-listing");
  });
  it("takes the user's typed numbers when our server cannot read the listing at all", async () => {
    // eBay answers our server with an error page (measured, Session 80): only what
    // the user typed can be used. Stubbed so the test never touches the network.
    vi.stubGlobal("fetch", vi.fn(async () => new Response("", { status: 403 })));
    const ex = await extractSmart(EBAY, { seller: { typed: [{ field: "chest", value: 23, unit: "in", flat: true }], category: "top" } });
    expect(ex.source).toMatchObject({ listing: true, sizesFrom: "seller", extractedBy: "seller-typed", categoryFrom: "user" });
    expect(refusalFor(ex, EN_TEXT)).toBeNull();
  });
});
