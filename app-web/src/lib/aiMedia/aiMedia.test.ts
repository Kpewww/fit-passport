import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  aiConsent: { findUnique: vi.fn() },
  mediaJob: { aggregate: vi.fn(), count: vi.fn(), create: vi.fn(), update: vi.fn(), findMany: vi.fn(), updateMany: vi.fn((a: unknown) => a) },
  knownGoodItem: { findFirst: vi.fn(), update: vi.fn((a: unknown) => a), findMany: vi.fn(), updateMany: vi.fn((a: unknown) => a) },
  aiPhoto: { findFirst: vi.fn(), findMany: vi.fn(), deleteMany: vi.fn((a: unknown) => a) },
  event: { create: vi.fn() },
  $transaction: vi.fn(async (ops: unknown[]) => ops),
}));
vi.mock("../db", () => ({ prisma: db }));
const store = vi.hoisted(() => ({ storePhoto: vi.fn(async () => "blob:https://store/cut.png"), dropPhotos: vi.fn(async () => {}) }));
vi.mock("../photoStore", async (orig) => ({ ...(await orig<typeof import("../photoStore")>()), ...store }));

import { canSpend } from "./budget";
import { aiEnabled } from "./config";
import { CONSENT_VERSION } from "./consent";
import { resultToDataUrl } from "./images";
import { pollTryon, startTryon, tryonCategory } from "./providers/fashn";
import { removeBackground } from "./providers/bria";
import { deleteAllAiPhotos, runCutout } from "./service";

const PNG = "data:image/png;base64,iVBORw0KGgo=";
const env = { ...process.env };
beforeEach(() => {
  vi.clearAllMocks();
  process.env.AI_MONTHLY_BUDGET_USD = "50";
  process.env.BRIA_API_TOKEN = "t";
  process.env.FASHN_API_KEY = "k";
  db.mediaJob.aggregate.mockResolvedValue({ _sum: { costUsd: 0 } });
  db.mediaJob.count.mockResolvedValue(0);
});
afterEach(() => { process.env = { ...env }; vi.unstubAllGlobals(); });

describe("AI photo features are off until the founder turns them on (Session 104)", () => {
  it("no budget, or no key, means off", () => {
    process.env.AI_MONTHLY_BUDGET_USD = "0";
    expect(aiEnabled("cutout")).toBe(false);
    process.env.AI_MONTHLY_BUDGET_USD = "50";
    delete process.env.FASHN_API_KEY;
    expect(aiEnabled("tryon")).toBe(false);
    expect(aiEnabled("cutout")).toBe(true);
  });
  it("the monthly cap and the daily allowance stop new jobs", async () => {
    expect(await canSpend("u", "tryon")).toEqual({ ok: true });
    db.mediaJob.aggregate.mockResolvedValue({ _sum: { costUsd: 49.95 } });
    expect(await canSpend("u", "tryon")).toEqual({ ok: false, reason: "budget" });
    db.mediaJob.aggregate.mockResolvedValue({ _sum: { costUsd: 0 } });
    db.mediaJob.count.mockResolvedValue(10);
    expect(await canSpend("u", "tryon")).toEqual({ ok: false, reason: "daily" });
  });
  it("failed jobs are not counted against anyone", async () => {
    await canSpend("u", "cutout");
    expect(db.mediaJob.aggregate.mock.calls[0][0].where.status).toEqual({ in: ["running", "done"] });
    expect(db.mediaJob.count.mock.calls[0][0].where.status).toEqual({ in: ["running", "done"] });
  });
});

