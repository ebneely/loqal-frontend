import type { Locale } from "./locale";

/**
 * A shop's own delivery window, as a shopper reads it: «خلال 2–3 ساعات».
 *
 * The unit follows the size of the window: minutes under an hour, days once
 * even the short end is a day or more, hours in between. Hours are rounded
 * OUTWARD (the short end down, the long end up), so the label can widen the
 * shop's promise but never shorten it. Latin digits in both languages.
 *
 * Null for a window that makes no sense (non-positive, or upside down): a
 * label built from bad data would be a promise nobody made.
 */
export type DeliveryWindow = { minMinutes: number; maxMinutes: number };

const DAY = 24 * 60;

/** The Arabic noun after a number: 1, 2, 3–10, 11 and up. */
function arNoun(n: number, forms: [one: string, two: string, few: string, many: string]) {
  if (n === 1) return forms[0];
  if (n === 2) return forms[1];
  return n >= 3 && n <= 10 ? forms[2] : forms[3];
}

const AR = {
  minute: ["دقيقة", "دقيقتين", "دقائق", "دقيقة"],
  hour: ["ساعة", "ساعتين", "ساعات", "ساعة"],
  day: ["يوم", "يومين", "أيام", "يومًا"],
} as const satisfies Record<string, [string, string, string, string]>;

const EN = {
  minute: ["min", "min"],
  hour: ["hour", "hours"],
  day: ["day", "days"],
} as const;

export function formatDeliveryTime(
  window: DeliveryWindow | null | undefined,
  locale: Locale,
): string | null {
  if (!window) return null;
  const { minMinutes, maxMinutes } = window;
  if (
    !Number.isFinite(minMinutes) ||
    !Number.isFinite(maxMinutes) ||
    minMinutes <= 0 ||
    maxMinutes < minMinutes
  ) {
    return null;
  }

  let unit: keyof typeof AR;
  let low: number;
  let high: number;
  if (maxMinutes < 60) {
    unit = "minute";
    low = Math.round(minMinutes);
    high = Math.round(maxMinutes);
  } else if (minMinutes >= DAY) {
    unit = "day";
    low = Math.floor(minMinutes / DAY);
    high = Math.ceil(maxMinutes / DAY);
  } else {
    unit = "hour";
    low = Math.max(1, Math.floor(minMinutes / 60));
    high = Math.ceil(maxMinutes / 60);
  }

  if (locale === "en") {
    const noun = high === 1 ? EN[unit][0] : EN[unit][1];
    return low === high ? `Within ${high} ${noun}` : `Within ${low}–${high} ${noun}`;
  }

  // A single 1 or 2 is said by the noun alone: «خلال ساعة»، «خلال يومين».
  if (low === high) {
    if (high <= 2) return `خلال ${arNoun(high, AR[unit])}`;
    return `خلال ${high} ${arNoun(high, AR[unit])}`;
  }
  // A range takes the noun of its long end; "1–2" reads as one hour's noun.
  const noun = high === 2 ? AR[unit][0] : arNoun(high, AR[unit]);
  return `خلال ${low}–${high} ${noun}`;
}
