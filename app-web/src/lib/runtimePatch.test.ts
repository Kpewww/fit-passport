import { describe, expect, it } from "vitest";
import { brotliPatched } from "./runtimePatch";

describe("Node patched against the October 2026 Brotli flaw", () => {
  it("the fixed releases and later are patched", () => {
    for (const v of ["24.22.1", "v24.22.1", "24.22.2", "24.23.0", "22.23.4", "22.24.0", "26.12.1", "26.13.0", "28.0.0"]) {
      expect(brotliPatched(v), v).toBe(true);
    }
  });
  it("anything before them is not", () => {
    for (const v of ["24.22.0", "24.18.1", "22.23.3", "22.22.0", "26.12.0", "20.19.0", "18.20.4", "garbage"]) {
      expect(brotliPatched(v), v).toBe(false);
    }
  });
});
