import { describe, expect, it } from "vitest";

import { minusMoney, promoErrorMessage, promoOutcome, promoReason } from "../promo-rules";

/** `ApiError`'s shape; api.ts itself pulls in aliased contracts vitest does not resolve. */
class ApiError extends Error {
  constructor(readonly statusCode: number, message: string, readonly error: string) {
    super(message);
  }
}
const refused = (message: string) => new ApiError(422, message, "Unprocessable Entity");
const GENERIC = "تعذّر التحقق من الكود الآن. يمكنك إتمام الطلب دونه.";

describe("promoErrorMessage", () => {
  it("maps each 422 reason to its own sentence", () => {
    expect(promoErrorMessage(refused("PROMO_UNKNOWN"), "ar")).toBe("هذا الكود غير صحيح أو لم يعد فعّالًا.");
    expect(promoErrorMessage(refused("PROMO_EXPIRED"), "ar")).toBe("انتهت صلاحية هذا الكود.");
    expect(promoErrorMessage(refused("PROMO_NOT_STARTED"), "ar")).toBe("لم يبدأ العمل بهذا الكود بعد.");
    expect(promoErrorMessage(refused("PROMO_USAGE_LIMIT"), "ar")).toBe("بلغ هذا الكود الحد الأقصى لمرات استخدامه.");
    expect(promoErrorMessage(refused("PROMO_PER_CUSTOMER_LIMIT"), "ar")).toBe("استخدمت هذا الكود بالعدد المسموح لك.");
    expect(promoErrorMessage(refused("PROMO_NOT_APPLICABLE"), "ar")).toBe("لا ينطبق هذا الكود على متاجر سلتك.");
    expect(promoErrorMessage(refused("PROMO_ZERO_TOTAL_CARD"), "ar")).toBe(
      "لا يمكن الدفع بالبطاقة بقيمة صفر. اختر الدفع عند الاستلام أو استخدم كودًا آخر."
    );
  });

  it("names the minimum when the message carries it", () => {
    expect(promoErrorMessage(refused("PROMO_MINIMUM_NOT_REACHED: 300.00"), "ar")).toBe(
      "يعمل هذا الكود حين يبلغ مجموع القطع 300.00 ج.م على الأقل."
    );
    expect(promoErrorMessage(refused("PROMO_MINIMUM_NOT_REACHED"), "ar")).toBe(
      "لم يبلغ مجموع القطع الحد الأدنى لهذا الكود."
    );
  });

  it("reads the code from `error` too, without a prefix or in kebab case", () => {
    expect(promoReason(new ApiError(422, "Code expired", "expired"))?.code).toBe("EXPIRED");
    expect(promoReason(refused("per-customer-limit"))?.code).toBe("PER_CUSTOMER_LIMIT");
  });

  it("falls back to one soft sentence for anything else", () => {
    expect(promoErrorMessage(new ApiError(404, "Cannot POST /api/v1/promo-codes/validate", "Not Found"), "ar")).toBe(GENERIC);
    expect(promoErrorMessage(new ApiError(500, "boom", "Internal"), "ar")).toBe(GENERIC);
    expect(promoErrorMessage(refused("SOMETHING_NEW"), "ar")).toBe(GENERIC);
    expect(promoErrorMessage(new TypeError("Failed to fetch"), "ar")).toBe(GENERIC);
    expect(promoReason(new ApiError(404, "PROMO_EXPIRED", "Not Found"))).toBeNull();
  });
});

describe("promoOutcome", () => {
  const priced = (discountTotal: string) => ({ code: "EID", discountTotal, perBrand: [] });

  it("applies a code the API priced above zero", () => {
    expect(promoOutcome({ code: "EID", result: priced("50.00"), wasApplied: false, locale: "ar" })).toEqual({
      applied: priced("50.00"),
      message: null,
    });
  });

  it("says nothing while the first answer is on its way", () => {
    expect(promoOutcome({ code: "EID", wasApplied: false, locale: "ar" })).toEqual({ applied: null, message: null });
  });

  it("drops a zero discount as not applicable", () => {
    const out = promoOutcome({ code: "EID", result: priced("0.00"), wasApplied: false, locale: "ar" });
    expect(out.applied).toBeNull();
    expect(out.message).toBe("لا ينطبق هذا الكود على متاجر سلتك.");
  });

  it("drops a code the changed bag no longer meets, and says the bag changed", () => {
    const out = promoOutcome({ code: "EID", error: refused("PROMO_MINIMUM_NOT_REACHED: 300"), wasApplied: true, locale: "ar" });
    expect(out.applied).toBeNull();
    expect(out.message).toBe("تغيّرت سلتك فأُزيل الكود EID. يعمل هذا الكود حين يبلغ مجموع القطع 300.00 ج.م على الأقل.");
  });

  it("refuses a first try without the bag-changed preamble", () => {
    expect(promoOutcome({ code: "EID", error: refused("PROMO_EXPIRED"), wasApplied: false, locale: "ar" }).message).toBe(
      "انتهت صلاحية هذا الكود."
    );
  });
});

describe("minusMoney", () => {
  it("subtracts in piastres and never goes below zero", () => {
    expect(minusMoney("450.10", "50.05")).toBe("400.05");
    expect(minusMoney("40.00", "50.00")).toBe("0.00");
    expect(minusMoney(null, "10.00")).toBeNull();
  });
});
