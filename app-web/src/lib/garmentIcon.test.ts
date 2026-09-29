// Every garment type the picker offers has a real icon. Only the catch-alls
// ("accessory", "other") fall back to the coat hanger — a new category added to
// GARMENTS without an icon would otherwise quietly render as a hanger too.

import { describe, expect, it } from "vitest";
import { GARMENTS } from "./garments";
import { GARMENT_ICON_CATEGORIES } from "../components/GarmentIcon";

const CATCH_ALL = new Set(["accessory", "other"]);

describe("garment icons", () => {
  it("cover every specific category in GARMENTS", () => {
    const missing = GARMENTS.map((g) => g.category).filter(
      (c) => !CATCH_ALL.has(c) && !GARMENT_ICON_CATEGORIES.includes(c),
    );
    expect(missing).toEqual([]);
  });

  it("never carries an emoji in the taxonomy itself", () => {
    for (const g of GARMENTS) expect(Object.keys(g)).not.toContain("glyph");
  });
});
