"use client";

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

import type { CartBrand, CartLine, CartSummary } from "@loqal/contracts/cart.contract";
import type { DeliveryMethod } from "@loqal/contracts/enums";
import { useCart, useRemoveBagLine, useUpdateBagLine } from "@/lib/cart";
import { formatPrice, type Locale } from "@/lib/locale";
import { useLocale } from "@/lib/locale-context";
import { Shell } from "@/components/shell";
import { Money } from "@/components/money";
import { Garment, garmentFor } from "@/components/garment";

/**
 * The bag.
 *
 * THE SPLIT BY SHOP IS THE SCREEN, NOT A GROUPING FLOURISH. The backend makes
 * one `BrandOrder` per shop: each one is packed, booked, delivered, charged and
 * confirmed by that shop alone. So this page never draws a single basket with a
 * single delivery line under it — there is a section per shop, and inside each
 * section that shop's own subtotal and that shop's own delivery fee. Flattening
 * them into one figure would promise one parcel and deliver two.
 *
 * WHAT IS DELIBERATELY ABSENT: an ETA. `design/basket.html` puts a green pill
 * reading "يوصلك النهاردة قبل ٩ م" on every shop header, and the cart contract
 * carries no arrival time at all — not per shop and not for the basket. A
 * number invented here would be the one promise the system cannot keep, so the
 * pill is not drawn. When `cartBrandSchema` grows a per-shop ETA it goes in the
 * shop header, one per shop, never summed.
 *
 * MONEY DECIMALS follow the register's rule rather than taste: a shelf price is
 * printed as the shop wrote it on the tag and carries no decimals; anything
 * being reconciled against another figure — a line total, a shop subtotal, a
 * delivery fee, the estimate at the bottom — carries two. That is the whole
 * meaning of `reconciled` on `Money`.
 */
