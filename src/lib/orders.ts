"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";

import {
  createOrderResultSchema,
  orderActionOkSchema,
  orderPaymentLinkSchema,
  requestReturnResultSchema,
  shopperOrderSchema,
  type CreateOrderBody,
  type CreateOrderResult,
  type RequestReturnBody,
  type RequestReturnResult,
  type ResendOrderVerificationBody,
  type VerifyOrderCodeBody,
} from "@loqal/contracts/storefront.contract";

import { ApiError, api } from "./api";
import { CART_KEY } from "./cart";

/**
 * Orders: one lookup, one create, one recovery.
 *
 * NOTHING HERE IS PREFETCHED ON THE SERVER and nothing is cached beyond the
 * tab. An order is one shopper's own, the order number plus the phone IS the
 * credential on the lookup route, and an ISR entry keyed by an order number
 * would be a stranger's order served from the edge. That is why this file is
 * `"use client"` and sits beside `lib/cart.ts` rather than `lib/catalog.ts`.
 */

/* ══════════════════════════════════════════════════════════════════════════
   The two headers `POST /v1/orders` will not run without.
   ══════════════════════════════════════════════════════════════════════════ */

/**
 * A UUID, from the platform where the platform has one.
 *
 * `crypto.randomUUID` needs a secure context — it is undefined on plain http
 * over a LAN address, which is exactly how this app is opened on a real phone
 * during development. A checkout that throws there would be a checkout that
 * only works on the machine that wrote it, so there is a fallback, and it is
 * `getRandomValues` rather than `Math.random`: an idempotency key that
 * collides between two shoppers replays one person's order to another.
 */
function uuid(): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();

  const bytes = new Uint8Array(16);
  c.getRandomValues(bytes);
  // Version 4, variant 10xx — the two fields a v4 UUID is required to pin.
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

const GUEST_SESSION_STORAGE_KEY = "loqal_guest_session";

/**
 * The anonymous shopper's own id, stable for as long as the browser keeps it.
 *
 * `POST /v1/orders` answers 400 without `X-Guest-Session-Id` when nobody is
 * signed in — it is how the order is bound to a shopper who has no user row —
 * so it is minted here once and kept. localStorage rather than state: a guest
 * who pays on Paymob leaves this origin entirely and comes back to a fresh
 * document, and an id that lived in memory would be a different guest by then.
 *
 * Wrapped, because localStorage THROWS rather than returning null in a
 * hardened browser or a third-party frame. A shopper with storage blocked
 * still gets a working checkout, with a fresh id per attempt.
 */
export function guestSessionId(): string {
  try {
    const existing = window.localStorage.getItem(GUEST_SESSION_STORAGE_KEY);
    if (existing) return existing;
    const minted = uuid();
    window.localStorage.setItem(GUEST_SESSION_STORAGE_KEY, minted);
    return minted;
  } catch {
    return uuid();
  }
}

/**
 * ONE IDEMPOTENCY KEY PER CHECKOUT, NOT PER CLICK.
 *
 * This is the difference between a shopper who retries and a shopper who is
 * charged twice. The dangerous case is not a 400 — that creates nothing — it
 * is a request that reaches the API, writes the order, and then loses the
 * response to a dropped connection on mobile data. The screen sees a failure;
 * the order exists. With a key that survives the failure, pressing the button
 * again REPLAYS: the API answers with the original order and `replayed: true`,
 * and the shopper lands on the order they already have. Minting a new key on
 * that second press would place a second order for the same bag.
 *
 * A ref, so it is stable across every re-render of the form, and it is only
 * dropped once an order has actually come back — see `reset` below, which the
 * checkout screen never calls on the happy path because it navigates away.
 */
export function useCheckoutKey() {
  const key = useRef<string | null>(null);
  return {
    get current(): string {
      if (key.current === null) key.current = uuid();
      return key.current;
    },
    reset() {
      key.current = null;
    },
  };
}

/* ══════════════════════════════════════════════════════════════════════════
   Reads.
   ══════════════════════════════════════════════════════════════════════════ */

export const orderKeys = {
  lookup: (orderNumber: string, phone: string) =>
    ["order-lookup", orderNumber, phone] as const,
};

/**
 * `GET /v1/orders/lookup/:orderNumber?phone=` — the anonymous read.
 *
 * The order number and the phone together ARE the credential, which is why the
 * API answers 404 and never 403 on a mismatch: a 403 would confirm that an
 * order with that number exists to anyone who can type one. The screen must
 * therefore keep the two possibilities together in one sentence and never
 * claim which one happened.
 *
 * Polled while the tab is open. A shopper on this screen is watching for a
 * shop to move its half along, and the alternative is a manual refresh button
 * on a page whose entire subject is something changing without them.
 */
export function useOrderLookup(orderNumber: string, phone: string) {
  return useQuery({
    queryKey: orderKeys.lookup(orderNumber, phone),
    queryFn: ({ signal }) =>
      api.get(shopperOrderSchema, `/v1/orders/lookup/${encodeURIComponent(orderNumber)}`, {
        query: { phone },
        signal,
      }),
    enabled: orderNumber.length > 0 && phone.length > 0,
    staleTime: 0,
    refetchInterval: 60_000,
    /* A 404 is an answer, not an outage: the pair does not open an order and
       retrying cannot change that. Retrying it would also hammer a lookup that
       is the one anonymous, credential-checking route in the API. */
    retry: (failureCount, error) =>
      error instanceof ApiError && error.isNotFound ? false : failureCount < 2,
  });
}

