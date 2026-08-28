import { describe, it, expect } from "vitest";
import { COLOR_PRESETS, colorHex, colorHexOr } from "./colors";

describe("garment colour palette", () => {
  it("has no duplicate names", () => {
    const names = COLOR_PRESETS.map((c) => c.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("stores every preset lowercase, so a stored name always matches", () => {
    for (const c of COLOR_PRESETS) expect(c.name).toBe(c.name.toLowerCase());
  });

  it("gives every preset a valid hex", () => {
    for (const c of COLOR_PRESETS) expect(c.hex).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it("fills both rows of the picker grid", () => {
    // The grid is grid-cols-10; a partial row would read as a mistake.
    expect(COLOR_PRESETS.length % 10).toBe(0);
  });
});

describe("colorHex", () => {
  it("resolves a preset name, case-insensitively", () => {
    expect(colorHex("navy")).toBe("#1f2a44");
    expect(colorHex("Navy")).toBe("#1f2a44");
  });

  it("passes a raw hex straight through", () => {
    expect(colorHex("#abc")).toBe("#abc");
    expect(colorHex("#A1B2C3")).toBe("#A1B2C3");
  });

  it("returns null for free text and for nothing, so no swatch is drawn", () => {
    expect(colorHex("that greenish one")).toBeNull();
    expect(colorHex("")).toBeNull();
    expect(colorHex(null)).toBeNull();
    expect(colorHex(undefined)).toBeNull();
  });

  it("falls back only where a colour must be painted", () => {
    expect(colorHexOr(null, "#eee")).toBe("#eee");
    expect(colorHexOr("teal", "#eee")).toBe("#2f8f83");
  });
});
