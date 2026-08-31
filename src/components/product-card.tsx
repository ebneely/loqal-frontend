import Link from "next/link";

import type { PublicProduct } from "@loqal/contracts/storefront.contract";
import type { Locale } from "@/lib/locale";
import { Money } from "@/components/money";
import { Garment, garmentFor } from "@/components/garment";
import { ProductPhoto } from "@/components/product-photo";

/**
 * `.lq-pcard` — the one product tile, used by every grid on the storefront.
 *
 * The well is 3:4 with no exceptions. There is no product photography yet, and
 * when it arrives it will be brand-supplied phone photos taken inside a shop:
 * warm, uneven, mixed lighting. Every frame around them is a hairline and every
 * well is the same ratio precisely so that unevenness reads as the shop rather
 * than as a broken layout.
 *
 * WITH NO PHOTO IT DRAWS THE GARMENT rather than showing an image glyph. The
 * previous version put a single Lucide `image` placeholder in the well, which
 * is a picture of a missing picture: correct, and it makes a grid of a
 * pre-launch catalogue look broken rather than drawn.
 *
 * THE DRAWING IS SEEDED FROM `product.id`, NOT THE SLUG, and that is not
 * arbitrary. `cartLineSchema` carries `productId` and no slug, so a bag line
 * cannot seed from a slug it never receives — seeding the grid from one and the
 * bag from the other gives the same garment two different drawings on two
 * screens in the same session. The id is the only key both sides hold.
 *
 * Sold-out is an OVERLAY on the well, not a line under the price. A shopper
 * scanning a grid decides on the picture; a note below it is read after they
 * have already tapped.
 */
export function ProductCard({
  product,
  brandSlug,
  brandName,
  locale,
  priority = false,
  delayMs = 0,
}: {
  product: PublicProduct;
  brandSlug: string;
  brandName: string;
  locale: Locale;
  /** The first row of the first grid, so the LCP image is not lazy. */
  priority?: boolean;
  /** Stagger within a revealed group. */
  delayMs?: number;
}) {
  const name = product.name?.[locale] ?? product.name?.ar ?? product.name?.en ?? "";

  return (
    <Link
      href={`/shop/${brandSlug}/${product.slug}`}
      className="lq-pcard lq-rv"
      style={{ "--lq-d": `${delayMs}ms` } as React.CSSProperties}
    >
      <span className="lq-pcard__well">
        {product.coverUrl ? (
          /* `ProductPhoto`, not a bare `next/image`: with no configured media
             host or a file that fails to load, it degrades to the same garment
             drawing the branch below draws, instead of throwing. */
          <ProductPhoto
            src={product.coverUrl}
            alt={name}
            productId={product.id}
            // 2-up on a phone, 3-up at 768, 4-up at 1024 — the same steps the
            // grid uses, so the browser never downloads a 1200px file for a
            // 190px tile on mobile data.
            sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
            priority={priority}
          />
        ) : (
          <Garment className="lq-garment" kind={garmentFor(product.id)} />
        )}

        {!product.inStock ? (
          <span className="lq-pcard__out">{locale === "ar" ? "خلص" : "Sold out"}</span>
        ) : null}
      </span>

      {/* The shop name over the product name: a shopper on a mixed grid is
          choosing a shop as much as a garment, and on this product the shop is
          a place rather than a seller label. */}
      <span className="lq-pcard__brand" data-bidi>
        {brandName}
      </span>
      <span className="lq-pcard__name" data-bidi>
        {name}
      </span>

      {/* A shelf price, so no decimals. `priceFrom` is the cheapest live
          variant — what a card can honestly print when the sizes differ. */}
      <Money className="lq-money" amount={product.priceFrom} locale={locale} />
    </Link>
  );
}
