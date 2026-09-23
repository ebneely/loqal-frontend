import { describe, expect, it } from "vitest";

import { attributionFrom, buildCollectEvent } from "../analytics";

/**
 * The beacon's body, checked against what the API's `collectEventSchema`
 * accepts. That schema is `.strict()`, so the failure these guard against is
 * silent: an extra key, an empty string or a non-uuid id does not error on
 * this side — it lands in the API's reject table and the counter stays at 0.
 */
const PRODUCT = "01a0340e-cbcd-7000-8000-000000000001";
const BRAND = "01a0340e-cbcd-7000-8000-000000000002";

describe("buildCollectEvent", () => {
  it("sends only the keys that carry a value", () => {
    expect(
      buildCollectEvent(
        { type: "PRODUCT_VIEW", productId: PRODUCT, brandId: BRAND },
        "/shop/maadi-leather/top-handle-bag",
        {}
      )
    ).toEqual({
      type: "PRODUCT_VIEW",
      productId: PRODUCT,
      brandId: BRAND,
      path: "/shop/maadi-leather/top-handle-bag",
    });
  });

  it("drops an id that is not a uuid rather than failing the event", () => {
    const event = buildCollectEvent({ type: "BRAND_VIEW", brandId: "maadi-leather" }, "/", {});
    expect(event).not.toHaveProperty("brandId");
  });

  it("never sends the query string, where an order page keeps the phone", () => {
    const event = buildCollectEvent({ type: "CHECKOUT_START" }, "/orders/LQ-1?phone=01000000000", {});
    expect(event.path).toBe("/orders/LQ-1");
  });

  it("keeps an ordinary search term and trims it to the API's cap", () => {
    expect(buildCollectEvent({ type: "SEARCH", searchTerm: "  شنطة  " }, "/search", {}).searchTerm).toBe(
      "شنطة"
    );
    expect(
      buildCollectEvent({ type: "SEARCH", searchTerm: "a".repeat(250) }, "/search", {}).searchTerm
    ).toHaveLength(200);
  });

  it("does not send a search term that looks like a phone number or an email", () => {
    for (const term of ["01012345678", "010 1234 5678", "me@example.com"]) {
      const event = buildCollectEvent({ type: "SEARCH_ZERO_RESULT", searchTerm: term }, "/search", {});
      expect(event).not.toHaveProperty("searchTerm");
      // The event itself still goes: a zero-result search is still one.
      expect(event.type).toBe("SEARCH_ZERO_RESULT");
    }
  });

  it("keeps a size or a short number in a search term", () => {
    expect(buildCollectEvent({ type: "SEARCH", searchTerm: "حذاء 42" }, "/search", {}).searchTerm).toBe(
      "حذاء 42"
    );
  });

  it("carries the landing attribution on every event", () => {
    const event = buildCollectEvent({ type: "CART_ADD", metadata: { quantity: 1 } }, "/shop/x/y", {
      utmSource: "instagram",
      landingPath: "/",
    });
    expect(event).toMatchObject({ utmSource: "instagram", landingPath: "/", metadata: { quantity: 1 } });
  });
});

describe("attributionFrom", () => {
  it("reads the utm parameters and another site's host", () => {
    expect(
      attributionFrom({
        pathname: "/shop/nefertari",
        search: "?utm_source=instagram&utm_medium=story&utm_campaign=eid",
        host: "loqaaal.com",
        referrer: "https://l.instagram.com/?u=x",
      })
    ).toEqual({
      utmSource: "instagram",
      utmMedium: "story",
      utmCampaign: "eid",
      utmContent: undefined,
      utmTerm: undefined,
      referrerHost: "l.instagram.com",
      landingPath: "/shop/nefertari",
    });
  });

  it("does not credit a visit to the storefront's own host", () => {
    expect(
      attributionFrom({
        pathname: "/search",
        search: "",
        host: "loqaaal.com",
        referrer: "https://loqaaal.com/",
      }).referrerHost
    ).toBeUndefined();
  });
});
