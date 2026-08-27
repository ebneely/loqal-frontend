"use client";

import type { CSSProperties } from "react";

import type { CartSummary } from "@loqal/contracts/cart.contract";
import type { DeliveryMethod } from "@loqal/contracts/enums";
/* The routes that are actually live. SHIPPING_SERVICE is modelled and has no
   courier behind it, so it must be unrepresentable on screen — imported rather
   than retyped, so switching it on stays a data change. */
import { LIVE_DELIVERY_METHODS } from "@loqal/contracts/brand.contract";
import { useSetDeliveryMethod } from "@/lib/cart";
import type { Locale } from "@/lib/locale";

/* ══════════════════════════════════════════════════════════════════════════
   Choosing how it gets here.

   ONE COMPONENT, TWO SCREENS. This was inside `bag/bag-view.tsx` and checkout
   needs the same control: a shopper can reach `/checkout` with no method
   chosen, and the alternative to offering it there is sending them back to the
   bag to press one radio. The second copy is how a fix gets lost, so there is
   one and both screens import it.

   ONE CHOICE FOR THE WHOLE BASKET, not one per shop, and that is the API's
   shape rather than a simplification: `availableDeliveryMethods` is the
   INTERSECTION across every shop present, because the basket ships as one
   decision. A method only one shop offers is not offered at all — which is
   also why the empty case below is a real state and not a defect.

   SHIPPING_SERVICE IS FILTERED OUT AND MUST STAY FILTERED OUT. It is modelled
   end to end and has no courier contract behind it; brand.contract.ts says no
   brand may carry it and no UI may render it. `LIVE_DELIVERY_METHODS` is that
   list, imported rather than retyped, so switching the route on is a data
   change here too.

   Radios rather than a native <select>: the OS wheel cannot be styled, cannot
   carry a second line of Arabic, and looks like a different product on every
   Android skin.
   ══════════════════════════════════════════════════════════════════════════ */

export function DeliveryPicker({
  cart,
  locale,
}: {
  cart: CartSummary;
  locale: Locale;
}) {
  const setMethod = useSetDeliveryMethod();
  const t = (ar: string, en: string) => (locale === "ar" ? ar : en);

  const options = cart.availableDeliveryMethods.filter((method) =>
    (LIVE_DELIVERY_METHODS as readonly DeliveryMethod[]).includes(method)
  );

  return (
    <div style={STACK}>
      <span className="lq-hint">{t("طريقة التوصيل", "Delivery method")}</span>

      {options.length === 0 ? (
        /* Says WHY rather than showing an empty box. The shopper can act on
           this — dropping one shop can put a method back on the table. */
        <p className="lq-hint">
          {t(
            "المحلات اللي في السلة مفيش بينها طريقة توصيل مشتركة. شيل محل عشان تكمّل، أو اطلب من كل محل لوحده.",
            "The shops in your bag share no delivery method. Remove one to continue, or order from each shop separately."
          )}
        </p>
      ) : (
        <div role="radiogroup" aria-label={t("طريقة التوصيل", "Delivery method")} style={STACK}>
          {options.map((method) => {
            const chosen = cart.deliveryMethod === method;
            return (
              <button
                key={method}
                type="button"
                role="radio"
                aria-checked={chosen}
                className="lq-pay"
                disabled={setMethod.isPending}
                onClick={() => {
                  /* Already the answer — a second write would spend a round
                     trip on Egyptian mobile data to change nothing. */
                  if (chosen || setMethod.isPending) return;
                  setMethod.mutate({ deliveryMethod: method });
                }}
              >
                <span className="lq-pay__radio" aria-hidden="true" />
                <span className="lq-pay__body">
                  <span className="lq-pay__title">{deliveryLabel(method, locale)}</span>
                  <span className="lq-pay__note">{deliveryNote(method, locale)}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}

      {setMethod.isError ? (
        <p className="lq-hint lq-hint--error" role="alert">
          {t(
            "مش قادرين نحفظ طريقة التوصيل دلوقتي. جرّب تاني.",
            "We could not save the delivery method. Try again."
          )}
        </p>
      ) : null}
    </div>
  );
}

/**
 * What each route MEANS for the shopper, which the enum name does not say.
 *
 * The rider line is the product's own rule and the reason checkout has a rider
 * step at all: the shop books the courier, not Loqal.
 */
export function deliveryNote(method: DeliveryMethod, locale: Locale): string {
  const notes: Record<DeliveryMethod, [string, string]> = {
    RIDER_PER_BRAND: [
      "كل محل بيطلب مندوب لنصّه، فمصاريف التوصيل بتتحسب لكل محل.",
      "Each shop books a rider for its own half, so delivery is charged per shop.",
    ],
    SHIPPING_SERVICE: ["", ""],
    BRAND_OWN_DELIVERY: [
      "المحل بيوصّل بنفسه. غالبًا أسرع، وبيشتغل جوّه منطقة المحل بس.",
      "The shop delivers itself. Usually faster, and only inside its own area.",
    ],
  };
  return notes[method][locale === "ar" ? 0 : 1];
}

/** The shopper reads a method, not an enum. */
export function deliveryLabel(method: DeliveryMethod, locale: Locale): string {
  const labels: Record<DeliveryMethod, [string, string]> = {
    RIDER_PER_BRAND: ["مندوب من المحل", "A rider from the shop"],
    SHIPPING_SERVICE: ["شركة شحن", "A shipping company"],
    BRAND_OWN_DELIVERY: ["توصيل المحل بنفسه", "The shop's own delivery"],
  };
  return labels[method][locale === "ar" ? 0 : 1];
}

/* Still inline where the stack is NOT a cart line body. `.lq-line__body` is the
   same three declarations but it is named for the cart line and only belongs
   there. */
const STACK: CSSProperties = {
  display: "grid",
  gap: "var(--space-1)",
  minInlineSize: 0,
};