describe("a cut-out", () => {
  const item = { id: "i1", imageDataUrl: PNG, cutoutPhoto: null };
  it("sends nothing without consent", async () => {
    db.knownGoodItem.findFirst.mockResolvedValue(item);
    db.aiConsent.findUnique.mockResolvedValue(null);
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    expect(await runCutout("u", "i1")).toEqual({ ok: false, reason: "consent" });
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(db.mediaJob.create).not.toHaveBeenCalled();
  });
  it("keeps the original and stores the cut-out privately; a failure costs nothing", async () => {
    db.knownGoodItem.findFirst.mockResolvedValue(item);
    db.aiConsent.findUnique.mockResolvedValue({ version: CONSENT_VERSION });
    db.mediaJob.create.mockResolvedValue({ id: "j1" });
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ result: { image_url: PNG } }) })));
    const r = await runCutout("u", "i1");
    expect(r.ok).toBe(true);
    const upd = db.knownGoodItem.update.mock.calls[0][0] as { data: Record<string, unknown> };
    expect(upd.data).toEqual({ cutoutPhoto: "blob:https://store/cut.png", photoView: "cutout" });
    expect(upd.data.imageDataUrl).toBeUndefined();

    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 500 })));
    const f = await runCutout("u", "i1");
    expect(f).toMatchObject({ ok: false, reason: "failed" });
    expect(db.mediaJob.update).toHaveBeenLastCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "failed", costUsd: 0 }) }));
  });
  it("needs a photo", async () => {
    db.knownGoodItem.findFirst.mockResolvedValue({ ...item, imageDataUrl: null });
    expect(await runCutout("u", "i1")).toEqual({ ok: false, reason: "no-photo" });
  });
});

describe("providers", () => {
  it("BRIA gets the raw base64 with the token header", async () => {
    const f = vi.fn(async () => ({ ok: true, json: async () => ({ result: { image_url: "https://cdn/x.png" } }) }));
    expect(await removeBackground(PNG, f as never)).toBe("https://cdn/x.png");
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toMatch(/\/v2\/image\/edit\/remove_background$/);
    expect((init.headers as Record<string, string>).api_token).toBe("t");
    expect(JSON.parse(init.body as string)).toMatchObject({ image: "iVBORw0KGgo=", sync: true });
  });
  it("FASHN: run, then completed / failed / still running", async () => {
    const run = vi.fn(async () => ({ ok: true, json: async () => ({ id: "p1" }) }));
    expect(await startTryon({ personDataUrl: PNG, garmentDataUrl: PNG, category: "tops" }, run as never)).toBe("p1");
    const body = JSON.parse((run.mock.calls[0] as unknown as [string, RequestInit])[1].body as string);
    expect(body).toMatchObject({ model_name: "tryon-v1.6", inputs: { category: "tops", return_base64: true } });
    const st = (b: unknown) => vi.fn(async () => ({ ok: true, json: async () => b }));
    expect(await pollTryon("p1", st({ status: "completed", output: [PNG] }) as never)).toEqual({ status: "done", output: PNG });
    expect(await pollTryon("p1", st({ status: "failed", error: { name: "PoseError" } }) as never)).toEqual({ status: "failed", error: "PoseError" });
    expect(await pollTryon("p1", st({ status: "processing" }) as never)).toEqual({ status: "running" });
  });
  it("garment types map to try-on categories", () => {
    expect(tryonCategory("top")).toBe("tops");
    expect(tryonCategory("bottom")).toBe("bottoms");
    expect(tryonCategory("onepiece")).toBe("one-pieces");
    expect(tryonCategory("shoe")).toBe("auto");
  });
});

describe("results", () => {
  it("only images come back, never other types or plain http", async () => {
    expect(await resultToDataUrl(PNG)).toBe(PNG);
    await expect(resultToDataUrl("data:text/html;base64,PGI+")).rejects.toThrow();
    await expect(resultToDataUrl("http://cdn/x.png")).rejects.toThrow();
    const f = vi.fn(async () => ({ ok: true, headers: new Headers({ "content-type": "text/html" }), arrayBuffer: async () => new ArrayBuffer(4) }));
    await expect(resultToDataUrl("https://cdn/x", f as never)).rejects.toThrow();
  });
});

describe("delete all AI photos", () => {
  it("drops body photos, results and cut-outs, never the original closet photos", async () => {
    db.aiPhoto.findMany.mockResolvedValue([{ photo: "blob:a" }]);
    db.mediaJob.findMany.mockResolvedValue([{ result: "blob:b" }]);
    db.knownGoodItem.findMany.mockResolvedValue([{ cutoutPhoto: "blob:c" }]);
    expect(await deleteAllAiPhotos("u")).toBe(3);
    expect(store.dropPhotos).toHaveBeenCalledWith(["blob:a", "blob:b", "blob:c"]);
    expect((db.knownGoodItem.updateMany.mock.calls[0][0] as { data: unknown }).data).toEqual({ cutoutPhoto: null, photoView: null });
  });
});
