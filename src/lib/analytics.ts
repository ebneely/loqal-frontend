/**
 * The storefront's half of the analytics beacon (ebneely/loqal-frontend#11).
 *
 * `POST /v1/collect` through the BFF, with the event shape the backend's
 * `collectEventSchema` accepts (loqal-backend src/modules/analytics/contracts).
 * The backend's own privacy rules decide everything about WHO: no cookie, the
 * IP is turned into a region and dropped, and the visitor id is a hash under a
 * salt that changes daily. So this sends no identity at all — no user id, no
 * phone, no email, no query string (an order link carries a phone in it).
 *
 * `page_view` from the issue has no type on the backend (its enum has none),
 * so it is not sent; PRODUCT_VIEW, BRAND_VIEW, SEARCH, CART_ADD and
 * CHECKOUT_START are.
 *
 * Never awaited and never throws: collection must not fail a page. A browser
 * that says Do Not Track or Global Privacy Control sends nothing.
 */
export type AnalyticsEvent = {
  type:
    | "PRODUCT_VIEW"
    | "VARIANT_VIEW"
    | "BRAND_VIEW"
    | "SEARCH"
    | "SEARCH_ZERO_RESULT"
    | "CART_ADD"
    | "CART_REMOVE"
    | "CHECKOUT_START";
  brandId?: string;
  productId?: string;
  variantId?: string;
  searchTerm?: string;
  metadata?: Record<string, string | number | boolean | null>;
};

const ENDPOINT = "/api/v1/collect";
const LANDING_KEY = "lq:landing";

/** A typed term that looks like a phone number or an email is not sent. */
export function safeSearchTerm(term: string): string | undefined {
  const clean = term.trim().slice(0, 200);
  if (!clean) return undefined;
  if (/\S+@\S+/.test(clean) || /\d{6,}/.test(clean.replace(/[\s-]/g, ""))) return undefined;
  return clean;
}

function optedOut(): boolean {
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
  return nav.doNotTrack === "1" || nav.globalPrivacyControl === true;
}

/** Campaign tags and where the visit came from: the session's first page. */
function attribution(): Record<string, string> {
  const out: Record<string, string> = {};
  const params = new URLSearchParams(window.location.search);
  for (const [param, field] of [
    ["utm_source", "utmSource"],
    ["utm_medium", "utmMedium"],
    ["utm_campaign", "utmCampaign"],
    ["utm_content", "utmContent"],
    ["utm_term", "utmTerm"],
  ] as const) {
    const value = params.get(param);
    if (value) out[field] = value.slice(0, 200);
  }
  try {
    const referrer = document.referrer ? new URL(document.referrer).host : "";
    if (referrer && referrer !== window.location.host) out.referrerHost = referrer.slice(0, 200);
    let landing = window.sessionStorage.getItem(LANDING_KEY);
    if (!landing) {
      landing = window.location.pathname.slice(0, 500);
      window.sessionStorage.setItem(LANDING_KEY, landing);
    }
    out.landingPath = landing;
  } catch {
    /* No referrer or no session storage: send without them. */
  }
  return out;
}

export function track(event: AnalyticsEvent): void {
  if (typeof window === "undefined") return;
  try {
    if (optedOut()) return;
    const body = JSON.stringify({
      ...event,
      path: window.location.pathname.slice(0, 500),
      ...attribution(),
    });
    const sent =
      typeof navigator.sendBeacon === "function" &&
      navigator.sendBeacon(ENDPOINT, new Blob([body], { type: "application/json" }));
    if (!sent) {
      void fetch(ENDPOINT, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body,
        keepalive: true,
        credentials: "same-origin",
      }).catch(() => undefined);
    }
  } catch {
    /* Collection never fails a page. */
  }
}
