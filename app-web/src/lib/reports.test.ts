import { describe, expect, it } from "vitest";
import {
  parseReportKind,
  parseReportReason,
  REPORT_HIDE_THRESHOLD,
  REPORT_REASONS,
  reportsUntilHidden,
  shouldAutoHide,
} from "./reports";

describe("parseReportKind", () => {
  it("accepts the three reportable kinds, case-insensitively", () => {
    expect(parseReportKind("POST")).toBe("POST");
    expect(parseReportKind("answer")).toBe("ANSWER");
    expect(parseReportKind("Outfit")).toBe("OUTFIT");
  });

  it("refuses anything else instead of guessing", () => {
    expect(parseReportKind("USER")).toBeNull();
    expect(parseReportKind("")).toBeNull();
    expect(parseReportKind(null)).toBeNull();
  });
});

describe("parseReportReason", () => {
  it("accepts every declared reason", () => {
    for (const r of REPORT_REASONS) expect(parseReportReason(r.key)).toBe(r.key);
  });

  it("keeps the brand-imagery reason, which is our specific legal exposure", () => {
    expect(REPORT_REASONS.map((r) => r.key)).toContain("STOLEN_IMAGE");
  });

  it("refuses unknown reasons", () => {
    expect(parseReportReason("BECAUSE")).toBeNull();
    expect(parseReportReason(undefined)).toBeNull();
  });
});

describe("auto-hide rule", () => {
  it("needs the threshold in DISTINCT reporters", () => {
    expect(shouldAutoHide(REPORT_HIDE_THRESHOLD - 1)).toBe(false);
    expect(shouldAutoHide(REPORT_HIDE_THRESHOLD)).toBe(true);
    expect(shouldAutoHide(REPORT_HIDE_THRESHOLD + 5)).toBe(true);
  });

  it("one determined reporter can never hide anything on their own", () => {
    expect(REPORT_HIDE_THRESHOLD).toBeGreaterThan(1);
    expect(shouldAutoHide(1)).toBe(false);
  });

  it("counts down to the threshold and never below zero", () => {
    expect(reportsUntilHidden(0)).toBe(REPORT_HIDE_THRESHOLD);
    expect(reportsUntilHidden(REPORT_HIDE_THRESHOLD)).toBe(0);
    expect(reportsUntilHidden(REPORT_HIDE_THRESHOLD + 9)).toBe(0);
  });
});
