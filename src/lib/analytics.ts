/**
 * The analytics beacon: one POST to `/v1/collect` per thing a shopper did.
 *
 * The API has had the endpoint all along (`analytics.public.controller.ts`)
 * and nothing in this app ever called it, so every funnel counter in the admin
 * console read 0 after a full day of real browsing. This file is the whole of
 * the client side.
 *
 * ── THE CONTRACT, FROM THE API AND NOT FROM THE ISSUE ─────────────────────────
 *
 * `collectEventSchema` (loqal-backend `analytics/contracts/collect-event
 * .contract.ts`) is `.strict()` and its `type` is a closed enum:
 * PRODUCT_VIEW, VARIANT_VIEW, BRAND_VIEW, SEARCH, SEARCH_ZERO_RESULT,
 * CART_ADD, CART_REMOVE, CHECKOUT_START. There is NO page-view type, so no
 * page view is sent — a `page_view` would be parsed, refused, and written to
 * the reject table on every navigation. A shop view is `BRAND_VIEW`, and a
 * search that found nothing is its own type rather than a count of zero,
 * which is what the console's "searches that found nothing" list reads.
 *
 * An unknown key fails the whole event for the same `.strict()` reason, so
 * `buildCollectEvent` below is a whitelist that drops every empty value and
 * truncates to the API's own length caps, rather than a spread.
 *
 * ── WHAT IS NEVER SENT ───────────────────────────────────────────────────────
 *
 * Identity. The visitor id, the device, the country and the shopper are all
 * resolved by the API from the request itself and are not accepted from the
 * body, so none of it is here. The path goes WITHOUT its query string: the
 * order page carries `?phone=` in its address, and a query string is exactly
 * where an address like that would leak from. A search term that looks like a
 * phone number or an email is not sent either — somebody pasting their own
 * number into the search box is not a search the console needs to see.
 *
 * There is no consent mechanism to respect: the API asks for none, keeps no
 * cookie for this, and hashes the visitor from the request with a salt that
 * rotates daily. Nothing here stores anything but the landing attribution for
 * the current tab, in sessionStorage, which dies with the tab.
 *
 * ── HOW IT LEAVES ────────────────────────────────────────────────────────────
 *
 * Through this app's own `/api` proxy, like every other browser call, so the
 * API's origin never reaches the bundle. `navigator.sendBeacon` first, because
 * it survives the page being navigated away from — an add-to-bag followed by a
 * tap on the bag is precisely the moment a plain fetch gets cancelled — and a
 * `keepalive` fetch where there is no beacon. Every failure is swallowed:
 * the API answers 204 even to a malformed event, because collection must never
 * fail a page, and this side keeps the same promise.
 */

export type CollectEventType =
  | "PRODUCT_VIEW"
  | "VARIANT_VIEW"
  | "BRAND_VIEW"
  | "SEARCH"
  | "SEARCH_ZERO_RESULT"
  | "CART_ADD"
  | "CART_REMOVE"
  | "CHECKOUT_START";

/** What a call site knows about the thing that happened. */
export type TrackInput = {
  type: CollectEventType;
  brandId?: string;
  productId?: string;
  variantId?: string;
  searchTerm?: string;
  metadata?: Record<string, string | number | boolean | null>;
};

/**
 * Where the tab came from, captured on its first event. First-touch on
 * purpose: a campaign link that brought somebody in is still the reason for
 * the add-to-bag three pages later, and resending the landing on every event
 * lets the API credit it without keeping any state of its own.
 */
export type Attribution = {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  referrerHost?: string;
  landingPath?: string;
};

