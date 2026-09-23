import { describe, expect, it } from "vitest";

import { attributeName } from "../attribute-names";

/**
 * The picker's heading and its button, for a variant attribute key.
 *
 * The regression this guards is an Arabic product page reading "size — M" and
 * "اختار size": the key a shop's data happens to use, printed as if it were
 * copy.
 */
describe("attributeName", () => {
  it("names a size in Arabic and in English", () => {
    expect(attributeName("size", "ar")).toEqual({
      label: "المقاس",
      choose: "اختار المقاس",
    });
    expect(attributeName("size", "en")).toEqual({
      label: "Size",
      choose: "Choose a size",
    });
  });

  it("reads both spellings of colour as one attribute", () => {
    expect(attributeName("color", "ar").label).toBe("اللون");
    expect(attributeName("colour", "ar").label).toBe("اللون");
    expect(attributeName("color", "en").choose).toBe("Choose a colour");
  });

  it("matches a known key however the shop cased it", () => {
    expect(attributeName(" Size ", "en").label).toBe("Size");
  });

  it("title-cases a key nobody translated rather than hiding it", () => {
    expect(attributeName("sleeve_length", "en")).toEqual({
      label: "Sleeve Length",
      choose: "Choose the sleeve length",
    });
    expect(attributeName("sleeve_length", "ar")).toEqual({
      label: "Sleeve Length",
      choose: "اختار Sleeve Length",
    });
  });
});
