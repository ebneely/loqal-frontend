"use client";

import Link from "next/link";

import type { CartBrand, CartLine } from "@loqal/contracts/cart.contract";
import { useCart, useRemoveBagLine, useUpdateBagLine } from "@/lib/cart";
import { formatPrice, type Locale } from "@/lib/locale";
import { useLocale } from "@/lib/locale-context";
import { Shell } from "@/components/shell";

/**
 * The bag, grouped by shop — which is the whole shape of this screen.
 *
 * A shopper can buy from two shops in one checkout and each shop fulfils,
 * ships and charges separately. So there is a subtotal per shop, a minimum per
 * shop and a delivery fee per shop, and the design system says that out loud
 * rather than letting somebody discover it at checkout: "مصاريف التوصيل لكل
 * محل لوحده — الأوردر من محلين بيتحسب مرتين."
 */
export function BagView() {
  const locale = useLocale();
  const { data: cart, isPending, isError, refetch } = useCart();

  const t = {
    title: locale === "ar" ? "السلة" : "Bag",
    empty:
      locale === "ar"
        ? "الحاجات اللي تختارها من أي محل تظهر هنا."
        : "Whatever you pick from any shop shows up here.",
    browse: locale === "ar" ? "اتفرّج على المحلات" : "Browse shops",
    failed:
      locale === "ar"
        ? "مش قادرين نجيب السلة دلوقتي."
        : "We cannot load your bag right now.",
    retry: locale === "ar" ? "جرّب تاني" : "Try again",
    subtotal: locale === "ar" ? "المجموع" : "Subtotal",
    perShop:
      locale === "ar"
        ? "مصاريف التوصيل لكل محل لوحده — الأوردر من محلين بيتحسب مرتين."
        : "Delivery is charged per shop — an order from two shops is charged twice.",
    checkout: locale === "ar" ? "إتمام الأوردر" : "Checkout",
  };

  if (isPending) {
    return (
      <Shell title={t.title}>
        <div className="lq-wrap lq-pad lq-sec">
          {/* The skeleton is the shape of the thing it stands in for. */}
          <div className="lq-skel" style={{ blockSize: 96 }} />
          <div className="lq-skel" style={{ blockSize: 96 }} />
        </div>
      </Shell>
    );
  }

  if (isError) {
    return (
      <Shell title={t.title}>
        <div className="lq-wrap lq-pad lq-sec">
          <p className="lq-hint lq-hint--error" role="alert">
            {t.failed}
          </p>
          <button type="button" className="lq-btn lq-btn--secondary" onClick={() => refetch()}>
            {t.retry}
          </button>
        </div>
      </Shell>
    );
  }

  if (!cart || cart.brands.length === 0) {
    return (
      <Shell title={t.title}>
        <div className="lq-wrap lq-pad lq-sec">
          <p className="lq-hint">{t.empty}</p>
          <Link href="/" className="lq-btn lq-btn--primary">
            {t.browse}
          </Link>
        </div>
      </Shell>
    );
  }

  return (
    <Shell title={t.title}>
      <div className="lq-wrap lq-pad">
        {/*
          Warnings come from the API already translated into both languages, so
          this never maps a code to a sentence and never invents wording for a
          code it does not recognise.
        */}
        {cart.warnings.length > 0 ? (
          <div className="lq-sec">
            {cart.warnings.map((warning, index) => (
              <p key={`${warning.code}-${index}`} className="lq-hint lq-hint--error" role="alert">
                {warning.message[locale]}
              </p>
            ))}
          </div>
        ) : null}

        {cart.brands.map((brand) => (
          <ShopGroup key={brand.brandId} brand={brand} locale={locale} />
        ))}

        <section className="lq-sec">
          <p className="lq-hint">{t.perShop}</p>
          <div className="lq-line">
            <span>{t.subtotal}</span>
            <span className="lq-money">{formatPrice(cart.subtotal, locale, { decimals: true })}</span>
          </div>
        </section>
      </div>

      <div className="lq-actionbar">
        <div className="lq-actionbar__info">
          <span className="lq-actionbar__label">{t.subtotal}</span>
          <span className="lq-money">
            {formatPrice(cart.subtotal, locale, { decimals: true })}
          </span>
        </div>
        <Link
          href="/checkout"
          className="lq-btn lq-btn--primary lq-btn--lg"
          // Every shop's minimum has to be met, because each one is a separate
          // order that shop has to be willing to fulfil.
          aria-disabled={cart.brands.some((b) => !b.minimumOrderMet)}
        >
          {t.checkout}
        </Link>
      </div>
    </Shell>
  );
}

