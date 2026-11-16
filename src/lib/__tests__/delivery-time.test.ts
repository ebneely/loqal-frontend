import { describe, expect, it } from "vitest";

import { formatDeliveryTime } from "../delivery-time";

const w = (minMinutes: number, maxMinutes: number) => ({ minMinutes, maxMinutes });

describe("formatDeliveryTime", () => {
  it("says minutes under an hour, with the Arabic noun the number takes", () => {
    expect(formatDeliveryTime(w(30, 45), "ar")).toBe("خلال 30–45 دقيقة");
    expect(formatDeliveryTime(w(5, 10), "ar")).toBe("خلال 5–10 دقائق");
    expect(formatDeliveryTime(w(45, 45), "ar")).toBe("خلال 45 دقيقة");
    expect(formatDeliveryTime(w(30, 45), "en")).toBe("Within 30–45 min");
  });

  it("says hours from an hour up, rounding the window outward", () => {
    expect(formatDeliveryTime(w(120, 180), "ar")).toBe("خلال 2–3 ساعات");
    expect(formatDeliveryTime(w(90, 150), "ar")).toBe("خلال 1–3 ساعات");
    // A short end under an hour still reads as one hour, never zero.
    expect(formatDeliveryTime(w(30, 90), "ar")).toBe("خلال 1–2 ساعة");
    expect(formatDeliveryTime(w(60, 60), "ar")).toBe("خلال ساعة");
    expect(formatDeliveryTime(w(120, 120), "ar")).toBe("خلال ساعتين");
    expect(formatDeliveryTime(w(240, 240), "ar")).toBe("خلال 4 ساعات");
    expect(formatDeliveryTime(w(600, 720), "ar")).toBe("خلال 10–12 ساعة");
    expect(formatDeliveryTime(w(120, 180), "en")).toBe("Within 2–3 hours");
    expect(formatDeliveryTime(w(60, 60), "en")).toBe("Within 1 hour");
  });

  it("says days once even the short end is a day", () => {
    expect(formatDeliveryTime(w(1440, 2880), "ar")).toBe("خلال 1–2 يوم");
    expect(formatDeliveryTime(w(2880, 4320), "ar")).toBe("خلال 2–3 أيام");
    expect(formatDeliveryTime(w(1440, 1440), "ar")).toBe("خلال يوم");
    expect(formatDeliveryTime(w(2880, 4320), "en")).toBe("Within 2–3 days");
  });

  it("draws nothing for a missing or impossible window", () => {
    expect(formatDeliveryTime(null, "ar")).toBeNull();
    expect(formatDeliveryTime(undefined, "en")).toBeNull();
    expect(formatDeliveryTime(w(0, 30), "ar")).toBeNull();
    expect(formatDeliveryTime(w(90, 60), "ar")).toBeNull();
    expect(formatDeliveryTime(w(Number.NaN, 60), "ar")).toBeNull();
  });
});
