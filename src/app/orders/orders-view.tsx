"use client";

import { useId, useState } from "react";

import type { BrandOrderStatus } from "@loqal/contracts/enums";
import { useLocale } from "@/lib/locale-context";
import { Shell } from "@/components/shell";
import { StatusPill } from "@/components/status-pill";

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
 *
 * ── Why there is no fabricated list ─────────────────────────────────────────
 *
 * The register wants a hairline list of orders — number, date, a status PER
 * SHOP, total. There is no endpoint behind that list, and a screen that draws
 * one anyway is drawing fiction. So the second section is the empty state
 * doing the job DESIGN.md gives it: TEACHING THE INTERFACE. It shows the real
 * `StatusPill`, keyed by the real `BrandOrderStatus` enum, and says that each
 * shop's half carries one of these on its own. It describes what will appear.
 * It never says "no orders".
 *
 * ONE STATUS PER SHOP is the thing this screen has to communicate before a
 * shopper has an order open. Brands fulfil independently — one shop can be
 * DELIVERED while its basket-mate is still PENDING_BRAND — so there is no
 * rolled-up order status anywhere in this file, and the closing line says so
 * in words rather than leaving it to be discovered.
 */

/**
 * The main path, in order, and the two states that are not on it.
 *
 * `BrandOrderStatus` values, not invented strings, so the wording and the tone
 * come from `StatusPill`'s single map. Nothing here maps a status to a colour
 * or a label; the second line is the CONSEQUENCE — what the shopper can expect
 * next — which the pill deliberately does not carry.
 */
const JOURNEY: ReadonlyArray<{ status: BrandOrderStatus; ar: string; en: string }> = [
  {
    status: "PENDING_BRAND",
    ar: "المحل بيراجع الرف قبل ما يأكد الأوردر.",
    en: "The shop checks the shelf before it confirms the order.",
  },
  {
    status: "CONFIRMED",
    ar: "القطعة موجودة، والمحل بدأ يجهّزها.",
    en: "The piece is there and the shop has started preparing it.",
  },
  {
    status: "PACKED",
    ar: "الأوردر متظبط ومستني المندوب يعدّي عليه.",
    en: "Packed, waiting for the rider to collect it.",
  },
  {
    status: "HANDED_OVER",
    ar: "المندوب ماشي بيه دلوقتي.",
    en: "The rider has it and is on the way.",
  },
  {
    status: "DELIVERED",
    ar: "وصل من المحل ده. باقي المحلات لسه على حالتها.",
    en: "This shop's half arrived. The other shops keep their own status.",
  },
];

