// The category classifier (Session 84c): Jev first, Haiku only as a switched-on
// fallback, and nothing used below the confidence threshold. fetch is stubbed —
// no test calls a real API.
import { afterEach, describe, expect, it, vi } from "vitest";
import { classifyCategory, clearCategoryCache, CATEGORY_CHOICES } from "./categoryModel";
import { CATEGORY_MODEL } from "./scoringConstants";

type Call = { url: string; body: any; headers: Record<string, string> };
function stub(respond: (url: string) => Response | Promise<Response>): Call[] {
  const calls: Call[] = [];
  vi.stubGlobal("fetch", async (url: string, init: RequestInit) => {
    calls.push({ url, body: JSON.parse(String(init.body)), headers: init.headers as Record<string, string> });
    return respond(url);
  });
  return calls;
}
const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { "content-type": "application/json" } });
const jev = (choice: string, confidence: number) => json({ model: "jev-1.13.0", answers: { category: { type: "choice", choice, confidence, probabilities: {} } } });

afterEach(() => { vi.unstubAllGlobals(); clearCategoryCache(); });

describe("classifyCategory", () => {
  it("asks Jev with the product's name only, as a typed choice over our categories", async () => {
    const calls = stub(() => jev("top", 0.93));
    const r = await classifyCategory({ name: "Lace-Trimmed Velvet Top", structured: "Ladies" }, { TYPESAFE_API_KEY: "k" });
    expect(r).toEqual({ category: "top", confidence: 0.93, by: "jev" });
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe("https://api.typesafe.ai/v1/systemone");
    expect(calls[0].headers.authorization).toBe("Bearer k");
    expect(calls[0].body.state).toBe("Product: Lace-Trimmed Velvet Top\nShop category: Ladies");
    expect(calls[0].body.questions.category.type).toBe("choice");
    expect(Object.keys(calls[0].body.questions.category.criteria)).toEqual(Object.keys(CATEGORY_CHOICES));
  });

  it("does not use a split answer; passes a confident 'not clothing' on", async () => {
    stub(() => jev("top", CATEGORY_MODEL.minConfidence - 0.01));
    expect(await classifyCategory({ name: "Thing A" }, { TYPESAFE_API_KEY: "k" })).toBeNull();
    stub(() => jev("not_clothing", 0.99));
    expect(await classifyCategory({ name: "Gift Card" }, { TYPESAFE_API_KEY: "k" })).toMatchObject({ category: "not_clothing" });
  });

  it("calls nothing without a key, and asks once per name", async () => {
    const none = stub(() => jev("top", 0.9));
    expect(await classifyCategory({ name: "Velvet Top" }, {})).toBeNull();
    expect(none).toHaveLength(0);
    const calls = stub(() => jev("dress", 0.9));
    await classifyCategory({ name: "Slip" }, { TYPESAFE_API_KEY: "k" });
    await classifyCategory({ name: "Slip" }, { TYPESAFE_API_KEY: "k" });
    expect(calls).toHaveLength(1);
  });

  it("falls back to Haiku only when Jev fails and the fallback is switched on", async () => {
    const off = stub((url) => (url.includes("typesafe") ? json({}, 529) : json({})));
    expect(await classifyCategory({ name: "Velvet Top 1" }, { TYPESAFE_API_KEY: "k", ANTHROPIC_API_KEY: "a" })).toBeNull();
    expect(off.map((c) => c.url)).toEqual(["https://api.typesafe.ai/v1/systemone"]);

    const on = stub((url) =>
      url.includes("typesafe") ? json({}, 529) : json({ content: [{ type: "tool_use", name: "category", input: { category: "top" } }] }),
    );
    const r = await classifyCategory({ name: "Velvet Top 2" }, { TYPESAFE_API_KEY: "k", ANTHROPIC_API_KEY: "a", CATEGORY_FALLBACK: "haiku" });
    expect(r).toMatchObject({ category: "top", by: "haiku" });
    expect(on[1].body.tool_choice).toEqual({ type: "tool", name: "category" });
    expect(on[1].body.tools[0].input_schema.properties.category.enum).toEqual(Object.keys(CATEGORY_CHOICES));
  });

  it("never throws, whatever the network does", async () => {
    vi.stubGlobal("fetch", async () => { throw new Error("offline"); });
    await expect(classifyCategory({ name: "Velvet Top 3" }, { TYPESAFE_API_KEY: "k" })).resolves.toBeNull();
  });
});
