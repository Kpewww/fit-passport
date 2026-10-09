// Every garment type the picker offers has a real icon. Only the catch-all
// "other" falls back to the coat hanger — a new type added without an icon of its
// own takes its engine key's or its parent's (Session 98).

import { describe, expect, it } from "vitest";
import { GARMENTS } from "./garments";
import { PARENT_ORDER } from "./garmentTaxonomy";
import { GARMENT_ICON_CATEGORIES, iconKeyFor } from "../components/GarmentIcon";

describe("garment icons", () => {
  it("draw every type in GARMENTS, by itself, its engine key or its parent; only Other is the hanger", () => {
    const missing = GARMENTS.map((g) => g.category).filter((c) => c !== "other" && iconKeyFor(c) == null);
    expect(missing).toEqual([]);
    expect(iconKeyFor("other")).toBeNull();
  });

  it("give every parent a real icon", () => {
    for (const p of PARENT_ORDER) {
      const first = GARMENTS.find((g) => g.parent === p)!;
      expect(GARMENT_ICON_CATEGORIES, p).toContain(iconKeyFor(first.category));
    }
  });

  it("never carries an emoji in the taxonomy itself", () => {
    for (const g of GARMENTS) expect(Object.keys(g)).not.toContain("glyph");
  });
});
