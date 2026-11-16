import { afterEach, describe, expect, it, vi } from "vitest";

import { distanceKm, formatKm, nearestOrder } from "../delivery-location";

const tahrir = { latitude: 30.0444, longitude: 31.2357 };
const zamalek = { latitude: 30.0609, longitude: 31.2197 };
const alex = { latitude: 31.2001, longitude: 29.9187 };

describe("distanceKm", () => {
  it("is zero to itself and about 2.4 km from Tahrir to Zamalek", () => {
    expect(distanceKm(tahrir, tahrir)).toBe(0);
    expect(distanceKm(tahrir, zamalek)).toBeCloseTo(2.4, 1);
  });

  it("puts Cairo to Alexandria at about 180 km, the same both ways", () => {
    const km = distanceKm(tahrir, alex);
    expect(km).toBeGreaterThan(175);
    expect(km).toBeLessThan(185);
    expect(distanceKm(alex, tahrir)).toBeCloseTo(km, 9);
  });
});

describe("formatKm", () => {
  it("keeps one decimal under 10 km and whole km from there, Latin digits", () => {
    expect(formatKm(2.44, "ar")).toBe("2.4 كم");
    expect(formatKm(0.04, "en")).toBe("0.0 km");
    expect(formatKm(9.96, "en")).toBe("10 km");
    expect(formatKm(182.6, "ar")).toBe("183 كم");
  });
});

describe("nearestOrder", () => {
  it("sorts nearest-first, by an area's nearest shop, with no-location entries last in their order", () => {
    const order = nearestOrder(tahrir, [[alex], [], [zamalek], [null], [alex, tahrir]]);
    expect(order).toEqual([4, 2, 0, 1, 3]);
  });

  it("keeps the given order when no location is chosen", () => {
    expect(nearestOrder(null, [[alex], [zamalek]])).toEqual([0, 1]);
  });
});

describe("the store without storage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("keeps the choice in memory when localStorage throws", async () => {
    const refuse = () => {
      throw new Error("SecurityError");
    };
    vi.stubGlobal("window", {
      localStorage: { getItem: refuse, setItem: refuse, removeItem: refuse },
    });
    vi.resetModules();
    const store = await import("../delivery-location");

    expect(store.getDeliveryLocation()).toBeNull();
    const home = { label: "المنزل", ...tahrir };
    store.setDeliveryLocation(home);
    expect(store.getDeliveryLocation()).toEqual(home);
    store.setDeliveryLocation(null);
    expect(store.getDeliveryLocation()).toBeNull();
  });

  it("ignores a stored value that is not a location", async () => {
    vi.stubGlobal("window", {
      localStorage: { getItem: () => '{"label":1}', setItem() {}, removeItem() {} },
    });
    vi.resetModules();
    const store = await import("../delivery-location");
    expect(store.getDeliveryLocation()).toBeNull();
  });
});
