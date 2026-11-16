import { describe, expect, it } from "vitest";

import { ratingLine, shopFacts } from "../shop-hours";
import { safeSearchTerm } from "../analytics";

describe("ratingLine", () => {
  it("prints the average to one decimal and counts in Arabic forms", () => {
    expect(ratingLine({ average: 4.56, count: 23 }, "ar")).toBe("★ 4.6 · 23 تقييمًا");
    expect(ratingLine({ average: 5, count: 1 }, "ar")).toBe("★ 5.0 · تقييم واحد");
    expect(ratingLine({ average: 4, count: 7 }, "ar")).toBe("★ 4.0 · 7 تقييمات");
    expect(ratingLine({ average: 4, count: 2 }, "en")).toBe("★ 4.0 · 2 ratings");
  });

  it("draws nothing for a shop nobody has rated", () => {
    expect(ratingLine(null, "ar")).toBeNull();
    expect(ratingLine({ average: 0, count: 0 }, "ar")).toBeNull();
  });
});

describe("shopFacts delivery", () => {
  const base = { neighbourhood: null, hours: null, deliveryFee: null, returnWindowDays: 0 };

  it("uses the shop's own window when it gave one, same day otherwise", () => {
    expect(shopFacts({ ...base, deliveryTime: { minMinutes: 120, maxMinutes: 180 } }, "ar")[0].value).toBe(
      "خلال 2–3 ساعات",
    );
    expect(shopFacts(base, "ar")[0].value).toBe("اليوم نفسه");
  });
});

describe("safeSearchTerm", () => {
  it("keeps ordinary words and drops what looks like a phone or an email", () => {
    expect(safeSearchTerm("  هودي أسود ")).toBe("هودي أسود");
    expect(safeSearchTerm("size 42")).toBe("size 42");
    expect(safeSearchTerm("010 1234 5678")).toBeUndefined();
    expect(safeSearchTerm("me@example.com")).toBeUndefined();
    expect(safeSearchTerm("   ")).toBeUndefined();
  });
});