/** The body, exactly as `collectEventSchema` accepts it. */
export type CollectEvent = TrackInput & Attribution & { path?: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Seven or more digits in a row, with the usual separators, or an @. */
const LOOKS_PERSONAL = /@|(?:\d[\s\-().]*){7,}/;

/**
 * A string the API will accept: trimmed, under its cap, and absent rather than
 * empty. The API trims too, but an empty string is still a value there, and
 * an all-space field would be stored as "".
 */
const text = (value: string | undefined, max: number): string | undefined => {
  const trimmed = value?.trim();
  return trimmed ? trimmed.slice(0, max) : undefined;
};

/** Ids go only when they are uuids, because anything else fails the event. */
const id = (value: string | undefined): string | undefined =>
  value && UUID.test(value) ? value : undefined;

/**
 * The attribution a landing carries, read off its own address and referrer.
 *
 * `referrerHost` only for another site: this app's own host as a referrer is a
 * navigation inside the storefront, and would credit every visit to itself.
 */
export function attributionFrom(location: {
  pathname: string;
  search: string;
  host: string;
  referrer: string;
}): Attribution {
  const params = new URLSearchParams(location.search);
  let referrerHost: string | undefined;
  try {
    const host = location.referrer ? new URL(location.referrer).host : "";
    referrerHost = host && host !== location.host ? host : undefined;
  } catch {
    referrerHost = undefined;
  }

  return {
    utmSource: text(params.get("utm_source") ?? undefined, 200),
    utmMedium: text(params.get("utm_medium") ?? undefined, 200),
    utmCampaign: text(params.get("utm_campaign") ?? undefined, 200),
    utmContent: text(params.get("utm_content") ?? undefined, 200),
    utmTerm: text(params.get("utm_term") ?? undefined, 200),
    referrerHost: text(referrerHost, 200),
    landingPath: text(location.pathname, 500),
  };
}

/**
 * The whitelist. Pure, so the one piece with rules in it can be tested
 * without a browser.
 */
export function buildCollectEvent(
  input: TrackInput,
  path: string,
  attribution: Attribution
): CollectEvent {
  const searchTerm = text(input.searchTerm, 200);

  const event: CollectEvent = {
    type: input.type,
    brandId: id(input.brandId),
    productId: id(input.productId),
    variantId: id(input.variantId),
    searchTerm: searchTerm && !LOOKS_PERSONAL.test(searchTerm) ? searchTerm : undefined,
    // The path only — see the note at the top about query strings.
    path: text(path.split(/[?#]/)[0], 500),
    metadata: input.metadata && Object.keys(input.metadata).length > 0 ? input.metadata : undefined,
    ...attribution,
  };

  // Absent, never `undefined`: JSON drops those anyway, but a test comparing
  // the object should see exactly what goes on the wire.
  for (const key of Object.keys(event) as (keyof CollectEvent)[]) {
    if (event[key] === undefined) delete event[key];
  }
  return event;
}

const LANDING_KEY = "lq:landing";

/** First-touch for this tab, or the current page when storage is refused. */
function landing(): Attribution {
  const current = () =>
    attributionFrom({
      pathname: window.location.pathname,
      search: window.location.search,
      host: window.location.host,
      referrer: document.referrer,
    });

  try {
    const stored = window.sessionStorage.getItem(LANDING_KEY);
    if (stored) return JSON.parse(stored) as Attribution;
    const first = current();
    window.sessionStorage.setItem(LANDING_KEY, JSON.stringify(first));
    return first;
  } catch {
    // Private mode, a full quota, or a value somebody edited by hand.
    return current();
  }
}

/** Fire and forget. Never throws, never awaits, does nothing on the server. */
export function track(input: TrackInput): void {
  if (typeof window === "undefined") return;

  try {
    const body = JSON.stringify(buildCollectEvent(input, window.location.pathname, landing()));
    const url = "/api/v1/collect";

    // A Blob, so the beacon goes out as application/json: the API's body
    // parser would read a bare string as text/plain and see no fields at all.
    const blob = new Blob([body], { type: "application/json" });
    if (typeof navigator.sendBeacon === "function" && navigator.sendBeacon(url, blob)) return;

    void fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
      credentials: "same-origin",
    }).catch(() => undefined);
  } catch {
    // Collection must never fail a page.
  }
}
