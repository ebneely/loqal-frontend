/**
 * One language per session.
 *
 * Arabic is the ORIGINAL, not a translation — the design system is explicit
 * about this, and it is why `ar` is the default rather than a fallback. English
 * says the same thing in English; it does not say the same words.
 *
 * The storefront never shows both at once. A Latin shop name inside an Arabic
 * row is normal and is handled by `unicode-bidi: plaintext` in the base layer,
 * not by translating the name.
 */
export const locales = ["ar", "en"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "ar";

export const isLocale = (value: string): value is Locale =>
  (locales as readonly string[]).includes(value);

/** `dir="rtl"` is the only RTL switch in the whole app. */
export const localeDir = (locale: Locale): "rtl" | "ltr" =>
  locale === "ar" ? "rtl" : "ltr";

/**
 * The cookie the language toggle writes.
 *
 * A cookie rather than a URL segment, deliberately: `/ar/...` and `/en/...`
 * would double every catalogue URL, split the ISR cache in two and hand Google
 * two pages for one product. The pages themselves stay language-neutral in the
 * path and declare their alternates in metadata.
 */
export const LOCALE_COOKIE = "loqal_locale";

/**
 * Money is Egyptian pounds only — there is no currency selector anywhere.
 *
 * Digits are LATIN in both languages, because Egyptian shoppers read money in
 * Latin numerals. A shelf price carries no decimals ("450 ج.م", exactly as the
 * live page writes it); anything being reconciled — a total, a shipping fee, a
 * refund — carries two, because that is a figure somebody checks.
 */
export function formatPrice(
  amount: string | number,
  locale: Locale,
  options: { decimals?: boolean } = {}
): string {
  const value = typeof amount === "string" ? Number(amount) : amount;
  if (!Number.isFinite(value)) return "—";

  const digits = options.decimals ? 2 : 0;
  const figure = value.toLocaleString("en-EG", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });

  // The currency mark trails the figure in Arabic and leads it in English.
  return locale === "ar" ? `${figure} ج.م` : `EGP ${figure}`;
}