/* ══════════════════════════════════════════════════════════════════════════
   Writes.
   ══════════════════════════════════════════════════════════════════════════ */

/**
 * `POST /v1/orders`.
 *
 * The body carries no prices, no cart id and no delivery method — the server
 * reprices the cart from the primary database and reads the method off
 * `PUT /v1/cart/delivery-method`, which the bag already wrote. See
 * `createOrderBodySchema`.
 *
 * The cart cache is cleared here for CASH, WALLET and INSTAPAY — the API
 * empties the server-side cart after the commit (`order-checkout.service.ts`),
 * and with `refetchOnWindowFocus` off the tab-bar badge would otherwise keep
 * counting a bag that no longer exists until a hard reload. NOT for CARD or
 * VALU: the shopper is leaving for Paymob, and a bag emptied before that page
 * loads means a shopper who backs out has lost their basket and their order both.
 */
export function useCreateOrder() {
  const client = useQueryClient();
  return useMutation<
    CreateOrderResult,
    Error,
    { body: CreateOrderBody; idempotencyKey: string; anonymous: boolean }
  >({
    mutationFn: ({ body, idempotencyKey, anonymous }) => {
      const headers: Record<string, string> = { "Idempotency-Key": idempotencyKey };
      if (anonymous) headers["X-Guest-Session-Id"] = guestSessionId();
      return api.post(createOrderResultSchema, "/v1/orders", body, { headers });
    },
    onSuccess: (_result, { body }) => {
      // CARD and VALU keep the cache: a Paymob redirect follows, and a back-out
      // must still find the bag — see the comment above.
      if (body.paymentMethod !== "CARD" && body.paymentMethod !== "VALU") {
        void client.invalidateQueries({ queryKey: CART_KEY });
      }
    },
    /* No retry, at any count. This is the one call in the app that spends
       money, and a transport-level retry is a second order the shopper did not
       ask for. The retry belongs to the shopper, with the same idempotency key
       in hand — see `useCheckoutKey`. */
    retry: false,
  });
}

/**
 * `POST /v1/orders/:orderId/payment-link` — the only way back to a payment
 * page.
 *
 * There is no `payments[]` on an order and no way to re-read a `checkoutUrl`
 * with a GET, so when Paymob fails after the order row is written this is the
 * whole recovery. It is called from two places: immediately at checkout, when
 * a card order comes back with a null `checkoutUrl`, and again from the order
 * screen, where a half still sitting in PENDING_PAYMENT is the only evidence
 * the storefront has that money is still owed.
 *
 * NO CREDENTIAL TRAVELS, ON PURPOSE: the route is `@AllowAnonymous` and reads
 * nothing but the path (`orders.public.controller.ts`) — the unguessable order
 * id IS the credential, exactly as it is for the checkout response that
 * produced it. It takes no body, no phone and no X-Guest-Session-Id, so
 * sending any of them would be an invention the API ignores.
 */
export function usePaymentLink() {
  return useMutation<string | null, Error, { orderId: string }>({
    mutationFn: async ({ orderId }) => {
      const result = await api.post(
        orderPaymentLinkSchema,
        `/v1/orders/${encodeURIComponent(orderId)}/payment-link`
      );
      return result.checkoutUrl;
    },
    retry: false,
  });
}

/**
 * `POST /v1/orders/:orderId/verification/verify` — checks a cash/wallet
 * order's phone code.
 *
 * `orderNumber` and `phone` travel in the BODY, not the path — the same
 * credential `useOrderLookup` already reads off this page's own URL. There is
 * no signed-in variant here because this page has none: every read and write
 * on it authorises the one way, guest or not.
 */
export function useVerifyOrderCode() {
  return useMutation<{ ok: true }, Error, { orderId: string } & VerifyOrderCodeBody>({
    mutationFn: ({ orderId, ...body }) =>
      api.post(
        orderActionOkSchema,
        `/v1/orders/${encodeURIComponent(orderId)}/verification/verify`,
        body
      ),
    retry: false,
  });
}

/**
 * `POST /v1/orders/:orderId/verification` — asks for a fresh code.
 *
 * The API rate-limits this itself (`OrderVerificationService.resend`'s
 * cooldown), so there is nothing to throttle here — a refused resend comes
 * back as a 409 the caller reads and shows.
 */
export function useResendOrderVerification() {
  return useMutation<{ ok: true }, Error, { orderId: string } & ResendOrderVerificationBody>({
    mutationFn: ({ orderId, ...body }) =>
      api.post(
        orderActionOkSchema,
        `/v1/orders/${encodeURIComponent(orderId)}/verification`,
        body
      ),
    retry: false,
  });
}

/**
 * `POST /v1/orders/:orderId/returns` — opens a return on one brand order.
 *
 * The window and the one-open-return rule are the API's, not this file's —
 * see `ReturnsService.request`. A refusal comes back as a 409 whose message
 * names the actual reason, and the caller shows that reason rather than
 * re-deriving it.
 */
export function useRequestReturn() {
  return useMutation<RequestReturnResult, Error, { orderId: string; body: RequestReturnBody }>({
    mutationFn: ({ orderId, body }) =>
      api.post(requestReturnResultSchema, `/v1/orders/${encodeURIComponent(orderId)}/returns`, body),
    retry: false,
  });
}
