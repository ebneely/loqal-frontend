"use client";

import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { shopperOrderSchema } from "@loqal/contracts/storefront.contract";
import { api } from "./api";

/**
 * What a signed-in shopper has: their orders, and their saved addresses.
 *
 * Both are SESSION reads — never cached, never fetched on the server with a
 * shared key — and both are only asked for when there is a session. A guest
 * calling either would get a 403, and a screen that fires requests it knows
 * will be refused is a screen that shows an error for no reason.
 */

// ── My orders ───────────────────────────────────────────────────────────────

/**
 * Includes guest orders placed before the account existed, matched on a phone
 * or email the account has verified — the API decides which, and only ever
 * from verified contacts.
 */
export const myOrdersPageSchema = z
  .object({
    items: z.array(shopperOrderSchema),
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    perPage: z.number().int().positive(),
  })
  .strict();

export type MyOrdersPage = z.infer<typeof myOrdersPageSchema>;

export const accountKeys = {
  myOrders: (page: number) => ["my-orders", page] as const,
  addresses: () => ["addresses"] as const,
};

export function useMyOrders(enabled: boolean, page = 1) {
  return useQuery({
    queryKey: accountKeys.myOrders(page),
    queryFn: () =>
      api.get(myOrdersPageSchema, "/v1/orders/mine", {
        query: { page, perPage: 20 },
      }),
    enabled,
    staleTime: 30 * 1000,
  });
}

// ── Saved addresses ─────────────────────────────────────────────────────────

/** Strict, like every contract here: a column the API grows fails loudly. */
export const savedAddressSchema = z
  .object({
    id: z.string().uuid(),
    customerId: z.string().uuid(),
    label: z.string().nullable(),
    fullName: z.string().nullable(),
    governorate: z.string(),
    city: z.string(),
    street: z.string(),
    building: z.string().nullable(),
    notes: z.string().nullable(),
    phone: z.string(),
    isDefault: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .strict();

export type SavedAddress = z.infer<typeof savedAddressSchema>;

/** Exactly what checkout sends as `shippingAddress`, so one fills the other. */
export type AddressInput = {
  label?: string;
  fullName: string;
  phone: string;
  governorate: string;
  city: string;
  street: string;
  building?: string;
  notes?: string;
  isDefault?: boolean;
};

export function useAddresses(enabled: boolean) {
  return useQuery({
    queryKey: accountKeys.addresses(),
    queryFn: () => api.get(z.array(savedAddressSchema), "/v1/addresses"),
    enabled,
    staleTime: 60 * 1000,
  });
}

/** Every write refetches the list: the default moves server-side. */
function useAddressWrite<TVars>(write: (vars: TVars) => Promise<unknown>) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: write,
    onSuccess: () => client.invalidateQueries({ queryKey: accountKeys.addresses() }),
  });
}

export function useCreateAddress() {
  return useAddressWrite((body: AddressInput) =>
    api.post(savedAddressSchema, "/v1/addresses", body)
  );
}

export function useMakeDefaultAddress() {
  return useAddressWrite((id: string) =>
    api.patch(savedAddressSchema, `/v1/addresses/${encodeURIComponent(id)}`, {
      isDefault: true,
    })
  );
}

export function useDeleteAddress() {
  return useAddressWrite((id: string) =>
    api.delete(z.unknown(), `/v1/addresses/${encodeURIComponent(id)}`)
  );
}
