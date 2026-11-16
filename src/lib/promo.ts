"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";

import type { CartSummary } from "@loqal/contracts/cart.contract";
import { moneySchema } from "@loqal/contracts/contracts";

import { api } from "./api";
import type { Locale } from "./locale";
import { guestSessionId } from "./orders";
import { cartStamp, promoOutcome } from "./promo-rules";

/**
 * Promo codes at checkout (TODO/06-plan-talabat.md, "Promo codes").
 *
 * `POST /v1/promo-codes/validate { code }` prices the code against the
 * caller's CURRENT cart. Production may not have the route yet, so every
 * failure is soft: the shopper reads one sentence and can still order without
 * the code, which is only sent with the order once the API has priced it.
 * The rules (messages, the keep-or-drop decision) are in `promo-rules.ts`.
 */
export const promoValidationSchema = z
  .object({
    code: z.string(),
    discountTotal: moneySchema,
    perBrand: z
      .array(z.object({ brandId: z.string(), amount: moneySchema }).strict())
      .default([]),
  })
  .strict();
export type PromoValidation = z.infer<typeof promoValidationSchema>;

/**
 * The checkout's promo state. A query keyed on the code AND the bag's stamp,
 * so a changed bag re-validates on its own with no effect to keep in step.
 */
export function usePromo(cart: CartSummary | undefined, locale: Locale) {
  const [input, setInput] = useState("");
  const [code, setCode] = useState<string | null>(null);
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const stamp = cart ? cartStamp(cart) : "";

  const query = useQuery({
    queryKey: ["promo-validate", code, stamp] as const,
    queryFn: ({ signal }) =>
      api.post(promoValidationSchema, "/v1/promo-codes/validate", { code }, {
        signal,
        // The API prices the caller's cart, and a guest's cart is this header.
        headers: { "X-Guest-Session-Id": guestSessionId() },
      }),
    enabled: code !== null && cart !== undefined,
    staleTime: Infinity,
    retry: false,
    // While a changed bag re-prices, the last answer for the SAME code stands.
    placeholderData: (previous, previousQuery) =>
      previousQuery?.queryKey[1] === code ? previous : undefined,
  });

  const outcome = code
    ? promoOutcome({
        code,
        result: query.data,
        error: query.isError ? query.error : undefined,
        wasApplied: appliedCode === code,
        locale,
      })
    : { applied: null, message: null };

  // Remembered during render (not in an effect) so a later drop can say why.
  if (outcome.applied && appliedCode !== code) setAppliedCode(code);

  return {
    input,
    setInput,
    applied: outcome.applied,
    message: outcome.message,
    checking: query.isFetching && !query.isPlaceholderData,
    apply: () => {
      const next = input.trim().toUpperCase();
      if (!next) return;
      if (next === code) void query.refetch();
      else setCode(next);
    },
    remove: () => {
      setCode(null);
      setAppliedCode(null);
      setInput("");
    },
    /** After the order itself refused the code: ask again, so the field says why. */
    recheck: () => void query.refetch(),
  };
}
