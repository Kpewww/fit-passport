import { describe, it, expect } from "vitest";
import {
  ADD_STEPS,
  BLOCKING_STEPS,
  FIRST_RUN_FIC_BUDGET,
  STEP_ENGINE_USE,
  STEP_FIC,
  addFlowFicTotal,
  canSubmit,
  stepReady,
} from "./addFlow";

describe("closet add flow — the question set", () => {
  it("stays inside the documented first-run FIC budget", () => {
    // §3.2 caps the cost of getting to a first real answer at 30. The old
    // eleven-field form was well past it; a fifth question here would be too.
    expect(addFlowFicTotal()).toBeLessThanOrEqual(FIRST_RUN_FIC_BUDGET);
  });

  it("asks only for things the fit engine actually reads", () => {
    // A step with no engine use is a field the user pays for and nothing scores.
    for (const step of ADD_STEPS) {
      expect(STEP_ENGINE_USE[step], `step "${step}" has no stated engine use`).toBeTruthy();
      expect(STEP_FIC[step], `step "${step}" has no FIC cost`).toBeGreaterThan(0);
    }
    expect(Object.keys(STEP_ENGINE_USE).sort()).toEqual([...ADD_STEPS].sort());
  });

  it("asks for the category before the size", () => {
    // Size validity is category-dependent (isValidSize(category, size)), so the
    // reverse order would validate every size against the default category.
    expect(ADD_STEPS.indexOf("category")).toBeLessThan(ADD_STEPS.indexOf("size"));
  });

  it("blocks on brand and size only", () => {
    // Required fields cost double in the FIC table, so the blocking list is the
    // one place where growth is most expensive.
    expect([...BLOCKING_STEPS].sort()).toEqual(["brand", "size"]);
  });
});

describe("closet add flow — readiness", () => {
  const blank = { brand: "", category: "tshirt", size: "" };

  it("will not advance past an empty or whitespace-only brand", () => {
    expect(stepReady("brand", blank)).toBe(false);
    expect(stepReady("brand", { ...blank, brand: "   " })).toBe(false);
    expect(stepReady("brand", { ...blank, brand: "Uniqlo" })).toBe(true);
  });

  it("treats category and fit as always answered, because both are defaulted", () => {
    expect(stepReady("category", blank)).toBe(true);
    expect(stepReady("fit", blank)).toBe(true);
  });

  it("rejects a size that is not valid for the chosen category", () => {
    expect(stepReady("size", { ...blank, size: "" })).toBe(false);
    // A shoe size is not a valid t-shirt size.
    expect(stepReady("size", { brand: "x", category: "tshirt", size: "M" })).toBe(true);
    expect(stepReady("size", { brand: "x", category: "tshirt", size: "42.5" })).toBe(false);
  });

  it("only submits once brand and size are both answered", () => {
    expect(canSubmit(blank)).toBe(false);
    expect(canSubmit({ brand: "Uniqlo", category: "tshirt", size: "" })).toBe(false);
    expect(canSubmit({ brand: "", category: "tshirt", size: "M" })).toBe(false);
    expect(canSubmit({ brand: "Uniqlo", category: "tshirt", size: "M" })).toBe(true);
  });
});
