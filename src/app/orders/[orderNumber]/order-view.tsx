"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useId, useMemo, useState } from "react";
import type { CSSProperties } from "react";

import type { BrandOrderStatus } from "@loqal/contracts/enums";
import type {
  ShopperBrandOrder,
  ShopperOrder,
  ShopperOrderItem,
} from "@loqal/contracts/storefront.contract";
import { ApiError } from "@/lib/api";
import { fetchBrandDirectory, queryKeys, type BrandDirectoryEntry } from "@/lib/catalog";
import { useOrderLookup, usePaymentLink } from "@/lib/orders";
import { formatDate, formatPrice, type Locale } from "@/lib/locale";
import { useLocale } from "@/lib/locale-context";
import { useQuery } from "@tanstack/react-query";
import { Shell } from "@/components/shell";
import { Money } from "@/components/money";
import { StatusPill } from "@/components/status-pill";
import { Garment, garmentFor } from "@/components/garment";
import { deliveryLabel } from "@/components/delivery-picker";

/**
 * One order.
 *
 * A STATUS PER SHOP, AND NEVER A ROLLED-UP ONE. The response carries a parent
 * `status` — it is parsed, because the schema is strict — and this screen does
 * not draw it anywhere. Brands fulfil independently: one shop can be DELIVERED
 * while its basket-mate is still PENDING_BRAND, and a single pill over the top
 * of both would have to pick one. Picking the optimistic one tells a shopper
 * their order arrived when half of it has not left a shelf; picking the
 * pessimistic one hides the half that did. So the page is a stack of shops and
 * the totals underneath are the only figures that speak for all of them.
 *
 * THE ORDER NUMBER PLUS THE PHONE IS THE CREDENTIAL. `GET /v1/orders/lookup/
 * :orderNumber?phone=` is anonymous by design — most Loqal shoppers check out
 * as guests — and it answers 404, never 403, when the pair does not match, so
 * that typing order numbers at it cannot confirm which ones exist. This screen
 * must keep the two possibilities in one sentence for the same reason, and the
 * route is noindex because a shared URL from here is a shared credential.
 *
 * ── The two things the response does not carry ──────────────────────────────
 *
 * NO SHOP NAME. `brandOrders[].brandId` is the only identifier of a shop on
 * the whole payload — no name, no slug, no logo. So the id is resolved against
 * the public brand index, which really does carry both, and a shop that is not
 * in that index (delisted since the order was placed) is labelled as a shop
 * with a reference rather than being given an invented name or having its
 * UUID printed as if it were one. `Shop.brandName` from the cart is not
 * available here either: the cart is emptied by the order.
 *
 * NO PRODUCT IMAGE. `productSnapshot.imageMediaId` is a media id and there is
 * no public resolver for it, so nothing on this page could render a photo even
 * if one existed. The garment line art stands in, seeded from the variant id
 * so a piece keeps one drawing across reloads — exactly as every other screen
 * in the storefront does it.
 */

