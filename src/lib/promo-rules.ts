import type { CartSummary } from "@loqal/contracts/cart.contract";

import { formatPrice, type Locale } from "./locale";
import type { PromoValidation } from "./promo";

/**
 * The promo code's pure rules: reason code → sentence, and what one
 * validation answer means for the order. Kept apart from `promo.ts` (the
 * schema and the hook) so the tests load no API client.
 */

/**
 * The 422 reasons, matched inside the error body's `error` or `message` with
 * or without a `PROMO_` prefix. No name here contains another.
 */
const REASONS = [
  "UNKNOWN",
  "EXPIRED",
  "NOT_STARTED",
  "USAGE_LIMIT",
  "PER_CUSTOMER_LIMIT",
  "MINIMUM_NOT_REACHED",
  "NOT_APPLICABLE",
] as const;
export type PromoReasonCode = (typeof REASONS)[number];

/** `ApiError`'s fields, read by shape so this file needs no API client. */
type ErrorBody = { statusCode: number; message: string; error: string };

export function promoReason(error: unknown): { code: PromoReasonCode; minimum: string | null } | null {
  const body = error as Partial<ErrorBody> | null;
  if (!(error instanceof Error) || body?.statusCode !== 422) return null;
  const text = `${body.error ?? ""} ${error.message}`.toUpperCase().replace(/[\s-]+/g, "_");
  const code = REASONS.find((reason) => text.includes(reason));
  if (!code) return null;
  // The minimum rides in the message, e.g. "PROMO_MINIMUM_NOT_REACHED: 300.00".
  const minimum = code === "MINIMUM_NOT_REACHED" ? (error.message.match(/\d+(?:\.\d+)?/)?.[0] ?? null) : null;
  return { code, minimum };
}

const notApplicable = (locale: Locale) =>
  locale === "ar" ? "لا ينطبق هذا الكود على متاجر سلتك." : "This code does not apply to the shops in your bag.";

export function promoErrorMessage(error: unknown, locale: Locale): string {
  const t = (ar: string, en: string) => (locale === "ar" ? ar : en);
  const reason = promoReason(error);
  switch (reason?.code) {
    case "UNKNOWN":
      return t("هذا الكود غير صحيح أو لم يعد فعّالًا.", "This code is not valid, or no longer active.");
    case "EXPIRED":
      return t("انتهت صلاحية هذا الكود.", "This code has expired.");
    case "NOT_STARTED":
      return t("لم يبدأ العمل بهذا الكود بعد.", "This code is not active yet.");
    case "USAGE_LIMIT":
      return t("بلغ هذا الكود الحد الأقصى لمرات استخدامه.", "This code has been used the most times it allows.");
    case "PER_CUSTOMER_LIMIT":
      return t("استخدمت هذا الكود بالعدد المسموح لك.", "You have already used this code as often as it allows.");
    case "MINIMUM_NOT_REACHED":
      return reason.minimum
        ? t(
            `يعمل هذا الكود حين يبلغ مجموع القطع ${formatPrice(reason.minimum, locale, { decimals: true })} على الأقل.`,
            `This code needs items worth at least ${formatPrice(reason.minimum, locale, { decimals: true })}.`
          )
        : t("لم يبلغ مجموع القطع الحد الأدنى لهذا الكود.", "Your items are under this code's minimum.");
    case "NOT_APPLICABLE":
      return notApplicable(locale);
    default:
      return t(
        "تعذّر التحقق من الكود الآن. يمكنك إتمام الطلب دونه.",
        "We cannot check the code right now. You can still order without it."
      );
  }
}

/**
 * What one validation answer means for the order.
 *
 * Applied only when the API priced a discount above zero. Anything else drops
 * the code from the order, with a sentence — prefixed when the code WAS applied
 * and the bag has since changed under it, so the shopper knows why a discount
 * they saw is gone.
 */
export function promoOutcome(input: {
  code: string;
  result?: PromoValidation;
  error?: unknown;
  wasApplied: boolean;
  locale: Locale;
}): { applied: PromoValidation | null; message: string | null } {
  const { code, result, error, wasApplied, locale } = input;
  if (result && Number(result.discountTotal) > 0) return { applied: result, message: null };
  if (!result && !error) return { applied: null, message: null };

  const reason = result ? notApplicable(locale) : promoErrorMessage(error, locale);
  const message = wasApplied
    ? (locale === "ar" ? `تغيّرت سلتك فأُزيل الكود ${code}. ` : `Your bag changed, so ${code} was removed. `) + reason
    : reason;
  return { applied: null, message };
}

/**
 * The bag, as far as a discount can tell: which shops, and what each holds.
 * A change here is what re-prices the code.
 */
export const cartStamp = (cart: CartSummary) =>
  `${cart.subtotal}|${cart.brands.map((brand) => `${brand.brandId}:${brand.subtotal}`).join(",")}`;

/** `total − discount`, in piastres so no float rounding reaches a price. Never below zero. */
export function minusMoney(total: string | null, discount: string): string | null {
  if (total === null) return null;
  const piastres = Math.round(Number(total) * 100) - Math.round(Number(discount) * 100);
  return (Math.max(piastres, 0) / 100).toFixed(2);
}
