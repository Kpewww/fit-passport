import { describe, it, expect } from "vitest";
import { OutcomeSchema } from "./outcomeInput";

const base = { productId: "p1", purchasedSize: "M" };

describe("what an outcome record must say", () => {
  it("refuses a return that does not say which way it was wrong", () => {
    // The least useful record there is — "wrong" without "which way".
    const r = OutcomeSchema.safeParse({ ...base, decision: "return" });
    expect(r.success).toBe(false);
    expect(JSON.stringify(r.error?.flatten())).toMatch(/too tight or too loose/);
  });

  it("refuses an exchange that does not name the size swapped to", () => {
    const r = OutcomeSchema.safeParse({ ...base, decision: "exchange", fitDirection: -10 });
    expect(r.success).toBe(false);
  });

  it("accepts a keep without a direction — kept already implies it fit", () => {
    expect(OutcomeSchema.safeParse({ ...base, decision: "keep" }).success).toBe(true);
  });

  it("accepts a signed return, and keeps the direction in range", () => {
    expect(OutcomeSchema.safeParse({ ...base, decision: "return", fitDirection: -10 }).success).toBe(true);
    expect(OutcomeSchema.safeParse({ ...base, decision: "return", fitDirection: -11 }).success).toBe(false);
  });
});
