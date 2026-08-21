"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  cartSummarySchema,
  type CartSummary,
} from "@loqal/contracts/cart.contract";
import type { DeliveryMethod } from "@loqal/contracts/enums";

import { api } from "./api";

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

export function useCart() {
  return useQuery({
    queryKey: CART_KEY,
    queryFn: ({ signal }) => api.get(cartSummarySchema, "/v1/cart", { signal }),
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
  run: (args: TArgs) => Promise<CartSummary>
) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: run,
    onSuccess: (summary) => client.setQueryData(CART_KEY, summary),
    /**
     * On failure the cache is left ALONE rather than rolled back to a guess.
     * There is no optimistic write to undo: the count comes from the server on
     * every call, so a failed add simply means the badge never moved. A screen
     * shows the error; it does not invent a number.
     */
  });
}

export function useAddToBag() {
  return useCartWrite<{ variantId: string; quantity: number }>((body) =>
    api.post(cartSummarySchema, "/v1/cart/items", body)
  );
}

export function useUpdateBagLine() {
  return useCartWrite<{ variantId: string; quantity: number }>(({ variantId, quantity }) =>
    api.put(cartSummarySchema, `/v1/cart/items/${encodeURIComponent(variantId)}`, {
      quantity,
    })
  );
}

export function useRemoveBagLine() {
  return useCartWrite<{ variantId: string }>(({ variantId }) =>
    api.delete(cartSummarySchema, `/v1/cart/items/${encodeURIComponent(variantId)}`)
  );
}

export function useSetDeliveryMethod() {
  return useCartWrite<{ deliveryMethod: DeliveryMethod }>((body) =>
    api.put(cartSummarySchema, "/v1/cart/delivery-method", body)
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
    queryFn: ({ signal }) => api.get(cartSummarySchema, "/v1/cart", { signal }),
    staleTime: 0,
    select: (summary) => summary.itemCount,
  });
  return data ?? 0;
}