function ShopGroup({ brand, locale }: { brand: CartBrand; locale: Locale }) {
  const shortfall =
    !brand.minimumOrderMet && brand.amountToMinimum
      ? locale === "ar"
        ? `فاضل ${formatPrice(brand.amountToMinimum, locale)} توصل للحد الأدنى`
        : `Add ${formatPrice(brand.amountToMinimum, locale)} to reach this shop's minimum`
      : null;

  return (
    <section className="lq-sec" aria-label={brand.brandName}>
      <div className="lq-sec__head">
        <Link href={`/shop/${brand.brandSlug}`} className="lq-sec__title" data-bidi>
          {brand.brandName}
        </Link>
        <span className="lq-money">
          {formatPrice(brand.subtotal, locale, { decimals: true })}
        </span>
      </div>

      {!brand.brandActive ? (
        /* Says the consequence. A suspended shop's lines are excluded from
           every total by the API, so the figure above already reflects this. */
        <p className="lq-hint lq-hint--error">
          {locale === "ar"
            ? "المحل ده مقفول دلوقتي — حاجاته مش داخلة في الحساب."
            : "This shop is closed right now — its items are not counted."}
        </p>
      ) : null}

      {shortfall ? <p className="lq-hint">{shortfall}</p> : null}

      {brand.items.map((line) => (
        <BagLine key={line.variantId} line={line} locale={locale} />
      ))}
    </section>
  );
}

function BagLine({ line, locale }: { line: CartLine; locale: Locale }) {
  const update = useUpdateBagLine();
  const remove = useRemoveBagLine();
  const busy = update.isPending || remove.isPending;

  const name = line.productName[locale] ?? line.productName.ar ?? line.productName.en ?? line.sku;
  const attributes = Object.values(line.attributes)
    .map((v) => String(v))
    .join(" · ");

  return (
    <div className="lq-line">
      {/*
        The well is first because `.lq-line` is a `72px 1fr auto` grid and this
        is its first column. There is no product photography yet, so it holds
        the same grey tile with a glyph that every other well does.
      */}
      <div className="lq-line__well">
        <span className="lq-icon" data-icon="image" aria-hidden="true" />
      </div>

      <div style={{ minInlineSize: 0 }}>
        <span className="lq-line__name" data-bidi>
          {name}
        </span>
        {attributes ? <span className="lq-line__meta">{attributes}</span> : null}

        {/*
          A line the shop cannot currently supply says so with the number it
          CAN supply. "Out of stock" on a line the shopper already has in their
          bag is not actionable; "only 2 left" is.
        */}
        {!line.available ? (
          <span className="lq-hint lq-hint--error">
            {line.availableQuantity > 0
              ? locale === "ar"
                ? `فاضل ${line.availableQuantity} بس`
                : `Only ${line.availableQuantity} left`
              : locale === "ar"
                ? "خلص من المحل"
                : "Out of stock"}
          </span>
        ) : null}

        <div className="lq-line__foot">
          <div className="lq-qty">
        <button
          type="button"
          className="lq-iconbtn lq-iconbtn--outline"
          disabled={busy}
          aria-label={locale === "ar" ? "أقل" : "Decrease"}
          onClick={() => {
            // One is the floor: going below it is a removal, and the API's own
            // schema refuses a quantity of zero.
            if (line.quantity <= 1) {
              remove.mutate({ variantId: line.variantId });
              return;
            }
            update.mutate({ variantId: line.variantId, quantity: line.quantity - 1 });
          }}
        >
          <span className="lq-icon" data-icon="minus" aria-hidden="true" />
        </button>

        <span data-num>{line.quantity}</span>

        <button
          type="button"
          className="lq-iconbtn lq-iconbtn--outline"
          // The shop's own availability is the ceiling, not 99.
          disabled={busy || line.quantity >= line.availableQuantity}
          aria-label={locale === "ar" ? "أكتر" : "Increase"}
          onClick={() =>
            update.mutate({ variantId: line.variantId, quantity: line.quantity + 1 })
          }
        >
          <span className="lq-icon" data-icon="plus" aria-hidden="true" />
        </button>
          </div>

          <button
            type="button"
            className="lq-iconbtn"
            disabled={busy}
            aria-label={locale === "ar" ? "شيل" : "Remove"}
            onClick={() => remove.mutate({ variantId: line.variantId })}
          >
            <span className="lq-icon" data-icon="trash-2" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* The third column. Money is aligned to the inline end so a column of
          line totals lines up under the subtotal. */}
      <div className="lq-line__end">
        <span className="lq-money">
          {formatPrice(line.lineTotal, locale, { decimals: true })}
        </span>
      </div>
    </div>
  );
}
