/**
 * Is the shop open, right now, in Cairo?
 *
 * Worked out in the browser rather than sent by the API, because shop pages
 * are cached for minutes and "open" is a fact about the moment somebody looks.
 *
 * Cairo time always, whatever the shopper's device is set to — a shopper
 * abroad buying for their mother in Heliopolis wants to know whether the shop
 * is open THERE. `closesAt` earlier than `opensAt` means the shop closes after
 * midnight, and the hours after midnight belong to the day it opened: a shop
 * closed on Fridays that stays open until 1am on Thursday is open at 00:30 on
 * Friday morning.
 */
import type { PublicBrand } from "@loqal/contracts/storefront.contract";
import { formatPrice } from "./locale";
import { formatDeliveryTime } from "./delivery-time";

export type ShopHours = {
  opensAt: string;
  closesAt: string;
  /** 0 = Sunday … 6 = Saturday. */
  closedDays: number[];
};

const WEEKDAY: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

const minutesOf = (hhmm: string): number => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

/** The day and minute it is in Cairo at `at`. */
export function cairoNow(at: Date = new Date()): { day: number; minute: number } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Cairo",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(at);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return {
    day: WEEKDAY[get("weekday")] ?? 0,
    minute: Number(get("hour")) * 60 + Number(get("minute")),
  };
}

export function isOpenNow(hours: ShopHours, at: Date = new Date()): boolean {
  const { day, minute } = cairoNow(at);
  const opens = minutesOf(hours.opensAt);
  const closes = minutesOf(hours.closesAt);
  const shut = (d: number) => hours.closedDays.includes(d);

  if (closes > opens) {
    return !shut(day) && minute >= opens && minute < closes;
  }

  // Past midnight: open from `opens` to the end of today, and from midnight
  // until `closes` on what is still yesterday's shift.
  const yesterday = (day + 6) % 7;
  return (!shut(day) && minute >= opens) || (!shut(yesterday) && minute < closes);
}

/**
 * One or two letters for a shop with no logo. Two initials only when the name
 * is two words of Latin script — Arabic joins, so a second letter lifted out
 * of the middle of a word is a different glyph than the one the reader sees.
 */
export function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";

  const latin = /^[\p{Script=Latin}]/u.test(words[0]);
  if (latin && words.length > 1) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return latin ? words[0][0].toUpperCase() : words[0][0];
}

/** "22:00" as a shop sign writes it: "10:00 م" / "10:00 pm". */
export function clock(hhmm: string, locale: "ar" | "en"): string {
  const [h, m] = hhmm.split(":").map(Number);
  const hour = h % 12 === 0 ? 12 : h % 12;
  const pm = h >= 12;
  const tail = locale === "ar" ? (pm ? "م" : "ص") : pm ? "pm" : "am";
  return `${hour}:${String(m).padStart(2, "0")} ${tail}`;
}

/**
 * The count words the shop surfaces print. Arabic changes the noun's form at
 * one, two, three-to-ten and eleven-up: متجر واحد، متجران، 3 متاجر، 11 متجرًا.
 */
function counted(
  n: number,
  locale: "ar" | "en",
  ar: [one: string, two: string, few: string, many: string],
  en: [one: string, other: string],
): string {
  if (locale === "en") return `${n} ${n === 1 ? en[0] : en[1]}`;
  if (n === 1) return ar[0];
  if (n === 2) return ar[1];
  return `${n} ${n >= 3 && n <= 10 ? ar[2] : ar[3]}`;
}

export const shopCount = (n: number, locale: "ar" | "en") =>
  counted(n, locale, ["متجر واحد", "متجران", "متاجر", "متجرًا"], ["shop", "shops"]);

export const pieceCount = (n: number, locale: "ar" | "en") =>
  counted(n, locale, ["قطعة واحدة", "قطعتان", "قطع", "قطعة"], ["piece", "pieces"]);

export const dayCount = (n: number, locale: "ar" | "en") =>
  counted(n, locale, ["يوم واحد", "يومان", "أيام", "يومًا"], ["day", "days"]);

export const ratingCount = (n: number, locale: "ar" | "en") =>
  counted(n, locale, ["تقييم واحد", "تقييمان", "تقييمات", "تقييمًا"], ["rating", "ratings"]);

/** «★ 4.6 · 23 تقييمًا», or null when nobody has rated the shop yet. */
export function ratingLine(
  rating: { average: number; count: number } | null | undefined,
  locale: "ar" | "en",
): string | null {
  if (!rating || rating.count < 1 || !Number.isFinite(rating.average)) return null;
  return `★ ${rating.average.toFixed(1)} · ${ratingCount(rating.count, locale)}`;
}

/**
 * The facts row under a shop's name: a bold value and a quiet note each.
 * Only what the shop has actually said, in this order, so a shop with no
 * address or hours yet shows its delivery terms instead of a blank or a guess.
 */
export function shopFacts(
  shop: Pick<
    PublicBrand,
    "neighbourhood" | "hours" | "deliveryFee" | "returnWindowDays"
  > & { deliveryTime?: PublicBrand["deliveryTime"] },
  locale: "ar" | "en",
  at: Date = new Date(),
): { value: string; note: string }[] {
  const t = (ar: string, en: string) => (locale === "ar" ? ar : en);
  const facts: { value: string; note: string }[] = [];

  if (shop.neighbourhood) {
    facts.push({ value: shop.neighbourhood, note: t("مكان المتجر", "Where it is") });
  }
  if (shop.hours) {
    const open = isOpenNow(shop.hours, at);
    facts.push({
      value: open ? t("مفتوح الآن", "Open now") : t("مغلق الآن", "Closed now"),
      note: `${clock(shop.hours.opensAt, locale)} – ${clock(shop.hours.closesAt, locale)}`,
    });
  }
  facts.push({
    // The shop's own window when it has given one; same day is the promise until then.
    value: formatDeliveryTime(shop.deliveryTime, locale) ?? t("اليوم نفسه", "Same day"),
    note: t("يرسل المتجر طلبك بنفسه", "The shop sends your order itself"),
  });
  if (shop.deliveryFee != null) {
    facts.push({ value: formatPrice(shop.deliveryFee, locale), note: t("رسوم التوصيل", "Delivery fee") });
  }
  if (shop.returnWindowDays > 0) {
    facts.push({
      value: dayCount(shop.returnWindowDays, locale),
      note: t("للاستبدال والاسترجاع", "To exchange or return"),
    });
  }
  return facts;
}
