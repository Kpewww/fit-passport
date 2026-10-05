// Dresses, jumpsuits and swimsuits (Session 84): read a chart's hip, and score a
// one-piece on bust, waist and hip — without moving how tops and bottoms score.
import { describe, expect, it } from "vitest";
import { parseSizeChart } from "./pageParse";
import { recommend, type EngineInput } from "./fitEngine";
import { SCOREABLE_DOMAINS, domainForCategory } from "./sizeSystems";

// A women's dress chart as shops print it: body bust, waist and hips per size.
const DRESS_CHART = `<p>Body measurements</p><table>
<tr><th>Size</th><th>Bust (cm)</th><th>Waist (cm)</th><th>Hips (cm)</th></tr>
<tr><td>XS</td><td>80-84</td><td>62-66</td><td>88-92</td></tr>
<tr><td>S</td><td>84-88</td><td>66-70</td><td>92-96</td></tr>
<tr><td>M</td><td>88-92</td><td>70-74</td><td>96-100</td></tr>
<tr><td>L</td><td>92-96</td><td>74-78</td><td>100-104</td></tr>
</table>`;

function input(category: string, sizes: EngineInput["sizes"], hipCm: number | null): EngineInput {
  return {
    profile: { chestCm: 86, waistCm: 68, hipCm, preferredFit: "regular" },
    product: { brand: "Test", category },
    sizes,
    knownGood: [],
    outcomes: [],
  };
}

describe("a dress chart's hips are read", () => {
  it("as the body hip range each size is cut for", () => {
    const parsed = parseSizeChart(DRESS_CHART)!;
    expect(parsed.kind).toBe("body");
    const s = parsed.sizes.find((x) => x.label === "S")!;
    expect([s.bodyChestMinCm, s.bodyChestMaxCm]).toEqual([84, 88]);
    expect([s.bodyWaistMinCm, s.bodyWaistMaxCm]).toEqual([66, 70]);
    expect([s.bodyHipMinCm, s.bodyHipMaxCm]).toEqual([92, 96]);
  });
});

describe("a one-piece is scored on bust, waist and hip", () => {
  const sizes = () => parseSizeChart(DRESS_CHART)!.sizes.map((s) => ({ ...s }));

  it("is scoreable now", () => {
    expect(domainForCategory("dress")).toBe("onepiece");
    expect(SCOREABLE_DOMAINS).toContain("onepiece");
  });

  it("lets the hips decide when bust and waist say S but the hips need M", () => {
    const narrow = recommend(input("dress", sizes(), 94));
    const wide = recommend(input("dress", sizes(), 99));
    expect(narrow.best?.label).toBe("S");
    expect(wide.best?.label).not.toBe("S");
  });

  it("ignores hip for a top, so tops score exactly as before", () => {
    const withHip = recommend(input("tshirt", sizes(), 120));
    const without = recommend(input("tshirt", sizes(), null));
    expect(withHip.best?.label).toBe(without.best?.label);
    expect(withHip.ranked.map((r) => r.score)).toEqual(without.ranked.map((r) => r.score));
  });
});