export function OrderView({ orderNumber }: { orderNumber: string }) {
  const locale = useLocale();
  const t = (ar: string, en: string) => (locale === "ar" ? ar : en);
  const params = useSearchParams();

  /**
   * The phone comes from the URL, so the whole read is addressable: the
   * shopper can reopen this page, and checkout can send them straight here
   * after placing the order. When it is missing — a shopper who typed the
   * order number, or opened an old link without it — the screen asks for it
   * instead of showing a failure, because nothing has failed yet.
   */
  const phoneParam = params.get("phone") ?? "";

  const { data: order, isPending, isError, error, refetch } = useOrderLookup(
    orderNumber,
    phoneParam
  );

  const title = t("الأوردر", "Order");

  if (!phoneParam) {
    return (
      <Shell title={title}>
        <PhonePrompt orderNumber={orderNumber} locale={locale} />
      </Shell>
    );
  }

  if (isPending) {
    return (
      <Shell title={title}>
        <div className="lq-wrap lq-pad">
          <OrderSkeleton />
        </div>
      </Shell>
    );
  }

  if (isError) {
    const notFound = error instanceof ApiError && error.isNotFound;
    return (
      <Shell title={title}>
        <div className="lq-wrap lq-pad lq-sec">
          <h1 className="lq-phead__title">{title}</h1>
          {notFound ? (
            /* ONE SENTENCE FOR BOTH POSSIBILITIES. The API deliberately cannot
               tell them apart for us — a 403 on a real order number would
               confirm that order exists to anybody typing numbers — so the
               screen does not guess which one happened either. */
            <>
              <p className="lq-hint lq-hint--error" role="alert">
                {t(
                  "مفيش أوردر بالرقم ده مع رقم الموبايل ده. يا إما الرقم مش مظبوط، يا إما الموبايل مش اللي طلبت بيه.",
                  "No order opens with that number and that phone. Either the number is off, or the phone is not the one you ordered with."
                )}
              </p>
              <p className="lq-prose">
                {t(
                  "رقم الأوردر في رسالة التأكيد، بالشكل ده: LQ-4821-7730.",
                  "The order number is in your confirmation message, shaped like LQ-4821-7730."
                )}
              </p>
            </>
          ) : (
            <p className="lq-hint lq-hint--error" role="alert">
              {t(
                "مش قادرين نجيب الأوردر دلوقتي. الأوردر مكانه — الاتصال هو اللي وقع.",
                "We cannot load the order right now. The order is where it was — the connection was not."
              )}
            </p>
          )}
          <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap" }}>
            {!notFound ? (
              <button type="button" className="lq-btn lq-btn--secondary" onClick={() => refetch()}>
                <span className="lq-icon" data-icon="refresh-cw" aria-hidden="true" />
                {t("جرّب تاني", "Try again")}
              </button>
            ) : null}
            <Link href="/orders" className="lq-btn lq-btn--ghost">
              {t("افتح أوردر تاني", "Open a different order")}
            </Link>
          </div>
        </div>
      </Shell>
    );
  }

  return <Loaded order={order} locale={locale} />;
}

