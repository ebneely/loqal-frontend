import { describe, expect, it } from "vitest";

import { cairoNow, isOpenNow } from "../shop-hours";

/**
 * "Open" or "closed" on a shop card, in Cairo time.
 *
 * Each case is a real moment written in UTC. Cairo is UTC+3 in summer (Egypt
 * restored daylight saving in 2023), so 2026-09-17T07:00Z is 10:00 on a
 * Thursday in Cairo. The point of fixing the instant is that the answer must
 * not depend on the clock of whatever machine runs the test — or of the
 * shopper's phone.
 */
const at = (iso: string) => new Date(iso);

describe("cairoNow", () => {
  it("reads the day and the minute in Cairo, not on this machine", () => {
    // 21:30 UTC on a Thursday is 00:30 on Friday in Cairo.
    expect(cairoNow(at("2026-09-17T21:30:00Z"))).toEqual({ day: 5, minute: 30 });
  });
});

describe("isOpenNow", () => {
  const daytime = { opensAt: "10:00", closesAt: "22:00", closedDays: [] as number[] };

  it("is open inside the hours", () => {
    // 13:00 Cairo, Thursday.
    expect(isOpenNow(daytime, at("2026-09-17T10:00:00Z"))).toBe(true);
  });

  it("is closed before opening and at closing time", () => {
    // 09:59 and 22:00 Cairo.
    expect(isOpenNow(daytime, at("2026-09-17T06:59:00Z"))).toBe(false);
    expect(isOpenNow(daytime, at("2026-09-17T19:00:00Z"))).toBe(false);
  });

  it("is closed all day on a day off", () => {
    // 13:00 Cairo on a Friday, with Friday off.
    expect(
      isOpenNow({ ...daytime, closedDays: [5] }, at("2026-09-18T10:00:00Z"))
    ).toBe(false);
  });

  describe("a shop that closes after midnight", () => {
    const late = { opensAt: "12:00", closesAt: "01:00", closedDays: [5] };

    it("is open late on the day it opened", () => {
      // 23:30 Cairo, Thursday.
      expect(isOpenNow(late, at("2026-09-17T20:30:00Z"))).toBe(true);
    });

    it("is still open after midnight on its day off — that hour is Thursday's shift", () => {
      // 00:30 Cairo on Friday, the day off. The shop opened on Thursday.
      expect(isOpenNow(late, at("2026-09-17T21:30:00Z"))).toBe(true);
    });

    it("does not reopen on its day off", () => {
      // 13:00 Cairo on Friday.
      expect(isOpenNow(late, at("2026-09-18T10:00:00Z"))).toBe(false);
    });

    it("is closed after its day off's small hours, which belong to no shift", () => {
      // 00:30 Cairo on Saturday: Friday was off, so there is no Friday shift
      // running past midnight.
      expect(isOpenNow(late, at("2026-09-18T21:30:00Z"))).toBe(false);
    });
  });
});
