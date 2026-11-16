"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";

import type { BrandOrderStatus } from "@loqal/contracts/enums";
import { useLocale } from "@/lib/locale-context";
import { Shell } from "@/components/shell";
import { StatusPill } from "@/components/status-pill";

/**
 * Finding an order.
 *
 * THIS IS A LOOKUP, NOT A LIST. A signed-in shopper's history lives on
 * /account (`my-orders.tsx`), and this screen points there in one line; what
 * it is FOR is `GET /v1/orders/lookup/:orderNumber?phone=`, the only key a
 * guest holds.
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
    ar: "يراجع المتجر الرف قبل تأكيد الطلب.",
    en: "The shop checks the shelf before it confirms the order.",
  },
  {
    status: "CONFIRMED",
    ar: "القطعة متوفرة، وبدأ المتجر تجهيزها.",
    en: "The piece is there and the shop has started preparing it.",
  },
  {
    status: "PACKED",
    ar: "الطلب جاهز وينتظر مرور المندوب.",
    en: "Packed, waiting for the rider to collect it.",
  },
  {
    status: "HANDED_OVER",
    ar: "المندوب في طريقه إليك الآن.",
    en: "The rider has it and is on the way.",
  },
  {
    status: "DELIVERED",
    ar: "وصل من هذا المتجر، وباقي المتاجر تبقى على حالتها.",
    en: "This shop's half arrived. The other shops keep their own status.",
  },
];

export function OrdersView() {
  const locale = useLocale();
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<"number" | "phone" | null>(null);
  const router = useRouter();

  const numberId = useId();
  const phoneId = useId();
  const errorId = useId();

  const t = {
    title: locale === "ar" ? "طلباتي" : "My orders",
    lead:
      locale === "ar"
        ? "افتح طلبك برقمه ورقم الهاتف الذي طلبت به، دون الحاجة إلى حساب."
        : "Open your order by its number and the phone you ordered with. No account needed.",
    lookup: locale === "ar" ? "افتح طلبًا" : "Open an order",
    number: locale === "ar" ? "رقم الطلب" : "Order number",
    numberHint:
      locale === "ar"
        ? "تجده في رسالة التأكيد، بهذا الشكل: LQ-4821-7730"
        : "It is in your confirmation message, shaped like LQ-4821-7730",
    phone: locale === "ar" ? "رقم الهاتف" : "Phone number",
    find: locale === "ar" ? "افتح الطلب" : "Open the order",
    numberError:
      locale === "ar"
        ? "اكتب رقم الطلب كما ورد في رسالة التأكيد."
        : "Enter the order number exactly as it is in your confirmation message.",
    phoneError:
      locale === "ar"
        ? "اكتب رقم الهاتف الذي طلبت به، من 11 رقمًا."
        : "Enter the phone you ordered with — 11 digits.",
    /* The empty state teaches. It never mentions the emptiness. */
    journey:
      locale === "ar" ? "الحالات التي يمر بها كل متجر" : "The stages each shop moves through",
    perShop:
      locale === "ar"
        ? "إذا تأخر متجر أو تعذّر التسليم، يظهر ذلك على هذا المتجر وحده، فلا توجد حالة واحدة تعبّر عن الطلب كله."
        : "If one shop is late or a delivery fails, that shows on that shop alone — no single status speaks for the whole order.",
    /* A signed-in shopper's orders live on /account; a guest's only key is
       the number and phone, which is what this form takes. */
    account:
      locale === "ar"
        ? "إن كان لديك حساب، تجد طلباتك كلها في صفحة حسابك."
        : "With an account, every order you placed is on your account page.",
    accountLink: locale === "ar" ? "حسابي" : "My account",
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
     * THE ORDER SCREEN OWNS THE READ, so the result gets a URL.
     *
     * This branch used to report that the lookup was not live: there was no
     * shopper-side order schema and no route to push to, so a correctly filled
     * form landed on a 404 — a form that failed when it succeeded. Both are
     * here now (`shopperOrderSchema`, `/orders/[orderNumber]`), so it pushes.
     *
     * The phone travels in the query string because it is HALF THE
     * CREDENTIAL — the API's lookup takes the pair and answers 404, never 403,
     * when they do not match — and because a URL carrying both is one the
     * shopper can reopen or send to somebody. That is also exactly why both
     * this screen and the order screen are noindex.
     */
    router.push(
      `/orders/${encodeURIComponent(trimmedNumber)}?phone=${encodeURIComponent(phone.trim())}`
    );
  };

  return (
    <Shell title={t.title}>
      <div className="lq-wrap lq-opage">
        <header className="lq-ophead">
          <h1 className="lq-pagetitle">{t.title}</h1>
          <p className="lq-lede">{t.lead}</p>
        </header>

        <div className="lq-lookup">
          {/* ── The lookup ──────────────────────────────────────────────── */}
          <form
            className="lq-lookup__form"
            onSubmit={submit}
            noValidate
            aria-label={t.lookup}
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
              <p id={errorId} className="lq-hint lq-hint--error" role="alert">
                {error === "number" ? t.numberError : t.phoneError}
              </p>
            )}

            <div>
              <button type="submit" className="lq-btn lq-btn--primary lq-btn--lg">
                {t.find}
              </button>
            </div>

            <p className="lq-lookup__aside">
              {t.account}{" "}
              <Link href="/account" className="lq-textlink">
                {t.accountLink}
              </Link>
            </p>
          </form>

          {/* ── What appears: one status per shop ─────────────────────────
              A sequence, read in order, on hairlines. */}
          <div>
            <h2 className="lq-lookup__title">{t.journey}</h2>
            <ol className="lq-stagelist">
              {JOURNEY.map((step) => (
                <li key={step.status}>
                  {/* The ONE map. No screen invents its own wording or tone. */}
                  <StatusPill status={step.status} locale={locale} />
                  <span className="lq-stagelist__note" data-bidi>
                    {locale === "ar" ? step.ar : step.en}
                  </span>
                </li>
              ))}
            </ol>
            <p className="lq-lookup__aside">{t.perShop}</p>
          </div>
        </div>
      </div>
    </Shell>
  );
}