function Loaded({ order, locale }: { order: ShopperOrder; locale: Locale }) {
  const t = (ar: string, en: string) => (locale === "ar" ? ar : en);

  /**
   * The shop directory — the only way to put a name over a shop's half.
   *
   * Not `enabled`-gated on anything: the order is already loaded by the time
   * this renders, and the read is a list the storefront caches for its own
   * shop pages. A directory that fails to load is not an error state here —
   * every shop simply falls back to its reference, and the order is still
   * completely readable, which is why nothing on this page waits for it.
   */
  const directory = useQuery({
    queryKey: queryKeys.brandDirectory(),
    queryFn: () => fetchBrandDirectory(),
    staleTime: 5 * 60_000,
  });

  const shops = useMemo(() => {
    const index = new Map<string, BrandDirectoryEntry>();
    for (const entry of directory.data ?? []) index.set(entry.id, entry);
    return index;
  }, [directory.data]);

  const unnamed = order.brandOrders.filter((half) => !shops.has(half.brandId)).length;

  /**
   * Money is still owed when any shop's half is sitting in PENDING_PAYMENT.
   *
   * This is the ONLY payment signal on the whole response — there is no
   * `payments[]`, no provider status and no way to re-read a `checkoutUrl`
   * with a GET — so the status enum is what the recovery hangs off.
   */
  const awaitingPayment = order.brandOrders.some((half) => half.status === "PENDING_PAYMENT");

  return (
    <Shell title={t("الأوردر", "Order")}>
      <div className="lq-wrap lq-pad">
        <header className="lq-sec">
          <div className="lq-sec__head">
            <div style={STACK}>
              <h1 className="lq-phead__title">
                {t("الأوردر", "Order")} <span data-num>{order.orderNumber}</span>
              </h1>
              <p className="lq-hint">
                <span data-num>{formatDate(order.placedAt, locale)}</span>
                {order.deliveryMethod ? (
                  <> {" · "} {deliveryLabel(order.deliveryMethod, locale)}</>
                ) : null}
              </p>
            </div>
            <Money className="lq-money" amount={order.grandTotal} locale={locale} reconciled />
          </div>

          <p className="lq-prose">
            {order.brandOrders.length > 1
              ? t(
                  "الأوردر ده من أكتر من محل. كل محل بيجهّز ويبعت نصّه لوحده، وكل نص ليه حالته — مفيش حالة واحدة بتتكلم عن الأوردر كله.",
                  "This order is from more than one shop. Each shop packs and sends its own half, and each half has its own status — no single status speaks for the whole order."
                )
              : t(
                  "المحل بيجهّز ويبعت بنفسه، والحالة اللي تحت هي حالة المحل ده.",
                  "The shop packs and sends it itself, and the status below is that shop's own."
                )}
          </p>
        </header>

        {awaitingPayment ? <PaymentRecovery order={order} locale={locale} /> : null}

        {/* ── One section per shop ─────────────────────────────────────────── */}
        {order.brandOrders.map((half, index) => (
          <ShopHalf
            key={half.id}
            half={half}
            shop={shops.get(half.brandId) ?? null}
            locale={locale}
            delayMs={index * 70}
          />
        ))}

        {/* Said ONCE, under the shops, rather than as a shrug on each unnamed
            header. It explains a gap the shopper can see instead of leaving
            them to wonder whether the shop is real. */}
        {unnamed > 0 ? (
          <p className="lq-hint">
            {t(
              "فيه محل في الأوردر ده مش ظاهر اسمه: الأوردر بيرجّع رقم المحل بس، والمحل ده مش في دليل المحلات دلوقتي — غالبًا وقف البيع بعد ما طلبت. حالته ومبلغه فوق زي أي محل تاني.",
              "One of the shops here has no name on it: an order carries only the shop's id, and this one is not in the shop index right now — most likely it stopped selling after you ordered. Its status and its money are above like any other shop's."
            )}
          </p>
        ) : null}

        {/* ── The figures that DO speak for the whole order ────────────────── */}
        <section className="lq-sec" aria-label={t("الحساب", "The total")}>
          <hr className="lq-rule" />
          <h2 className="lq-sec__title">{t("الحساب", "The total")}</h2>

          <div className="lq-sum__row">
            <span className="lq-hint">{t("القطع", "Items")}</span>
            <Money className="lq-money" amount={order.itemsSubtotal} locale={locale} reconciled />
          </div>
          <div className="lq-sum__row">
            <span className="lq-hint">
              {t("التوصيل — كل محل لوحده", "Delivery — each shop separately")}
            </span>
            <Money className="lq-money" amount={order.shippingTotal} locale={locale} reconciled />
          </div>
          {/* Drawn only when there IS one. A zero discount row on every order
              advertises a coupon field the shopper did not use. */}
          {Number(order.discountTotal) > 0 ? (
            <div className="lq-sum__row">
              <span className="lq-hint">{t("الخصم", "Discount")}</span>
              <span className="lq-money lq-money--credit" data-num>
                {"− "}
                {formatPrice(order.discountTotal, locale, { decimals: true })}
              </span>
            </div>
          ) : null}
          <div className="lq-sum__row lq-sum__row--total">
            <span className="lq-sec__title">{t("الإجمالي", "Total")}</span>
            <Money className="lq-money" amount={order.grandTotal} locale={locale} reconciled />
          </div>
        </section>

        {/* ── Where it is going ───────────────────────────────────────────── */}
        <section className="lq-sec" aria-label={t("العنوان", "The address")}>
          <hr className="lq-rule" />
          <h2 className="lq-sec__title">{t("العنوان", "The address")}</h2>
          <div style={STACK}>
            {order.shippingAddress.fullName ? (
              <span data-bidi>{order.shippingAddress.fullName}</span>
            ) : null}
            <span className="lq-hint" data-bidi>
              {[
                order.shippingAddress.street,
                order.shippingAddress.building,
                order.shippingAddress.city,
                order.shippingAddress.governorate,
              ]
                .filter(Boolean)
                .join(" · ")}
            </span>
            <span className="lq-hint" data-num dir="ltr" style={{ textAlign: "start" }}>
              {order.shippingAddress.phone}
            </span>
            {order.shippingAddress.notes ? (
              <span className="lq-hint" data-bidi>
                {order.shippingAddress.notes}
              </span>
            ) : null}
          </div>
          <p className="lq-hint">
            {t(
              "العنوان اتسجّل مع الأوردر. لو فيه غلطة فيه، كلّم المحل — هو اللي بيطلب المندوب.",
              "The address is frozen onto the order. If something in it is wrong, message the shop — the shop books the rider."
            )}
          </p>
        </section>
      </div>
    </Shell>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   One shop's half: its status, its pieces, its own money.
   ══════════════════════════════════════════════════════════════════════════ */

function ShopHalf({
  half,
  shop,
  locale,
  delayMs,
}: {
  half: ShopperBrandOrder;
  shop: BrandDirectoryEntry | null;
  locale: Locale;
  delayMs: number;
}) {
  const t = (ar: string, en: string) => (locale === "ar" ? ar : en);

  /* A SHORT REFERENCE, NOT THE UUID. Eight characters is enough for a shopper
     to read a shop's half out to somebody on the phone and enough for support
     to find it, and it does not pretend to be a name. */
  const reference = half.brandId.slice(0, 8);

  return (
    <section
      className="lq-sec lq-rv"
      aria-label={shop ? shop.name : t("محل في الأوردر", "A shop in this order")}
      style={{ "--lq-d": `${delayMs}ms` } as CSSProperties}
    >
      <hr className="lq-rule" />

      <div className="lq-sec__head">
        <span style={STACK}>
          {/* The shop is a place, so a shop we can name is a link to it. One we
              cannot name is not a link to anywhere, because there is nowhere
              to go: without a slug there is no shop page to open. */}
          {shop ? (
            <Link href={`/shop/${shop.slug}`} className="lq-sec__title" data-bidi>
              {shop.name}
            </Link>
          ) : (
            <span className="lq-sec__title">{t("محل", "Shop")}</span>
          )}
          {!shop ? (
            <span className="lq-hint">
              {t("رقم المحل", "Shop reference")} <span data-num>{reference}</span>
            </span>
          ) : null}
        </span>

        {/* THE ONE MAP. No screen invents a status word or a tone. */}
        <StatusPill status={half.status} locale={locale} />
      </div>

      {/* The consequence of the status, which the pill deliberately does not
          carry — one line, and only where there is something to say. */}
      <p className="lq-hint">{consequence(half.status, locale)}</p>

      {half.items.map((item) => (
        <OrderLine key={item.id} item={item} locale={locale} />
      ))}

      <div className="lq-sum__row">
        <span className="lq-hint">{t("مجموع المحل", "Shop subtotal")}</span>
        <Money className="lq-money" amount={half.subtotal} locale={locale} reconciled />
      </div>
      <div className="lq-sum__row">
        <span className="lq-hint">{t("توصيل المحل", "Shop delivery")}</span>
        <Money className="lq-money" amount={half.shippingCost} locale={locale} reconciled />
      </div>
      {Number(half.discountAmount) > 0 ? (
        <div className="lq-sum__row">
          <span className="lq-hint">{t("الخصم", "Discount")}</span>
          <span className="lq-money lq-money--credit" data-num>
            {"− "}
            {formatPrice(half.discountAmount, locale, { decimals: true })}
          </span>
        </div>
      ) : null}

      {/* Cash the rider actually took. Null on every other route and on a cash
          order nobody has collected from yet, so it is printed only when there
          is a collection to report — a zero here would read as "took nothing"
          rather than "not collected". */}
      {half.codCollectedAmount != null ? (
        <div className="lq-sum__row">
          <span className="lq-hint">{t("اتدفع كاش للمندوب", "Paid to the rider in cash")}</span>
          <Money
            className="lq-money"
            amount={half.codCollectedAmount}
            locale={locale}
            reconciled
          />
        </div>
      ) : null}
    </section>
  );
}

function OrderLine({ item, locale }: { item: ShopperOrderItem; locale: Locale }) {
  const name =
    item.productSnapshot.name[locale] ??
    item.productSnapshot.name.ar ??
    item.productSnapshot.name.en ??
    item.productSnapshot.sku;

  /* Values are `unknown` in the snapshot on purpose — it is a frozen copy of a
     JSON column nothing constrains — so they are coerced HERE, at the point of
     display, and a number where a string was expected prints rather than
     making the whole order unreadable. */
  const attributes = Object.values(item.productSnapshot.attributes)
    .map((value) => String(value))
    .join(" · ");

  return (
    <div className="lq-line">
      {/* THE DRAWING, NOT A PICTURE OF A MISSING PICTURE. `imageMediaId` is an
          id with no public resolver behind it, so there is no photograph to
          render — seeded from the variant id, or from the SKU once the variant
          has been archived, so the piece keeps one drawing across reloads. */}
      <span className="lq-line__well">
        <Garment className="lq-garment" kind={garmentFor(item.variantId ?? item.productSnapshot.sku)} />
      </span>

      <div className="lq-line__body">
        <span className="lq-line__name" data-bidi>
          {name}
        </span>
        {attributes ? (
          <span className="lq-line__meta" data-bidi>
            {attributes}
          </span>
        ) : null}
      </div>

      <div className="lq-line__end">
        <Money className="lq-money" amount={item.lineTotal} locale={locale} reconciled />
        {item.qty > 1 ? (
          <span className="lq-line__meta">
            <span data-num>{item.qty}</span>
            {" × "}
            {formatPrice(item.unitPrice, locale)}
          </span>
        ) : null}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   The recovery for an order that is placed and not paid.
   ══════════════════════════════════════════════════════════════════════════ */

/**
 * THE ONLY WAY BACK TO A PAYMENT PAGE.
 *
 * There is no `payments[]` on an order and no GET that re-reads a
 * `checkoutUrl`, so a card order whose Paymob session was lost — the null
 * `checkoutUrl` case at checkout, or a shopper who closed the tab on the
 * payment page — has exactly one route out: ask for a fresh link. Without this
 * the shopper's only remaining move is to place the order a second time.
 *
 * It sits ABOVE the shops rather than inside the one that is unpaid: the link
 * is per ORDER, not per brand order, and drawing a pay button on each half
 * would suggest paying them separately.
 */
function PaymentRecovery({ order, locale }: { order: ShopperOrder; locale: Locale }) {
  const t = (ar: string, en: string) => (locale === "ar" ? ar : en);
  const link = usePaymentLink();
  const [empty, setEmpty] = useState(false);

  return (
    <section className="lq-sec" aria-label={t("الدفع", "Payment")}>
      <hr className="lq-rule" />
      <h2 className="lq-sec__title">{t("لسه فاضل الدفع", "The payment is still open")}</h2>
      <p className="lq-prose">
        {t(
          "الأوردر اتسجّل، والدفع لسه ماتمّش. المحل مش هيبدأ يجهّز قبل ما الدفع يتم.",
          "The order is placed and the payment has not gone through. The shop does not start preparing before it does."
        )}
      </p>

      <div>
        <button
          type="button"
          className="lq-btn lq-btn--primary lq-btn--lg"
          disabled={link.isPending}
          onClick={() => {
            setEmpty(false);
            link.mutate(
              { orderId: order.id },
              {
                onSuccess: (url) => {
                  /* Paymob is another origin, so this is a full-page
                     navigation and not a router push. */
                  if (url) window.location.assign(url);
                  else setEmpty(true);
                },
              }
            );
          }}
        >
          <span className="lq-icon" data-icon="credit-card" aria-hidden="true" />
          {link.isPending ? t("ثانية واحدة", "One moment") : t("ادفع دلوقتي", "Pay now")}
        </button>
      </div>

      {/* Two different failures, both of which leave the order standing: the
          request did not land, or it landed and there is no link to give. */}
      {link.isError ? (
        <p className="lq-hint lq-hint--error" role="alert">
          {t(
            "مش قادرين نفتح صفحة الدفع دلوقتي. الأوردر مكانه — جرّب تاني بعد شوية.",
            "We cannot open the payment page right now. The order is fine — try again shortly."
          )}
        </p>
      ) : null}
      {empty ? (
        <p className="lq-hint lq-hint--error" role="alert">
          {t(
            "مفيش صفحة دفع للأوردر ده دلوقتي. كلّم المحل — الأوردر عنده بنفس الرقم.",
            "There is no payment page for this order right now. Message the shop — it has the order under the same number."
          )}
        </p>
      ) : null}
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   Small parts.
   ══════════════════════════════════════════════════════════════════════════ */

/**
 * What the shopper can expect next.
 *
 * The wording of the STATE belongs to `StatusPill` and is not repeated here —
 * this is the consequence, which the pill has no room for. Anything the map
 * below does not know says nothing at all rather than inventing a sentence for
 * a status the backend added after this file was written.
 */
function consequence(status: BrandOrderStatus, locale: Locale): string {
  const lines: Partial<Record<BrandOrderStatus, [string, string]>> = {
    PENDING_VERIFICATION: [
      "بنتأكد من الأوردر قبل ما يروح للمحل.",
      "We are checking the order before it reaches the shop.",
    ],
    PENDING_PAYMENT: [
      "المحل مستني الدفع يتم عشان يبدأ.",
      "The shop is waiting for the payment before it starts.",
    ],
    PENDING_BRAND: [
      "المحل بيراجع الرف قبل ما يأكد. لو قطعة خلصت، بتتلغي ومش بتتحاسب عليها.",
      "The shop is checking the shelf before it confirms. A piece that has sold out is dropped and not charged.",
    ],
    CONFIRMED: [
      "القطعة موجودة، والمحل بدأ يجهّزها.",
      "The piece is there and the shop has started preparing it.",
    ],
    PACKED: [
      "متظبط ومستني المندوب يعدّي عليه.",
      "Packed, waiting for the rider to collect it.",
    ],
    HANDED_OVER: ["المندوب ماشي بيه دلوقتي.", "The rider has it and is on the way."],
    DELIVERED: [
      "وصل من المحل ده. باقي المحلات على حالتها.",
      "This shop's half arrived. The other shops keep their own status.",
    ],
    DELIVERY_FAILED: [
      "المندوب مالقاش حد يستلم. كلّم المحل عشان يظبط ميعاد تاني.",
      "The rider found nobody to receive it. Message the shop to arrange another time.",
    ],
    RETURN_REQUESTED: [
      "طلب الاسترجاع وصل للمحل، والمحل بيراجعه.",
      "The return request reached the shop and the shop is reviewing it.",
    ],
    RETURNED: ["رجع للمحل.", "It is back at the shop."],
    CANCELLED: [
      "النص ده اتلغى ومش بتتحاسب عليه.",
      "This half was cancelled and is not charged.",
    ],
    REFUNDED: ["الفلوس رجعت.", "The money has been returned."],
  };

  const line = lines[status];
  if (!line) return "";
  return line[locale === "ar" ? 0 : 1];
}

/**
 * The phone, when the URL did not carry one.
 *
 * NOT an error and not a 404: the shopper has half the credential and is being
 * asked for the other half. Submitting rewrites the URL rather than holding
 * the phone in state, so the resulting page is one the shopper can reopen —
 * which is the same reason checkout hands the phone over in the link.
 */
function PhonePrompt({ orderNumber, locale }: { orderNumber: string; locale: Locale }) {
  const router = useRouter();
  const t = (ar: string, en: string) => (locale === "ar" ? ar : en);
  const [phone, setPhone] = useState("");
  const [invalid, setInvalid] = useState(false);
  const id = useId();
  const errorId = useId();

  return (
    <div className="lq-wrap lq-pad lq-sec">
      <h1 className="lq-phead__title">
        {t("الأوردر", "Order")} <span data-num>{orderNumber}</span>
      </h1>
      <p className="lq-prose">
        {t(
          "اكتب رقم الموبايل اللي طلبت بيه. الرقم مع رقم الأوردر هما اللي بيفتحوه — من غير حساب.",
          "Enter the phone you ordered with. That number and the order number are what open it — no account."
        )}
      </p>

      <form
        className="lq-vp"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          const digits = phone.replace(/\D/g, "");
          if (digits.length < 10) {
            setInvalid(true);
            return;
          }
          router.replace(
            `/orders/${encodeURIComponent(orderNumber)}?phone=${encodeURIComponent(phone.trim())}`
          );
        }}
      >
        <div className="lq-field">
          <label className="lq-label" htmlFor={id}>
            {t("رقم الموبايل", "Phone number")}
          </label>
          <input
            id={id}
            className="lq-input"
            data-num
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            onChange={(event) => {
              setPhone(event.target.value);
              if (invalid) setInvalid(false);
            }}
            placeholder="01000000000"
            aria-invalid={invalid}
            aria-describedby={invalid ? errorId : undefined}
          />
        </div>

        {invalid ? (
          <p className="lq-hint lq-hint--error" id={errorId} role="alert">
            {t("اكتب رقم الموبايل اللي طلبت بيه — 11 رقم.", "Enter the phone you ordered with — 11 digits.")}
          </p>
        ) : null}

        <button type="submit" className="lq-btn lq-btn--primary lq-btn--lg lq-btn--block">
          {t("افتح الأوردر", "Open the order")}
        </button>
      </form>
    </div>
  );
}

/** The shape of the order while it arrives: a head, and two shops' halves. */
function OrderSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="lq-sec">
        <span className="lq-skel" style={{ blockSize: 30, inlineSize: "14rem" }} />
        <span className="lq-skel" style={{ blockSize: 14, inlineSize: "8rem" }} />
      </div>
      {[0, 1].map((half) => (
        <section className="lq-sec" key={half}>
          <hr className="lq-rule" />
          <div className="lq-sec__head">
            <span className="lq-skel" style={{ blockSize: 20, inlineSize: "9rem" }} />
            <span className="lq-skel" style={{ blockSize: 24, inlineSize: "7rem" }} />
          </div>
          <div className="lq-line">
            <span className="lq-skel" style={{ aspectRatio: "var(--ratio-garment)" }} />
            <span className="lq-line__body">
              <span className="lq-skel" style={{ blockSize: 16, inlineSize: "70%" }} />
              <span className="lq-skel" style={{ blockSize: 13, inlineSize: "40%" }} />
            </span>
            <span className="lq-skel" style={{ blockSize: 16, inlineSize: "4rem" }} />
          </div>
        </section>
      ))}
    </div>
  );
}

/* Still inline where the stack is NOT a cart line body: an order head, a shop
   header, the address block. */
const STACK: CSSProperties = {
  display: "grid",
  gap: "var(--space-1)",
  minInlineSize: 0,
};
