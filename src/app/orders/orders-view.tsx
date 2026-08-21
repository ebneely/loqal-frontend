"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useLocale } from "@/lib/locale-context";
import { Shell } from "@/components/shell";

/**
 * Finding an order.
 *
 * THIS IS A LOOKUP, NOT A LIST, and that is a backend gap rather than a design
 * choice. The API has `GET /v1/orders/:orderId` and
 * `GET /v1/orders/lookup/:orderNumber?phone=` — there is no "every order this
 * shopper placed" endpoint at all, so a signed-in order history cannot be
 * built yet however the screen is drawn.
 *
 * Lookup is what genuinely exists, and it is also what the design system's own
 * entry flow assumes: most Loqal shoppers check out as guests, and "the order
 * number plus the phone IS the credential" is the API's own comment on the
 * route. So the screen offers the thing that works, and says plainly that the
 * history does not exist rather than rendering an empty list that looks like
 * "you have never ordered".
 */
export function OrdersView() {
  const locale = useLocale();
  const router = useRouter();
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");

  const t = {
    title: locale === "ar" ? "أوردراتي" : "My orders",
    lead:
      locale === "ar"
        ? "اكتب رقم الأوردر ورقم الموبايل اللي طلبت بيه."
        : "Enter the order number and the phone you ordered with.",
    number: locale === "ar" ? "رقم الأوردر" : "Order number",
    phone: locale === "ar" ? "رقم الموبايل" : "Phone number",
    find: locale === "ar" ? "دوّر على الأوردر" : "Find the order",
    /*
      Said out loud rather than left as an empty list. A history screen that
      renders nothing tells a returning shopper they never ordered, which is
      worse than telling them the truth.
    */
    noHistory:
      locale === "ar"
        ? "لسه مفيش سجل أوردرات — الأوردر بيتفتح برقمه ورقم الموبايل."
        : "There is no order history yet — an order is opened by its number and phone.",
  };

  return (
    <Shell title={t.title}>
      <div className="lq-wrap lq-pad">
        <section className="lq-sec">
          <p className="lq-hint">{t.lead}</p>

          <form
            className="lq-sec"
            onSubmit={(event) => {
              event.preventDefault();
              const trimmed = orderNumber.trim();
              if (!trimmed || !phone.trim()) return;
              // A navigation rather than a fetch: the order screen owns the
              // read, so the result gets its own URL a shopper can reopen or
              // send to somebody. Soft, because nothing about the identity
              // changed — only the address.
              router.push(
                `/orders/${encodeURIComponent(trimmed)}?phone=${encodeURIComponent(phone.trim())}`
              );
            }}
          >
            <label className="lq-field">
              <span className="lq-label">{t.number}</span>
              <input
                className="lq-input"
                value={orderNumber}
                onChange={(event) => setOrderNumber(event.target.value)}
                /* Readable over the phone — LQ-4821-7730 — so it is typed, not
                   scanned, and the keyboard should not autocorrect it. */
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck={false}
                placeholder="LQ-0000-0000"
                required
              />
            </label>

            <label className="lq-field">
              <span className="lq-label">{t.phone}</span>
              <input
                className="lq-input"
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="01000000000"
                required
              />
            </label>

            <button type="submit" className="lq-btn lq-btn--primary lq-btn--lg lq-btn--block">
              {t.find}
            </button>
          </form>

          <p className="lq-hint">{t.noHistory}</p>
        </section>
      </div>
    </Shell>
  );
}
