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