export function OrdersView() {
  const locale = useLocale();
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  /**
   * `unavailable` is not a validation failure — the input was fine and the
   * feature is not there. See the note on `submit`.
   */
  const [error, setError] = useState<"number" | "phone" | "unavailable" | null>(null);

  const numberId = useId();
  const phoneId = useId();
  const errorId = useId();

  const t = {
    title: locale === "ar" ? "أوردراتي" : "My orders",
    lead:
      locale === "ar"
        ? "كل محل بيجهّز نصّه لوحده، وكل نص ليه حالته."
        : "Each shop prepares its own half, and each half has its own status.",
    lookup: locale === "ar" ? "افتح أوردر" : "Open an order",
    lookupHint:
      locale === "ar"
        ? "برقم الأوردر ورقم الموبايل اللي طلبت بيه. من غير حساب."
        : "By order number and the phone you ordered with. No account.",
    number: locale === "ar" ? "رقم الأوردر" : "Order number",
    numberHint:
      locale === "ar"
        ? "مكتوب في رسالة التأكيد، بالشكل ده: LQ-4821-7730"
        : "It is in your confirmation message, shaped like LQ-4821-7730",
    phone: locale === "ar" ? "رقم الموبايل" : "Phone number",
    find: locale === "ar" ? "افتح الأوردر" : "Open the order",
    numberError:
      locale === "ar"
        ? "اكتب رقم الأوردر زي ما هو في رسالة التأكيد."
        : "Enter the order number exactly as it is in your confirmation message.",
    phoneError:
      locale === "ar"
        ? "اكتب رقم الموبايل اللي طلبت بيه — 11 رقم."
        : "Enter the phone you ordered with — 11 digits.",
    /* Says what is absent and what to do instead — the shop confirmed the
       order over the phone, so the shop can still answer for it. */
    unavailable:
      locale === "ar"
        ? "فتح الأوردر بالرقم لسه مش شغال. لحد ما يشتغل، كلّم المحل اللي طلبت منه — عنده الأوردر برقمه."
        : "Opening an order by number is not live yet. Until it is, message the shop you ordered from — it has the order under the same number.",
    /* The empty state teaches. It never mentions the emptiness. */
    coming: locale === "ar" ? "اللي هيظهر لما تفتح أوردر" : "What you see when you open an order",
    comingLead:
      locale === "ar"
        ? "رقم الأوردر وتاريخه فوق، وتحته كل محل لوحده: حالته والمبلغ اللي عليه."
        : "The order number and date on top, and under it each shop on its own: its status and its own total.",
    journeyLead:
      locale === "ar"
        ? "الحالات اللي كل محل بيعدّي بيها:"
        : "The statuses each shop moves through:",
    perShop:
      locale === "ar"
        ? "لو محل اتأخر أو التوصيل فشل، ده بيبان على المحل ده لوحده — مفيش حالة واحدة بتتكلم عن الأوردر كله."
        : "If one shop is late or a delivery fails, that shows on that shop alone — no single status speaks for the whole order.",
    /*
      Said out loud rather than left as an empty list. A history screen that
      renders nothing tells a returning shopper they never ordered, which is
      worse than telling them the truth.
    */
    noHistory:
      locale === "ar"
        ? "لسه مفيش سجل بكل أوردراتك. الأوردر بيتفتح برقمه ورقم الموبايل، وده اللي بيخلي الضيف يتابع من غير ما يعمل حساب."
        : "There is no full order history yet. An order is opened by its number and phone, which is what lets a guest follow it without an account.",
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();

    const trimmedNumber = orderNumber.trim();
    if (!trimmedNumber) {
      setError("number");
      return;
    }
    /* Digits only for the check — a shopper types 0100 000 0000 or +2010… and
       the space is not the mistake we are guarding against. */
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) {
      setError("phone");
      return;
    }
    /**
     * THE LOOKUP IS NOT WIRED, AND THIS SAYS SO INSTEAD OF NAVIGATING.
     *
     * This used to `router.push('/orders/{number}?phone=')`, which is the right
     * shape — the order screen should own the read so the result gets a URL a
     * shopper can reopen or send to somebody. But that route does not exist,
     * so a correctly filled form landed on a 404: a form that fails when it
     * succeeds, which is worse than one that fails when it fails.
     *
     * Two things are missing and neither is a screen. There is no shopper-side
     * order schema anywhere in `storefront.contract.ts`, and no lookup function
     * in `lib/`. The only multi-brand order shape in the repo is
     * `adminOrderDetailSchema.brandOrders`, whose own docstring says it is
     * SUPER_ADMIN-only. Building the route first would mean inventing the
     * contract, and a guessed schema for a screen that shows somebody their
     * money is the wrong thing to guess.
     *
     * So the button reports the truth. When `GET /v1/orders/lookup/:orderNumber`
     * lands with a storefront schema behind it, this becomes the push again and
     * the `unavailable` branch goes.
     */
    setError("unavailable");
  };

  return (
    <Shell title={t.title}>
      <div className="lq-wrap lq-pad">
        <section className="lq-sec">
          <div className="lq-sec__head">
            <div>
              <h1 className="lq-phead__title">{t.title}</h1>
              <p className="lq-eyebrow">{t.lead}</p>
            </div>
          </div>

          <hr className="lq-rule" />

          {/* ── The lookup ──────────────────────────────────────────────── */}
          <div className="lq-sec__head">
            <h2 className="lq-sec__title">{t.lookup}</h2>
          </div>
          <p className="lq-hint">{t.lookupHint}</p>

          <form
            className="lq-vp lq-rv"
            onSubmit={submit}
            noValidate
            aria-describedby={error ? errorId : undefined}
          >
            <div className="lq-field">
              <label className="lq-label" htmlFor={numberId}>
                {t.number}
              </label>
              <input
                id={numberId}
                className="lq-input"
                /* Mono figure face: an order number is read out over the
                   phone, so the digits are tabular and the zero is not an O. */
                data-num
                value={orderNumber}
                onChange={(event) => {
                  setOrderNumber(event.target.value);
                  if (error === "number") setError(null);
                }}
                /* Readable over the phone — LQ-4821-7730 — so it is typed, not
                   scanned, and the keyboard should not autocorrect it. */
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck={false}
                autoComplete="off"
                placeholder="LQ-0000-0000"
                aria-invalid={error === "number"}
                aria-describedby={error === "number" ? errorId : undefined}
              />
              <p className="lq-hint">{t.numberHint}</p>
            </div>

            <div className="lq-field">
              <label className="lq-label" htmlFor={phoneId}>
                {t.phone}
              </label>
              <input
                id={phoneId}
                className="lq-input"
                data-num
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                onChange={(event) => {
                  setPhone(event.target.value);
                  if (error === "phone") setError(null);
                }}
                placeholder="01000000000"
                aria-invalid={error === "phone"}
                aria-describedby={error === "phone" ? errorId : undefined}
              />
            </div>

            {/* Inserted rather than hidden-then-shown: `role="alert"` on a node
                that ARRIVES is announced, and a `hidden` alert is dropped from
                the accessibility tree in between. It carries the specific
                failure, never a generic "check your details". */}
            {error === null ? null : (
              <p
                id={errorId}
                /* `unavailable` is NOT an error the shopper made, so it is not
                   red. Red here would blame them for a field we have not
                   built. */
                className={error === "unavailable" ? "lq-hint" : "lq-hint lq-hint--error"}
                role="alert"
              >
                {error === "number"
                  ? t.numberError
                  : error === "phone"
                    ? t.phoneError
                    : t.unavailable}
              </p>
            )}

            <button
              type="submit"
              className="lq-btn lq-btn--primary lq-btn--lg lq-btn--block"
            >
              {t.find}
            </button>
          </form>

          <hr className="lq-rule" />

          {/* ── What appears, or the shape of it while it arrives ───────── */}
              <div className="lq-sec__head">
                <h2 className="lq-sec__title">{t.coming}</h2>
              </div>
              <p className="lq-hint">{t.comingLead}</p>
              <p className="lq-hint">{t.journeyLead}</p>

              {/* The hairline stack: cells share their borders. `.lq-rows` and
                  not `.lq-cells` because this is a SEQUENCE — `.lq-cells` steps
                  to two across at 520 and three at 720, and the order of the
                  steps would stop being the order of the reading. The list
                  reset stays inline: `.lq-rows` is a grid, not a list. */}
              <ol
                className="lq-rows"
                style={{ listStyle: "none", margin: 0, padding: 0 }}
              >
                {JOURNEY.map((step, index) => (
                  /* NOT `.lq-row`. That class is a tappable destination — it
                     carries a pointer cursor and a `--raise` hover — and these
                     steps go nowhere. It also has no `flex-wrap`, and the
                     sentence beside the pill is `flex:1 1 16rem` precisely so
                     it drops to its own line on a phone. */
                  <li
                    key={step.status}
                    className="lq-rv"
                    style={
                      {
                        "--lq-d": `${index * 70}ms`,
                        display: "flex",
                        alignItems: "center",
                        gap: "var(--space-3)",
                        flexWrap: "wrap",
                        padding: "var(--space-4)",
                      } as React.CSSProperties
                    }
                  >
                    {/* The ONE map. No screen invents its own wording or tone. */}
                    <StatusPill status={step.status} locale={locale} />
                    <span
                      className="lq-hint"
                      data-bidi
                      style={{ flex: "1 1 16rem", minInlineSize: 0 }}
                    >
                      {locale === "ar" ? step.ar : step.en}
                    </span>
                  </li>
                ))}
              </ol>

              <p className="lq-hint">{t.perShop}</p>
              <p className="lq-hint">{t.noHistory}</p>
        </section>
      </div>
    </Shell>
  );
}
