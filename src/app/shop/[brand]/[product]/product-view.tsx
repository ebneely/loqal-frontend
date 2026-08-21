"use client";

import { useState } from "react";
import Image from "next/image";

import type { PublicProductDetail } from "@loqal/contracts/storefront.contract";
import { useAddToBag } from "@/lib/cart";
import { formatPrice, type Locale } from "@/lib/locale";

/**
 * The product screen's interactive half.
 *
 * The page around it is a server component that owns the ISR cache, the
 * metadata and the JSON-LD; only the picker and the add-to-bag button need to
 * be client code, so only they are. Shipping the whole page as a client
 * component would put the garment description behind a hydration boundary for
 * no gain.
 */
export function ProductView({
  product,
  brandSlug,
  locale,
  priceLabel,
}: {
  product: PublicProductDetail;
  brandSlug: string;
  locale: Locale;
  /** Formatted on the server so the first paint carries the real price. */
  priceLabel: string;
}) {
  /**
   * Nothing is preselected when there is a real choice to make.
   *
   * A single-variant product has no choice, so it is chosen for the shopper —
   * making somebody tap "One size" to enable a button is a step that exists
   * only because the data has a shape.
   */
  const [variantId, setVariantId] = useState<string | null>(
    product.variants.length === 1 ? product.variants[0].id : null
  );

  const addToBag = useAddToBag();
  const selected = product.variants.find((v) => v.id === variantId) ?? null;
  const name = product.name?.[locale] ?? product.name?.ar ?? product.name?.en ?? "";
  const description = product.description?.[locale] ?? product.description?.ar ?? null;

  const t = {
    pick: locale === "ar" ? "اختار المقاس" : "Pick a size",
    add: locale === "ar" ? "ضيف للسلة" : "Add to bag",
    adding: locale === "ar" ? "بيتضاف…" : "Adding…",
    added: locale === "ar" ? "اتضاف للسلة" : "Added to your bag",
    soldOut: locale === "ar" ? "خلص من المحل" : "Sold out",
    /* Says the consequence, not the caution. */
    failed:
      locale === "ar"
        ? "مااتضافش. المحل ممكن يكون خلص القطعة دلوقتي — جرّب تاني."
        : "It did not go in. The shop may have just run out — try again.",
  };

  return (
    <div className="lq-wrap lq-pad">
      <div className="lq-scroll">
        {product.mediaUrls.length > 0 ? (
          product.mediaUrls.map((url, index) => (
            <div key={url} className="lq-pcard__well">
              <Image
                src={url}
                alt={name}
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                // The first photo is the LCP on this screen.
                priority={index === 0}
              />
            </div>
          ))
        ) : (
          <div className="lq-pcard__well">
            <span className="lq-icon lq-pcard__ph" data-icon="image" aria-hidden="true" />
          </div>
        )}
      </div>

      <h1 style={{ fontSize: "var(--text-2xl)" }} data-bidi>
        {name}
      </h1>

      <p className="lq-money" style={{ fontSize: "var(--text-xl)" }}>
        {selected ? formatPrice(selected.price, locale) : priceLabel}
      </p>

      {description ? <p data-bidi>{description}</p> : null}

      {/* `.lq-vp` — the variant picker. Only drawn when there is a choice. */}
      {product.variants.length > 1 ? (
        <div className="lq-vp">
          <div className="lq-vp__head">
            <span className="lq-vp__label">{t.pick}</span>
          </div>
          <div className="lq-vp__row">
            {product.variants.map((variant) => {
              const label = Object.values(variant.attributes).join(" · ") || variant.sku;
              return (
                <button
                  key={variant.id}
                  type="button"
                  className="lq-swatch"
                  data-selected={variant.id === variantId}
                  // A sold-out size is SHOWN and disabled, not hidden: a shopper
                  // needs to know their size exists and is gone, or they assume
                  // the shop never carried it.
                  disabled={!variant.inStock}
                  aria-pressed={variant.id === variantId}
                  onClick={() => setVariantId(variant.id)}
                >
                  {label}
                  {!variant.inStock ? ` — ${t.soldOut}` : ""}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* `.lq-actionbar` — the one action of the screen, in thumb reach. */}
      <div className="lq-actionbar">
        <button
          type="button"
          className="lq-btn lq-btn--primary lq-btn--lg lq-btn--block"
          disabled={!selected || !selected.inStock || addToBag.isPending}
          onClick={() => {
            if (!selected) return;
            addToBag.mutate({ variantId: selected.id, quantity: 1 });
          }}
        >
          {addToBag.isPending ? t.adding : t.add}
        </button>

        {addToBag.isError ? (
          <p className="lq-hint lq-hint--error" role="alert">
            {t.failed}
          </p>
        ) : addToBag.isSuccess ? (
          <p className="lq-hint" role="status">
            {t.added}
          </p>
        ) : null}
      </div>

      {/* The shop is a link, not a label: a shopper who likes the garment wants
          the rest of the rail. */}
      <a href={`/shop/${brandSlug}`} className="lq-eyebrow" data-bidi>
        {brandSlug}
      </a>
    </div>
  );
}
