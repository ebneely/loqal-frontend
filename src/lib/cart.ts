"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  cartSummarySchema,
  type CartSummary,
} from "@loqal/contracts/cart.contract";
import type { DeliveryMethod } from "@loqal/contracts/enums";

import { track } from "./analytics";
import { api } from "./api";
import { guestSessionId } from "./orders";

/**
 * The bag: one query, four mutations.
 *
 * NOTHING HERE IS CACHED ON THE SERVER and nothing is prefetched in an RSC. The
 * bag is keyed to a session cookie, so an ISR entry for it would be one
 * shopper's basket served to the next visitor. That is the whole reason this
 * file is `"use client"` and lives apart from lib/catalog.ts.
 *
 * Every mutation answers with the WHOLE recomputed summary — the API reprices
 * from the primary database on each call — so the cache is replaced with the
 * response rather than invalidated and refetched. That is one round trip
 * instead of two, and it removes the window where the badge and the bag
 * disagree.
 */

export const CART_KEY = ["cart"] as const;

/**
 * EVERY cart request carries `X-Guest-Session-Id`, signed in or not.
 *
 * `CartOwnerGuard` on the API refuses any cart call with a 400 —
 * "X-Guest-Session-Id must be a client-generated UUID when there is no
 * signed-in session" — when the header is missing and nobody is signed in.
 * Without it a guest has no bag at all: the read 400s, all four writes 400,
 * and the badge in the chrome is permanently zero.
 *
 * Sent UNCONDITIONALLY rather than only when anonymous, and that is safe by
 * the guard's own rule: a signed-in session wins over the header, so a stale
 * guest id in localStorage cannot reach an account basket. Deciding
 * "anonymous" here would mean reading the session on every cart call to
 * answer a question the server already answers better.
 */
const guestHeaders = (): Record<string, string> => ({
  "X-Guest-Session-Id": guestSessionId(),
});

export function useCart() {
  return useQuery({
    queryKey: CART_KEY,
    queryFn: ({ signal }) => api.get(cartSummarySchema, "/v1/cart", { signal, headers: guestHeaders() }),
    /**
     * Zero, unlike the catalogue's 60s. A bag is the one thing a shopper edits
     * in another tab, and showing a stale one at checkout is how somebody pays
     * for a quantity they already changed.
     */
    staleTime: 0,
  });
}

/** Replace the cache outright — see the note at the top of the file. */
function useCartWrite<TArgs>(
  run: (args: TArgs) => Promise<CartSummary>,
  /** Anything else that should happen once the API has said yes. */
  after?: (summary: CartSummary, args: TArgs) => void
) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: run,
    onSuccess: (summary, args) => {
      client.setQueryData(CART_KEY, summary);
      after?.(summary, args);
    },
    /**
     * On failure the cache is left ALONE rather than rolled back to a guess.
     * There is no optimistic write to undo: the count comes from the server on
     * every call, so a failed add simply means the badge never moved. A screen
     * shows the error; it does not invent a number.
     */
  });
}

/**
 * The add, and its analytics event once it has SUCCEEDED — an add the API
 * refused did not put anything in a bag, and counting it would inflate the
 * funnel with exactly the failures it exists to show.
 *
 * The product and shop ids come off the returned line rather than from the
 * caller: the summary already says which product the variant belongs to, so
 * no screen has to thread them through.
 */
export function useAddToBag() {
  return useCartWrite<{ variantId: string; quantity: number }>(
    (body) =>
      api.post(cartSummarySchema, "/v1/cart/items", body, {
        headers: guestHeaders(),
      }),
    (summary, { variantId, quantity }) => {
      const line = summary.brands
        .flatMap((brand) => brand.items)
        .find((item) => item.variantId === variantId);
      track({
        type: "CART_ADD",
        variantId,
        productId: line?.productId,
        brandId: line?.brandId,
        metadata: { quantity },
      });
    }
  );
}

export function useUpdateBagLine() {
  return useCartWrite<{ variantId: string; quantity: number }>(({ variantId, quantity }) =>
    api.put(
      cartSummarySchema,
      `/v1/cart/items/${encodeURIComponent(variantId)}`,
      { quantity },
      { headers: guestHeaders() }
    )
  );
}

export function useRemoveBagLine() {
  return useCartWrite<{ variantId: string }>(({ variantId }) =>
    api.delete(cartSummarySchema, `/v1/cart/items/${encodeURIComponent(variantId)}`, {
      headers: guestHeaders(),
    })
  );
}

export function useSetDeliveryMethod() {
  return useCartWrite<{ deliveryMethod: DeliveryMethod }>((body) =>
    api.put(cartSummarySchema, "/v1/cart/delivery-method", body, {
      headers: guestHeaders(),
    })
  );
}

/**
 * The badge on the tab bar.
 *
 * `select` rather than a second query: it reads the same cache entry and
 * re-renders only when the count itself changes, so editing a quantity does not
 * repaint the whole shell.
 */
export function useBagCount(): number {
  const { data } = useQuery({
    queryKey: CART_KEY,
    queryFn: ({ signal }) => api.get(cartSummarySchema, "/v1/cart", { signal, headers: guestHeaders() }),
    staleTime: 0,
    select: (summary) => summary.itemCount,
  });
  return data ?? 0;
}
