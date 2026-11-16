"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import type { CSSProperties, ReactNode } from "react";

import type { CartBrand, CartLine, CartSummary } from "@loqal/contracts/cart.contract";
import type { DeliveryMethod } from "@loqal/contracts/enums";
import { useCart, useRemoveBagLine, useUpdateBagLine } from "@/lib/cart";
import { fetchBrand, queryKeys } from "@/lib/catalog";
import { clock, isOpenNow } from "@/lib/shop-hours";
import { formatDeliveryTime } from "@/lib/delivery-time";
import { formatPrice, type Locale } from "@/lib/locale";
import { useLocale } from "@/lib/locale-context";
import { Shell } from "@/components/shell";
import { Money } from "@/components/money";
import { Garment, garmentFor } from "@/components/garment";
import { ProductPhoto } from "@/components/product-photo";
/* One component, two screens — the bag and checkout. See the note at the top
   of delivery-picker.tsx. */
import { DeliveryPicker, deliveryLabel } from "@/components/delivery-picker";

/**
 * The bag.
 *
 * THE SPLIT BY SHOP IS THE SCREEN, NOT A GROUPING FLOURISH. The backend makes
 * one `BrandOrder` per shop: each one is packed, booked, delivered, charged and
 * confirmed by that shop alone. So this page never draws a single basket with a
 * single delivery line under it — there is a group per shop, and inside each
 * group that shop's own subtotal and that shop's own delivery fee. Flattening
 * them into one figure would promise one parcel and deliver two.
 *
 * WHAT IS DELIBERATELY ABSENT: an ETA. The cart contract carries no arrival
 * time at all — not per shop and not for the basket. When `cartBrandSchema`
 * grows a per-shop ETA it goes in the shop header, one per shop, never summed.
 *
 * MONEY DECIMALS: a shelf price is printed as the shop wrote it on the tag and
 * carries no decimals; anything reconciled against another figure — a line
 * total, a shop subtotal, a delivery fee, the estimate — carries two. That is
 * the whole meaning of `reconciled` on `Money`.
 */
