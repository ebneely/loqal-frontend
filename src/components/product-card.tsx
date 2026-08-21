import Link from "next/link";
import Image from "next/image";

import type { PublicProduct } from "@loqal/contracts/storefront.contract";
import { formatPrice, type Locale } from "@/lib/locale";

/**
 * `.lq-pcard` — the one product tile, used by every grid on the storefront.
 *
 * The photo well is 3:4 with no exceptions, because there is no product
 * photography yet and when it arrives it will be brand-supplied phone photos
 * taken inside a shop: warm, uneven, mixed lighting. Every frame around them is
 * grey and every well is the same ratio precisely so that unevenness reads as
 * the shop rather than as a broken layout.
 *
 * Sold-out is an OVERLAY on the photo (`.lq-pcard__out`), not a line of text
 * under the price. A shopper scanning a grid decides on the picture; a note
 * below it is read after they have already tapped.
 */
export function ProductCard({
  product,
  brandSlug,
  brandName,
  locale,
  priority = false,
}: {
  product: PublicProduct;
  brandSlug: string;
  brandName: string;
  locale: Locale;
  /** The first row of the first grid, so the LCP image is not lazy. */
  priority?: boolean;
}) {
  const name = product.name?.[locale] ?? product.name?.ar ?? product.name?.en ?? "";

  return (
    <Link href={`/shop/${brandSlug}/${product.slug}`} className="lq-pcard">
      <div className="lq-pcard__well">
        {product.coverUrl ? (
          <Image
            src={product.coverUrl}
            alt={name}
            fill
            // 2-up on a phone, 3-up at 768, 4-up at 1024 — the same steps the
            // grid uses, so the browser never downloads a 1200px file for a
            // 190px tile on mobile data.
            sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
            priority={priority}
          />
        ) : (
          /* No photo is a real state, not a defect — the shop has not uploaded
             one yet. A grey well with a glyph says that; a broken image does
             not. */
          <span className="lq-icon lq-pcard__ph" data-icon="image" aria-hidden="true" />
        )}

        {!product.inStock ? (
          <span className="lq-pcard__out">
            {locale === "ar" ? "خلص" : "Sold out"}
          </span>
        ) : null}
      </div>

      {/* The shop name over the product name: a shopper on a mixed grid is
          choosing a shop as much as a garment. */}
      <span className="lq-pcard__brand" data-bidi>
        {brandName}
      </span>
      <span className="lq-pcard__name" data-bidi>
        {name}
      </span>

      <span className="lq-money">
        {product.priceFrom
          ? formatPrice(product.priceFrom, locale)
          : /* Nothing priced yet. Printing "0" would be a claim. */
            "—"}
      </span>
    </Link>
  );
}
