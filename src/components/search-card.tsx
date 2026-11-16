import Link from "next/link";

import type { SearchResult } from "@loqal/contracts/storefront.contract";
import type { Locale } from "@/lib/locale";
import { Money, MoneyWas } from "@/components/money";
import { Garment, garmentFor } from "@/components/garment";
import { ProductPhoto } from "@/components/product-photo";
import { FavButton } from "@/components/fav-button";

/**
 * A search-shaped piece: search results, the home «العروض» row and the saved
 * list all draw it, so a piece looks the same in each.
 *
 * Cards rather than a plain list, because the row carries what a card needs
 * to be honest: `inStock` for the sold-out state, `priceFrom` for the figure,
 * and `coverUrl` for the photo. The garment drawing is only the no-photo
 * fallback: picked by hashing the id, a dress could come out as a sock.
 */

/**
 * The drop, as a whole percent, only from a validated pair. The API refuses a
 * compareAtPrice at or below the price with a 409, so this cannot be negative —
 * but an unparseable value must not produce "NaN%" on a card either.
 */
export function discountOf(price: string | null, compareAt: string | null): number | null {
  if (!price || !compareAt) return null;
  const now = Number(price);
  const was = Number(compareAt);
  return Number.isFinite(now) && Number.isFinite(was) && was > now
    ? Math.round((1 - now / was) * 100)
    : null;
}

export function SearchCard({
  item,
  locale,
  delayMs,
}: {
  item: SearchResult;
  locale: Locale;
  delayMs: number;
}) {
  const name = item.name?.[locale] ?? item.name?.ar ?? item.name?.en ?? "";
  const price = item.priceFrom ?? item.basePrice;
  const off = discountOf(item.priceFrom, item.compareAtPrice);

  return (
    <div className="lq-fav-host lq-rv" style={{ "--lq-d": `${delayMs}ms` } as React.CSSProperties}>
      <Link href={`/shop/${item.brandSlug}/${item.slug}`} className="lq-pcard">
        <span className="lq-pcard__well">
          {item.coverUrl ? (
            /* `ProductPhoto`, not a bare `next/image`: with no configured media
               host or a file that fails to load, it degrades to the same garment
               drawing the branch below draws, instead of throwing. */
            <ProductPhoto
              src={item.coverUrl}
              alt={name}
              productId={item.id}
              // The same steps as the grid, so a phone never downloads a 1200px
              // file for a 190px tile.
              sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
            />
          ) : (
            <Garment className="lq-garment" kind={garmentFor(item.id)} />
          )}
          {off != null ? (
            <span className="lq-badge lq-badge--drop lq-pcard__tag" data-num>
              {locale === "ar" ? `خصم ${off}%` : `−${off}%`}
            </span>
          ) : null}
          {/* `=== false`, never `!item.inStock`. Undefined means the API did not
              say — an older build with no variant join — and treating "nobody
              said" as "sold out" stamps خلص across a healthy catalogue. */}
          {item.inStock === false ? (
            <span className="lq-pcard__out">
              {locale === "ar" ? "نفد من المتجر" : "Sold out"}
            </span>
          ) : null}
        </span>

        <span className="lq-pcard__brand" data-bidi>
          {item.brandName}
        </span>
        <span className="lq-pcard__name" data-bidi>
          {name}
        </span>

        <span className="lq-srch__price">
          {off != null ? <MoneyWas amount={item.compareAtPrice} locale={locale} /> : null}
          <Money
            className={off != null ? "lq-money lq-money--drop" : "lq-money"}
            amount={price}
            locale={locale}
          />
        </span>
      </Link>
      <FavButton
        className="lq-pcard__fav"
        label={name}
        target={{
          kind: "product",
          item: {
            id: item.id,
            slug: item.slug,
            brandSlug: item.brandSlug,
            brandName: item.brandName,
            name: item.name,
          },
        }}
      />
    </div>
  );
}