export function BagView() {
  const locale = useLocale();
  const { data: cart, isPending, isError, refetch } = useCart();
  const t = (ar: string, en: string) => (locale === "ar" ? ar : en);
  const title = t("السلة", "Bag");

  if (isPending) {
    return (
      <Shell title={title}>
        <div className="lq-wrap lq-opage">
          <header className="lq-ophead">
            <h1 className="lq-pagetitle">{title}</h1>
          </header>
          <BagSkeleton />
        </div>
      </Shell>
    );
  }

  if (isError) {
    return (
      <Shell title={title}>
        <div className="lq-wrap lq-opage">
          <header className="lq-ophead">
            <h1 className="lq-pagetitle">{title}</h1>
          </header>
          <div className="lq-oempty">
            <p className="lq-hint lq-hint--error" role="alert">
              {t(
                "تعذّر تحميل السلة الآن. لم يضع شيء من قطعك، وإنما انقطع الاتصال.",
                "We cannot load your bag right now. Nothing was lost — the connection was."
              )}
            </p>
            <div className="lq-oempty__acts">
              <button
                type="button"
                className="lq-btn lq-btn--secondary"
                onClick={() => refetch()}
              >
                <span className="lq-icon" data-icon="refresh-cw" aria-hidden="true" />
                {t("حاول مرة أخرى", "Try again")}
              </button>
            </div>
          </div>
        </div>
      </Shell>
    );
  }

  if (!cart || cart.brands.length === 0) {
    return (
      <Shell title={title}>
        <EmptyBag locale={locale} />
      </Shell>
    );
  }

  const blocked = cart.brands.filter((brand) => !brand.minimumOrderMet);

  /* A LINK, and it stays one when blocked: a shopper under a shop's minimum
     needs to READ why, and the reason is the red line beside it. Every shop's
     minimum has to be met, because each one is a separate order that shop has
     to be willing to fulfil. */
  const checkout = (
    <Link
      href="/checkout"
      className="lq-btn lq-btn--primary lq-btn--lg lq-btn--block"
      aria-disabled={blocked.length > 0}
      onClick={(event) => {
        if (blocked.length > 0) event.preventDefault();
      }}
    >
      {t("إتمام الطلب", "Checkout")}
    </Link>
  );

  return (
    <Shell title={title}>
      <div className="lq-wrap lq-opage">
        {/* The count says pieces AND shops, because the number of shops is
            what decides how many deliveries arrive and how many times
            delivery is charged. */}
        <header className="lq-ophead">
          <h1 className="lq-pagetitle">{title}</h1>
          <p className="lq-lede">
            {t(
              "يجهّز كل متجر قطعه ويرسلها بنفسه، فقد تصلك في وقتين مختلفين.",
              "Each shop packs and sends its own pieces, so they may arrive at different times."
            )}
          </p>
          <p className="lq-ophead__count">
            <Counted n={cart.itemCount} locale={locale} ar={PIECES} en={{ one: "item", other: "items" }} />
            {" · "}
            <Counted n={cart.brands.length} locale={locale} ar={SHOPS} en={{ one: "shop", other: "shops" }} />
          </p>
        </header>

        {/* Warnings arrive from the API already written in both languages, so
            nothing here maps a code to a sentence. */}
        {cart.warnings.length > 0 ? (
          <div className="lq-owarn">
            {cart.warnings.map((warning, index) => (
              <p
                key={`${warning.code}-${index}`}
                className="lq-hint lq-hint--error"
                role="alert"
              >
                <span className="lq-icon" data-icon="triangle-alert" aria-hidden="true" />{" "}
                {warning.message[locale]}
              </p>
            ))}
          </div>
        ) : null}

        <div className="lq-twocol">
          <div className="lq-twocol__main">
            {cart.brands.map((brand, index) => (
              <ShopLot
                key={brand.brandId}
                brand={brand}
                locale={locale}
                deliveryMethod={cart.deliveryMethod}
                delayMs={index * 70}
              />
            ))}
          </div>

          <Summary cart={cart} locale={locale} blocked={blocked} checkout={checkout} />
        </div>
      </div>

      {/* The one action, kept in reach on a phone. It carries the pieces
          figure, not the estimate: the estimate depends on a delivery method
          that may still change, and a total that moves after the tap is worse
          than one that was never promised. */}
      <div className="lq-actionbar lq-obar">
        <div className="lq-actionbar__info">
          <span className="lq-actionbar__label">{t("القطع", "Items")}</span>
          <Money className="lq-money" amount={cart.subtotal} locale={locale} reconciled />
        </div>
        {checkout}
      </div>
    </Shell>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   One shop, one group, one delivery.
   ══════════════════════════════════════════════════════════════════════════ */

function ShopLot({
  brand,
  locale,
  deliveryMethod,
  delayMs,
}: {
  brand: CartBrand;
  locale: Locale;
  deliveryMethod: DeliveryMethod | null;
  delayMs: number;
}) {
  const t = (ar: string, en: string) => (locale === "ar" ? ar : en);

  /* The cart names the shop and nothing else, so where it is and whether it
     is open come from the shop's own public record — the read its page makes.
     Until it lands, or if it fails, the header simply says less. */
  const { data: shop } = useQuery({
    queryKey: queryKeys.brand(brand.brandSlug),
    queryFn: () => fetchBrand(brand.brandSlug),
    staleTime: 5 * 60_000,
  });
  const open = shop?.hours ? isOpenNow(shop.hours) : null;
  /* This shop's own window — one per shop, never one for the whole bag. */
  const eta = formatDeliveryTime(shop?.deliveryTime, locale);

  return (
    <section
      className="lq-group lq-rv"
      aria-label={brand.brandName}
      style={{ "--lq-d": `${delayMs}ms` } as CSSProperties}
    >
      <div className="lq-ghead">
        <div className="lq-ghead__id">
          {/* The shop is a place, so its name is a link to it. */}
          <Link href={`/shop/${brand.brandSlug}`} className="lq-ghead__name" data-bidi>
            {brand.brandName}
          </Link>
          {shop?.neighbourhood || eta ? (
            <span className="lq-ghead__meta" data-bidi>
              {[shop?.neighbourhood, eta].filter(Boolean).join(" · ")}
            </span>
          ) : null}
        </div>

        {/* A suspended shop outranks the clock: its lines are out of the
            totals whatever the hour. "Open" is worked out from the clock, so
            the server and the browser can read it a minute apart. */}
        {!brand.brandActive ? (
          <span className="lq-pill" data-tone="neutral">
            {t("متوقف", "Suspended")}
          </span>
        ) : open === true && shop?.hours ? (
          <span className="lq-ghead__open" data-open="true" suppressHydrationWarning>
            {t(
              `مفتوح حتى ${clock(shop.hours.closesAt, "ar")}`,
              `Open until ${clock(shop.hours.closesAt, "en")}`
            )}
          </span>
        ) : open === false ? (
          <span className="lq-ghead__open" data-open="false" suppressHydrationWarning>
            {t("مغلق الآن", "Closed now")}
          </span>
        ) : null}
      </div>

      {/* Says the consequence, not the caution. A suspended shop's lines are
          excluded from every total by the API, so the figures below already
          reflect this. */}
      {!brand.brandActive ? (
        <p className="lq-hint lq-hint--error lq-group__note">
          {t(
            "هذا المتجر متوقف الآن، فقطعه غير محسوبة في المجموع.",
            "This shop is closed right now — its items are not counted."
          )}
        </p>
      ) : null}

      {brand.items.map((line) => (
        <BagLine key={line.variantId} line={line} locale={locale} />
      ))}

      {/* This shop's own two figures. They are here rather than in one basket
          footer because the shop charges them, not loqaaal. */}
      <div className="lq-group__sums">
        <div className="lq-sum__row">
          <span>{t("مجموع المتجر", "Shop subtotal")}</span>
          <Money className="lq-money" amount={brand.subtotal} locale={locale} reconciled />
        </div>
        <div className="lq-sum__row">
          <span>
            {t("توصيل هذا المتجر", "This shop's delivery")}
            {deliveryMethod ? ` · ${deliveryLabel(deliveryMethod, locale)}` : ""}
          </span>
          {/* Null until a method is chosen, and a fee is a figure somebody
              checks — so the screen says WHEN it will exist instead of
              printing a zero the shop never quoted. */}
          {brand.impliedFare ? (
            <Money className="lq-money" amount={brand.impliedFare} locale={locale} reconciled />
          ) : (
            <span className="lq-hint">
              {t("يُحدَّد عند اختيار طريقة التوصيل", "Set when you pick a delivery method")}
            </span>
          )}
        </div>
      </div>

      {!brand.minimumOrderMet && brand.amountToMinimum ? (
        <p className="lq-hint lq-hint--error lq-group__note" role="alert">
          {t(
            `يتبقى ${formatPrice(brand.amountToMinimum, locale, { decimals: true })} لبلوغ الحد الأدنى لهذا المتجر.`,
            `Add ${formatPrice(brand.amountToMinimum, locale, { decimals: true })} to reach this shop's minimum.`
          )}
        </p>
      ) : null}
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   One line.
   ══════════════════════════════════════════════════════════════════════════ */

function BagLine({ line, locale }: { line: CartLine; locale: Locale }) {
  const update = useUpdateBagLine();
  const remove = useRemoveBagLine();
  const busy = update.isPending || remove.isPending;
  const t = (ar: string, en: string) => (locale === "ar" ? ar : en);

  const name = line.productName[locale] ?? line.productName.ar ?? line.productName.en ?? line.sku;
  const attributes = Object.values(line.attributes)
    .map((value) => String(value))
    .join(" · ");

  return (
    <article className="lq-line">
      {/* The product's own photo where there is one; `ProductPhoto` degrades
          to the drawing on a failed load. The drawing is seeded from the
          product id so the piece keeps one drawing across reloads. */}
      <span className="lq-line__well">
        {line.coverUrl ? (
          <ProductPhoto src={line.coverUrl} alt={name} productId={line.productId} sizes="92px" />
        ) : (
          <Garment className="lq-garment" kind={garmentFor(line.productId)} />
        )}
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

        {/* A line the shop cannot currently supply says so with the number it
            CAN supply. "Out of stock" on something already in the bag is not
            actionable; "only 2 left" is. At the ceiling it is a note, not a
            failure. */}
        {!line.available ? (
          <span className="lq-hint lq-hint--error">
            {line.availableQuantity > 0
              ? t(`المتبقي ${line.availableQuantity} فقط`, `Only ${line.availableQuantity} left`)
              : t("نفدت من المتجر", "Out of stock")}
          </span>
        ) : line.quantity >= line.availableQuantity ? (
          <span className="lq-line__meta">
            {t(`المتبقي ${line.availableQuantity} فقط`, `Only ${line.availableQuantity} left`)}
          </span>
        ) : null}

        {/* Excluded from the shop's subtotal by the API — reported rather than
            silently priced, so the figures add up on screen. */}
        {!line.includedInTotals ? (
          <span className="lq-line__meta">
            {t("غير محسوبة في المجموع", "Not counted in the total")}
          </span>
        ) : null}

        <div className="lq-line__foot">
          <div className="lq-qty">
            <button
              type="button"
              disabled={busy}
              aria-label={t("إنقاص الكمية", "Decrease")}
              onClick={() => {
                // One is the floor: going below it is a removal, and the API's
                // own schema refuses a quantity of zero.
                if (line.quantity <= 1) {
                  remove.mutate({ variantId: line.variantId });
                  return;
                }
                update.mutate({ variantId: line.variantId, quantity: line.quantity - 1 });
              }}
            >
              <span className="lq-icon" data-icon="minus" aria-hidden="true" />
            </button>

            <span className="lq-qty__n" data-num>
              {line.quantity}
            </span>

            <button
              type="button"
              // The shop's own availability is the ceiling, not 99.
              disabled={busy || line.quantity >= line.availableQuantity}
              aria-label={t("زيادة الكمية", "Increase")}
              onClick={() =>
                update.mutate({ variantId: line.variantId, quantity: line.quantity + 1 })
              }
            >
              <span className="lq-icon" data-icon="plus" aria-hidden="true" />
            </button>
          </div>

          {/* A destructive control is a word, never an icon alone. */}
          <button
            type="button"
            className="lq-line__rm"
            disabled={busy}
            onClick={() => remove.mutate({ variantId: line.variantId })}
          >
            {t("إزالة", "Remove")}
          </button>
        </div>
      </div>

      {/* A line total is reconciled into the shop subtotal, so two decimals;
          the unit price beneath is the figure on the tag, so none. */}
      <div className="lq-line__end">
        <Money className="lq-money" amount={line.lineTotal} locale={locale} reconciled />
        {line.quantity > 1 ? (
          <span className="lq-line__meta">
            <span data-num>{line.quantity}</span>
            {" × "}
            {formatPrice(line.unitPrice, locale)}
          </span>
        ) : null}
      </div>
    </article>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   The summary panel.
   ══════════════════════════════════════════════════════════════════════════ */

function Summary({
  cart,
  locale,
  blocked,
  checkout,
}: {
  cart: CartSummary;
  locale: Locale;
  blocked: CartBrand[];
  checkout: ReactNode;
}) {
  const t = (ar: string, en: string) => (locale === "ar" ? ar : en);

  return (
    <aside className="lq-panel" aria-label={t("الملخص", "Summary")}>
      <h2 className="lq-panel__title">{t("الملخص", "Summary")}</h2>

      {/* The method first: every delivery figure under it comes from it. */}
      <div className="lq-panel__pick">
        <DeliveryPicker cart={cart} locale={locale} />
      </div>

      <div className="lq-sum__row">
        <span>
          {t("القطع", "Items")} (<span data-num>{cart.itemCount}</span>)
        </span>
        <Money className="lq-money" amount={cart.subtotal} locale={locale} reconciled />
      </div>

      <div className="lq-sum__row">
        <span>{t("التوصيل، لكل متجر على حدة", "Delivery, each shop separately")}</span>
        {cart.estimatedDeliveryTotal ? (
          <Money
            className="lq-money"
            amount={cart.estimatedDeliveryTotal}
            locale={locale}
            reconciled
          />
        ) : (
          <span className="lq-hint">{t("يُحدَّد عند إتمام الطلب", "Set at checkout")}</span>
        )}
      </div>

      <div className="lq-sum__row lq-sum__row--total">
        <span>{t("الإجمالي التقديري", "Estimated total")}</span>
        <Money className="lq-money" amount={cart.grandTotalEstimate} locale={locale} reconciled />
      </div>

      <div className="lq-panel__go">{checkout}</div>

      {blocked.length > 0 ? (
        <p className="lq-hint lq-hint--error" role="alert">
          {t(
            `لم يبلغ ${blocked.map((brand) => brand.brandName).join(" و")} الحد الأدنى للطلب بعد، فلا يمكن إتمام الطلب.`,
            `${blocked.map((brand) => brand.brandName).join(" and ")} ${blocked.length === 1 ? "is" : "are"} still under the minimum, so checkout cannot run.`
          )}
        </p>
      ) : null}

      {/* The sentences that explain the things a shopper otherwise discovers
          at the worst possible moment. */}
      <p className="lq-panel__note">
        {t(
          "تُحسب رسوم التوصيل لكل متجر على حدة، فالطلب من متجرين تُدفع رسومه مرتين.",
          "Delivery is charged per shop — an order from two shops is charged twice."
        )}
      </p>
      <p className="lq-panel__note">
        {t(
          "يراجع كل متجر الرف قبل التأكيد. إذا نفدت قطعة تُلغى ولا تُحاسب عليها، ويستمر باقي الطلب.",
          "Each shop checks its shelf before it confirms its half. A piece that has sold out is dropped and not charged, and the rest of the order carries on."
        )}
      </p>
      <p className="lq-panel__note">
        {t(
          "يُعاد حساب المبلغ عند إتمام الطلب، لذا فهذا الرقم تقديري.",
          "Everything is repriced at checkout, so this figure is an estimate."
        )}
      </p>
    </aside>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   Empty and loading.
   ══════════════════════════════════════════════════════════════════════════ */

/**
 * The empty state names the state, then DESCRIBES WHAT WILL APPEAR and teaches
 * the one thing about this screen that is not obvious before there is anything
 * in it: the bag splits by shop.
 */
function EmptyBag({ locale }: { locale: Locale }) {
  const t = (ar: string, en: string) => (locale === "ar" ? ar : en);

  return (
    <div className="lq-wrap lq-opage">
      <header className="lq-ophead">
        <h1 className="lq-pagetitle">{t("السلة", "Bag")}</h1>
      </header>
      <div className="lq-oempty">
        <h2 className="lq-oempty__title">{t("سلتك فارغة", "Your bag is empty")}</h2>
        <p className="lq-oempty__body">
          {t(
            "ستظهر هنا القطع التي تختارها من أي متجر، وكل متجر في قسم مستقل بمجموعه ورسوم توصيله، لأن كل متجر يرسل طلبه بنفسه.",
            "Whatever you pick from any shop shows up here, each shop in its own section with its own subtotal and delivery fee, because each shop sends its own half."
          )}
        </p>
        <div className="lq-oempty__acts">
          <Link href="/shops" className="lq-btn lq-btn--primary lq-btn--lg">
            {t("تصفّح المتاجر", "Browse shops")}
          </Link>
          <Link href="/orders" className="lq-btn lq-btn--secondary lq-btn--lg">
            {t("تتبّع طلبًا", "Track an order")}
          </Link>
        </div>
      </div>
    </div>
  );
}

/** The skeleton is the shape of the thing it stands in for: a shop header and
 *  two of its lines, twice — never a spinner in the middle of content. */
function BagSkeleton() {
  return (
    <div className="lq-twocol" aria-hidden="true">
      <div className="lq-twocol__main">
        {[0, 1].map((lot) => (
          <section className="lq-group" key={lot}>
            <div className="lq-ghead">
              <span className="lq-skel" style={{ blockSize: 24, inlineSize: "9rem" }} />
              <span className="lq-skel" style={{ blockSize: 16, inlineSize: "5rem" }} />
            </div>
            {[0, 1].map((line) => (
              <div className="lq-line" key={line}>
                <span className="lq-line__well lq-skel" />
                <span className="lq-line__body">
                  <span className="lq-skel" style={{ blockSize: 16, inlineSize: "70%" }} />
                  <span className="lq-skel" style={{ blockSize: 13, inlineSize: "40%" }} />
                  <span className="lq-skel" style={{ blockSize: 40, inlineSize: "8rem" }} />
                </span>
                <span className="lq-skel" style={{ blockSize: 16, inlineSize: "4rem" }} />
              </div>
            ))}
          </section>
        ))}
      </div>
      <span className="lq-panel lq-skel" style={{ blockSize: 280 }} />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   Small shared bits.
   ══════════════════════════════════════════════════════════════════════════ */

const PIECES = { one: "قطعة واحدة", two: "قطعتان", few: "قطع", many: "قطعة" };
const SHOPS = { one: "متجر واحد", two: "متجران", few: "متاجر", many: "متجرًا" };

/**
 * A counted noun, with LATIN digits in both languages.
 *
 * Arabic has a singular, a dual and a small plural, and a numeral in front of
 * the dual reads as a stutter — "2 قطعتان" says two twice. So one and two are
 * the word alone and everything from three prints the figure, tabular.
 */
function Counted({
  n,
  locale,
  ar,
  en,
}: {
  n: number;
  locale: Locale;
  ar: { one: string; two: string; few: string; many: string };
  en: { one: string; other: string };
}): ReactNode {
  if (locale === "ar") {
    if (n === 1) return ar.one;
    if (n === 2) return ar.two;
    return (
      <>
        <span data-num>{n}</span> {n <= 10 ? ar.few : ar.many}
      </>
    );
  }
  return (
    <>
      <span data-num>{n}</span> {n === 1 ? en.one : en.other}
    </>
  );
}
