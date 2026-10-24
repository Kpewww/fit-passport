import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  knownGoodItem: { findFirst: vi.fn(), update: vi.fn((a: unknown) => ({ op: "update", a })) },
  comfortCheck: { create: vi.fn((a: unknown) => ({ op: "create", a })) },
  wearLogItem: { findMany: vi.fn() },
  $transaction: vi.fn(async (ops: unknown[]) => ops),
}));
vi.mock("./db", () => ({ prisma: db }));

import { LogInput, PatchInput, daysBetween, inSeason, normaliseSeasons, serverToday, wearStats } from "./wear";
import { recordComfort } from "./comfort";

const today = serverToday();
const shift = (n: number) => new Date(Date.parse(`${today}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);

beforeEach(() => { vi.clearAllMocks(); });

describe("seasons (Session 104)", () => {
  it("are kept in a fixed order; none or all means every season", () => {
    expect(normaliseSeasons("winter, Spring")).toBe("spring,winter");
    expect(normaliseSeasons(["summer"])).toBe("summer");
    expect(normaliseSeasons("")).toBeNull();
    expect(normaliseSeasons("spring,summer,autumn,winter")).toBeNull();
    expect(normaliseSeasons("monsoon")).toBeNull();
  });
  it("an untagged piece is in every season", () => {
    expect(inSeason(null, "winter")).toBe(true);
    expect(inSeason("summer", "winter")).toBe(false);
    expect(inSeason("autumn,winter", "winter")).toBe(true);
  });
});

describe("logging a day", () => {
  const base = { day: today, itemIds: ["a", "b"] };
  it("defaults to worn and accepts today", () => {
    expect(LogInput.parse(base).status).toBe("worn");
    expect(daysBetween("2026-10-01", "2026-10-24")).toBe(23);
  });
  it("a worn day cannot be in the future; a plan can", () => {
    expect(LogInput.safeParse({ ...base, day: shift(3) }).success).toBe(false);
    expect(LogInput.safeParse({ ...base, day: shift(3), status: "planned" }).success).toBe(true);
    expect(LogInput.safeParse({ ...base, day: shift(1) }).success).toBe(true); // timezone slack
  });
  it("fit answers belong to a worn day and to its own pieces", () => {
    expect(LogInput.safeParse({ ...base, fits: [{ itemId: "a", direction: -5 }] }).success).toBe(true);
    expect(LogInput.safeParse({ ...base, status: "planned", day: shift(2), fits: [{ itemId: "a", direction: 0 }] }).success).toBe(false);
    expect(LogInput.safeParse({ ...base, fits: [{ itemId: "z", direction: 0 }] }).success).toBe(false);
  });
  it("rejects a malformed day, no pieces, and an out-of-scale direction", () => {
    expect(LogInput.safeParse({ ...base, day: "2026-13-01" }).success).toBe(false);
    expect(LogInput.safeParse({ ...base, itemIds: [] }).success).toBe(false);
    expect(LogInput.safeParse({ ...base, fits: [{ itemId: "a", direction: 40 }] }).success).toBe(false);
  });
  it("a plan is confirmed as worn, never turned back into a plan", () => {
    expect(PatchInput.safeParse({ id: "x", status: "worn" }).success).toBe(true);
    expect(PatchInput.safeParse({ id: "x", status: "planned" }).success).toBe(false);
  });
});

describe("wear counts", () => {
  it("count worn days only, with the latest day", async () => {
    db.wearLogItem.findMany.mockResolvedValue([
      { itemId: "a", wearLog: { day: "2026-10-01" } },
      { itemId: "a", wearLog: { day: "2026-10-20" } },
      { itemId: "b", wearLog: { day: "2026-10-05" } },
    ]);
    const s = await wearStats("u1");
    expect(s.get("a")).toEqual({ count: 2, lastDay: "2026-10-20" });
    expect(s.get("b")).toEqual({ count: 1, lastDay: "2026-10-05" });
    expect(db.wearLogItem.findMany.mock.calls[0][0].where).toEqual({ wearLog: { userId: "u1", status: "worn" } });
  });
});

describe("recordComfort: one writer for Fit Refresh and the wear calendar", () => {
  it("writes nothing for a piece that is not the user's", async () => {
    db.knownGoodItem.findFirst.mockResolvedValue(null);
    expect(await recordComfort("u1", "x", -5, "worn")).toBeNull();
    expect(db.$transaction).not.toHaveBeenCalled();
  });
  it("updates the piece and appends a history row together, with its reason", async () => {
    db.knownGoodItem.findFirst.mockResolvedValue({ id: "a" });
    const r = await recordComfort("u1", "a", -5, "worn");
    expect(r?.direction).toBe(-5);
    expect(db.$transaction).toHaveBeenCalledTimes(1);
    expect(db.knownGoodItem.update.mock.calls[0][0]).toMatchObject({ where: { id: "a" }, data: { fitDirection: -5 } });
    expect(db.comfortCheck.create.mock.calls[0][0]).toMatchObject({ data: { itemId: "a", userId: "u1", direction: -5, reason: "worn" } });
  });
});