export function BagView() {
  const locale = useLocale();
  const { data: cart, isPending, isError, refetch } = useCart();
  const t = (ar: string, en: string) => (locale === "ar" ? ar : en);

  const title = t("السلة", "Bag");

  if (isPending) {
    return (
      <Shell title={title}>
        <div className="lq-wrap lq-pad">
          <BagSkeleton />
        </div>
      </Shell>
    );
  }

  if (isError) {
    return (
      <Shell title={title}>
        <div className="lq-wrap lq-pad lq-sec">
          <h1 className="lq-sec__title" style={PAGE_TITLE}>
            {title}
          </h1>
          <p className="lq-hint lq-hint--error" role="alert">
            {t(
              "مش قادرين نجيب السلة دلوقتي. حاجاتك لسه مكانها — الاتصال هو اللي وقع.",
              "We cannot load your bag right now. Nothing was lost — the connection was."
            )}
          </p>
          <div>
            <button
              type="button"
              className="lq-btn lq-btn--secondary"
              onClick={() => refetch()}
            >
              <span className="lq-icon" data-icon="refresh-cw" aria-hidden="true" />
              {t("جرّب تاني", "Try again")}
            </button>
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

  return (
    <Shell title={title}>
      <div className="lq-wrap lq-pad">
        {/* ── The page head ───────────────────────────────────────────────
            The count says pieces AND shops, because the number of shops is
            what decides how many deliveries arrive and how many times
            delivery is charged. */}
        <header className="lq-sec">
          <h1 className="lq-sec__title" style={PAGE_TITLE}>
            {title}
          </h1>
          <p className="lq-hint">
            <Counted
              n={cart.itemCount}
              locale={locale}
              ar={{ one: "قطعة واحدة", two: "قطعتين", few: "قطع", many: "قطعة" }}
              en={{ one: "item", other: "items" }}
            />
            {" — "}
            {t("من", "from")}{" "}
            <Counted
              n={cart.brands.length}
              locale={locale}
              ar={{ one: "محل واحد", two: "محلين", few: "محلات", many: "محل" }}
              en={{ one: "shop", other: "shops" }}
            />
          </p>
          <p style={PROSE}>
            {t(
              "كل محل بيجهّز ويبعت نصّه بنفسه، فبيوصلوك في وقتين مختلفين.",
              "Each shop packs and sends its own half, so they arrive at different times."
            )}
          </p>
        </header>

        {/* Warnings arrive from the API already written in both languages, so
            nothing here maps a code to a sentence or invents wording for a
            code it does not recognise. */}
        {cart.warnings.length > 0 ? (
          <section className="lq-sec">
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
          </section>
        ) : null}

        {cart.brands.map((brand, index) => (
          <ShopLot
            key={brand.brandId}
            brand={brand}
            locale={locale}
            deliveryMethod={cart.deliveryMethod}
            delayMs={index * 70}
          />
        ))}

        <Summary cart={cart} locale={locale} blocked={blocked} />
      </div>

      {/* ── The one action of the screen ────────────────────────────────────
          It carries the pieces figure, not the estimate: the estimate depends
          on a delivery method that is chosen at checkout, and a total that
          moves after the shopper taps is worse than one that was never
          promised. */}
      <div className="lq-actionbar">
        <div className="lq-actionbar__info">
          <span className="lq-actionbar__label">{t("القطع", "Items")}</span>
          <Money className="lq-money" amount={cart.subtotal} locale={locale} reconciled />
        </div>
        <Link
          href="/checkout"
          className="lq-btn lq-btn--primary lq-btn--lg"
          // Every shop's minimum has to be met, because each one is a separate
          // order that shop has to be willing to fulfil.
          aria-disabled={blocked.length > 0}
        >
          {t("إتمام الأوردر", "Checkout")}
        </Link>
      </div>
    </Shell>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   One shop, one section, one delivery.
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

  const pieces = brand.items.reduce((sum, line) => sum + line.quantity, 0);

  return (
    <section
      className="lq-sec lq-rv"
      aria-label={brand.brandName}
      style={{ "--lq-d": `${delayMs}ms` } as CSSProperties}
    >
      <hr className="lq-rule" />

      {/* The shop is a place, so its name is a link to it and not a label.
          NO ETA PILL: see the note at the top of this file. */}
      <div className="lq-sec__head">
        <span style={STACK}>
          <Link href={`/shop/${brand.brandSlug}`} className="lq-sec__title" data-bidi>
            {brand.brandName}
          </Link>
          <span className="lq-hint">
            <Counted
              n={pieces}
              locale={locale}
              ar={{ one: "قطعة واحدة", two: "قطعتين", few: "قطع", many: "قطعة" }}
              en={{ one: "item", other: "items" }}
            />
            {" · "}
            {t("توصيل المحل ده لوحده", "delivered on its own")}
          </span>
        </span>

        {!brand.brandActive ? (
          <span className="lq-badge lq-badge--neutral">{t("مقفول", "Closed")}</span>
        ) : null}
      </div>

      {/* Says the consequence, not the caution. A suspended shop's lines are
          excluded from every total by the API, so the figures below already
          reflect this and the sentence explains a number the shopper can see. */}
      {!brand.brandActive ? (
        <p className="lq-hint lq-hint--error">
          {t(
            "المحل ده مقفول دلوقتي — حاجاته مش داخلة في الحساب.",
            "This shop is closed right now — its items are not counted."
          )}
        </p>
      ) : null}

      {!brand.minimumOrderMet && brand.amountToMinimum ? (
        <p className="lq-hint">
          {t(
            `فاضل ${formatPrice(brand.amountToMinimum, locale, { decimals: true })} توصل للحد الأدنى بتاع المحل ده.`,
            `Add ${formatPrice(brand.amountToMinimum, locale, { decimals: true })} to reach this shop's minimum.`
          )}
        </p>
      ) : null}

      {brand.items.map((line) => (
        <BagLine key={line.variantId} line={line} locale={locale} />
      ))}

      <hr className="lq-rule" />

      {/* This shop's own two figures. They are here rather than in one basket
          footer because the shop charges them, not Loqal. */}
      <div className="lq-sec__head">
        <span className="lq-hint">{t("مجموع المحل", "Shop subtotal")}</span>
        <Money className="lq-money" amount={brand.subtotal} locale={locale} reconciled />
      </div>

      <div className="lq-sec__head">
        <span style={STACK}>
          <span className="lq-hint">{t("توصيل المحل", "Shop delivery")}</span>
          {deliveryMethod ? (
            <span className="lq-hint">{deliveryLabel(deliveryMethod, locale)}</span>
          ) : null}
        </span>

        {/* Null until a method is chosen, and a fee is a figure somebody
            checks — so the screen says WHEN it will exist instead of printing
            a zero the shop never quoted. */}
        {brand.impliedFare ? (
          <Money className="lq-money" amount={brand.impliedFare} locale={locale} reconciled />
        ) : (
          <span className="lq-hint">
            {t("بيتحدد لما تختار طريقة التوصيل", "Set when you pick a delivery method")}
          </span>
        )}
      </div>
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
    <div className="lq-line">
      {/* THE DRAWING, NOT A PICTURE OF A MISSING PICTURE. There is no product
          photography and the cart line carries no image URL, so the well holds
          the same hairline-framed line art the catalogue draws, seeded from the
          product's own id so the piece keeps one drawing across reloads. */}
      <span className="lq-line__well lq-pcard__well">
        <Garment className="lq-garment" kind={garmentFor(line.productId)} />
      </span>

      {/* A grid stack, because `.lq-line__name` and `.lq-line__meta` are both
          inline and would otherwise run together on one line. */}
      <div style={STACK}>
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
            actionable; "only 2 left" is. */}
        {!line.available ? (
          <span className="lq-hint lq-hint--error">
            {line.availableQuantity > 0
              ? t(`فاضل ${line.availableQuantity} بس`, `Only ${line.availableQuantity} left`)
              : t("خلص من المحل", "Out of stock")}
          </span>
        ) : null}

        {/* Excluded from the shop's subtotal by the API — reported rather than
            silently priced, so the figures add up on screen. */}
        {!line.includedInTotals ? (
          <span className="lq-hint">
            {t("مش داخلة في الحساب", "Not counted in the total")}
          </span>
        ) : null}

        <div className="lq-line__foot">
          {/* Bare buttons inside .lq-qty, which sizes them at 44x44 itself.
              An .lq-iconbtn nested in here would have drawn a second hairline
              inside the stepper's own frame. */}
          <div className="lq-qty">
            <button
              type="button"
              disabled={busy}
              aria-label={t("أقل", "Decrease")}
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
              aria-label={t("أكتر", "Increase")}
              onClick={() =>
                update.mutate({ variantId: line.variantId, quantity: line.quantity + 1 })
              }
            >
              <span className="lq-icon" data-icon="plus" aria-hidden="true" />
            </button>
          </div>

          {/* A destructive control never carries an icon alone — the word is
              the label and .lq-btn holds the 44px floor. */}
          <button
            type="button"
            className="lq-btn lq-btn--ghost"
            disabled={busy}
            onClick={() => remove.mutate({ variantId: line.variantId })}
          >
            <span className="lq-icon" data-icon="trash-2" aria-hidden="true" />
            {t("شيل", "Remove")}
          </button>
        </div>
      </div>

      {/* The third column. A line total is reconciled into the shop subtotal
          under it, so two decimals; the unit price beneath is the figure on the
          tag on the shelf, so none. */}
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
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   The summary.
   ══════════════════════════════════════════════════════════════════════════ */

function Summary({
  cart,
  locale,
  blocked,
}: {
  cart: CartSummary;
  locale: Locale;
  blocked: CartBrand[];
}) {
  const t = (ar: string, en: string) => (locale === "ar" ? ar : en);

  return (
    <section className="lq-sec" aria-label={t("الملخص", "Summary")}>
      <hr className="lq-rule" />
      <h2 className="lq-sec__title">{t("الملخص", "Summary")}</h2>

      <div className="lq-sec__head">
        <span className="lq-hint">
          {t("القطع", "Items")}{" ("}
          <span data-num>{cart.itemCount}</span>
          {")"}
        </span>
        <Money className="lq-money" amount={cart.subtotal} locale={locale} reconciled />
      </div>

      <div className="lq-sec__head">
        <span className="lq-hint">
          {t("التوصيل — كل محل لوحده", "Delivery — each shop separately")}
        </span>
        {cart.estimatedDeliveryTotal ? (
          <Money
            className="lq-money"
            amount={cart.estimatedDeliveryTotal}
            locale={locale}
            reconciled
          />
        ) : (
          <span className="lq-hint">
            {t("بيتحدد عند الدفع", "Set at checkout")}
          </span>
        )}
      </div>

      <div className="lq-sec__head">
        <span className="lq-sec__title">{t("الإجمالي التقريبي", "Estimated total")}</span>
        <Money
          className="lq-money"
          amount={cart.grandTotalEstimate}
          locale={locale}
          reconciled
        />
      </div>

      {/* The two sentences that explain the two things a shopper discovers at
          the worst possible moment otherwise. Both stay verbatim. */}
      <p style={PROSE}>
        {t(
          "مصاريف التوصيل لكل محل لوحده — الأوردر من محلين بيتحسب مرتين.",
          "Delivery is charged per shop — an order from two shops is charged twice."
        )}
      </p>
      <p style={PROSE}>
        {t(
          "كل محل بيراجع الرف قبل ما يأكد نصّه. لو قطعة خلصت، بنلغيها ومش بتتحاسب عليها — وباقي الأوردر بيكمّل عادي.",
          "Each shop checks its shelf before it confirms its half. A piece that has sold out is dropped and not charged, and the rest of the order carries on."
        )}
      </p>
      <p className="lq-hint">
        {t(
          "الحساب النهائي بيتعمل عند الدفع، فالرقم ده تقديري.",
          "Everything is repriced at checkout, so this figure is an estimate."
        )}
      </p>

      {blocked.length > 0 ? (
        <p className="lq-hint lq-hint--error" role="alert">
          {t(
            `${blocked.map((brand) => brand.brandName).join(" و")} لسه تحت الحد الأدنى، فالأوردر مش هيكمّل.`,
            `${blocked.map((brand) => brand.brandName).join(" and ")} ${blocked.length === 1 ? "is" : "are"} still under the minimum, so checkout cannot run.`
          )}
        </p>
      ) : null}
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   Empty and loading.
   ══════════════════════════════════════════════════════════════════════════ */

/**
 * The empty state DESCRIBES WHAT WILL APPEAR. It never says the bag is empty —
 * the shopper can see that — and it teaches the one thing about this screen
 * that is not obvious before there is anything in it: the bag splits by shop.
 */
function EmptyBag({ locale }: { locale: Locale }) {
  const t = (ar: string, en: string) => (locale === "ar" ? ar : en);

  return (
    <div className="lq-wrap lq-pad lq-sec">
      <h1 className="lq-sec__title" style={PAGE_TITLE}>
        {t("السلة", "Bag")}
      </h1>

      <span
        className="lq-pcard__well"
        style={{ inlineSize: 88 }}
        aria-hidden="true"
      >
        <Garment className="lq-garment" kind="bag" />
      </span>

      <p style={PROSE}>
        {t(
          "الحاجات اللي تختارها من أي محل تظهر هنا، كل محل في قسم لوحده — بمجموعه ومصاريف توصيله، لأن كل محل بيبعت نصّه بنفسه.",
          "Whatever you pick from any shop shows up here, each shop in its own section — with its own subtotal and its own delivery fee, because each shop sends its own half."
        )}
      </p>

      <div>
        <Link href="/shops" className="lq-btn lq-btn--primary lq-btn--lg">
          <span className="lq-icon" data-icon="store" aria-hidden="true" />
          {t("اتفرّج على المحلات", "Browse shops")}
        </Link>
      </div>
    </div>
  );
}

/** The skeleton is the shape of the thing it stands in for: a shop header and
 *  two of its lines, twice — never a spinner in the middle of content. */
function BagSkeleton() {
  return (
    <div aria-hidden="true">
      {[0, 1].map((lot) => (
        <section className="lq-sec" key={lot}>
          <hr className="lq-rule" />
          <div className="lq-sec__head">
            <span className="lq-skel" style={{ blockSize: 20, inlineSize: "9rem" }} />
            <span className="lq-skel" style={{ blockSize: 20, inlineSize: "5rem" }} />
          </div>
          {[0, 1].map((line) => (
            <div className="lq-line" key={line}>
              <span className="lq-skel" style={{ aspectRatio: "var(--ratio-garment)" }} />
              <span style={STACK}>
                <span className="lq-skel" style={{ blockSize: 16, inlineSize: "70%" }} />
                <span className="lq-skel" style={{ blockSize: 13, inlineSize: "40%" }} />
                <span className="lq-skel" style={{ blockSize: 44, inlineSize: "9rem" }} />
              </span>
              <span className="lq-skel" style={{ blockSize: 16, inlineSize: "4rem" }} />
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   Small shared bits.
   ══════════════════════════════════════════════════════════════════════════ */

/**
 * A counted noun, with LATIN digits in both languages.
 *
 * Arabic has a singular, a dual and a small plural, and a numeral in front of
 * the dual reads as a stutter — "2 قطعتين" says two twice. So one and two are
 * the word alone and everything above three prints the figure. The figure goes
 * through `data-num`, which is Source Code Pro and tabular, like every other
 * count in the system.
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

/** The shopper reads a method, not an enum. */
function deliveryLabel(method: DeliveryMethod, locale: Locale): string {
  const labels: Record<DeliveryMethod, [string, string]> = {
    RIDER_PER_BRAND: ["مندوب من المحل", "A rider from the shop"],
    SHIPPING_SERVICE: ["شركة شحن", "A shipping company"],
    BRAND_OWN_DELIVERY: ["توصيل المحل بنفسه", "The shop's own delivery"],
  };
  return labels[method][locale === "ar" ? 0 : 1];
}

/**
 * Three inline styles, and they are here rather than in components.css because
 * the class layer is copied verbatim from the design system and is not this
 * screen's to extend. Each one is a gap reported alongside the work: there is
 * no page-title class (26px is the register's page title and `.lq-sec__title`
 * is the 20px section title), and no prose class capping a paragraph at the
 * 62ch measure the system specifies.
 */
const PAGE_TITLE: CSSProperties = { fontSize: "var(--text-2xl)" };

const PROSE: CSSProperties = {
  maxInlineSize: "var(--prose-max)",
  color: "var(--ink-2)",
  fontSize: "var(--text-sm)",
  fontWeight: 300,
};

const STACK: CSSProperties = {
  display: "grid",
  gap: "var(--space-1)",
  minInlineSize: 0,
};
