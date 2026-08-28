import Link from "next/link";

import type { PublicBrand } from "@loqal/contracts/storefront.contract";
import type { Locale } from "@/lib/locale";

/**
 * The shop card — one object, rendered on the home rail, the shop index and
 * anywhere else a shop appears, so the three cannot drift into three different
 * ideas of what a shop is.
 *
 * IT LEADS WITH A SIGN. The name is set large and faded across the top of the
 * card, the way it sits over a real shopfront, and that is not decoration: on
 * any other marketplace a shop name is a seller label, and here it is the
 * premise. A shopper is buying from a place, and the card should look like one.
 *
 * ── The fields it wants and mostly cannot have ──────────────────────────────
 *
 * `neighbourhood`, `street`, `hours` and `openNow` are optional, and today
 * every call site leaves all four undefined, because `publicBrandSchema`
 * carries none of them: it has id, slug, name, logoUrl, coverUrl, description.
 *
 * They are in the props anyway, and the card renders each one only if it
 * arrives. Two reasons that is better than deleting them:
 *
 *   1. It is the shape the product needs. `design/app.js` had all four, invented
 *      in a hardcoded array. Writing the component to the real shape means the
 *      day the API answers them, this file does not change.
 *   2. NOTHING IS FAKED IN THE MEANTIME. A placeholder neighbourhood is worse
 *      than no neighbourhood — a shopper who picks a shop because it is in
 *      الزمالك and finds out at checkout that it is not has been lied to by the
 *      one screen this product asks them to trust.
 */
/**
 * One or two letters for a shop with no logo. Two initials only when the name
 * is two words of Latin script — Arabic joins, so a second letter lifted out
 * of the middle of a word is a different glyph than the one the reader sees.
 */
function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";

  const latin = /^[\p{Script=Latin}]/u.test(words[0]);
  if (latin && words.length > 1) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return latin ? words[0][0].toUpperCase() : words[0][0];
}

export function ShopCard({
  shop,
  locale,
  delayMs = 0,
  neighbourhood,
  street,
  hours,
  openNow,
  pieceCount,
}: {
  shop: PublicBrand;
  locale: Locale;
  /** Stagger within a revealed group. */
  delayMs?: number;
  neighbourhood?: string | null;
  street?: string | null;
  hours?: string | null;
  openNow?: boolean | null;
  pieceCount?: number | null;
}) {
  const description =
    shop.description?.[locale] ?? shop.description?.ar ?? shop.description?.en ?? null;

  /** The line under the name: the address if we have one, the shop's own
      description if we do not, and nothing at all rather than filler. */
  const place = [neighbourhood, street].filter(Boolean).join(" — ") || null;

  return (
    <Link
      href={`/shop/${shop.slug}`}
      className="lq-shopcard lq-rv"
      style={{ "--lq-d": `${delayMs}ms` } as React.CSSProperties}
    >
      <span className="lq-shopcard__sign">
        {/* Rendered only when the flag actually exists. `openNow === undefined`
            means the API did not say, which is NOT the same as closed — and a
            card that shows "مقفول" because a field is missing turns a gap in
            the schema into a shop losing a sale. */}
        {/* Its own box, not `.lq-pill`. This flag sits ON the sign well, so it
            needs the paper ground and the hairline to stay readable over the
            wordmark behind it; `.lq-pill` is a rounded tone chip built for a
            row of text on flat paper. */}
        {openNow === true ? (
          <span className="lq-shopcard__state" data-open="true">
            <i className="lq-shopcard__dot" />
            {locale === "ar" ? "مفتوح" : "Open"}
          </span>
        ) : openNow === false ? (
          <span className="lq-shopcard__state" data-open="false">
            {locale === "ar" ? "مقفول" : "Closed"}
          </span>
        ) : null}
        {/* The sign carries the shop's own logo where it has one. Where it
            does not, its initials in a plate — NOT the name set huge behind
            the card, which cropped every name wider than the cell and left
            "Paymob Test Bra" sitting under the real name at 12% opacity. */}
        <span className="lq-shopcard__logo" aria-hidden="true">
          {shop.logoUrl ? (
            /* A plain <img>, not next/image: `remotePatterns` is read from
               LOQAL_MEDIA_HOST, so on any deployment that has not set it every
               shop logo would throw instead of rendering. */
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shop.logoUrl} alt="" loading="lazy" decoding="async" />
          ) : (
            <span className="lq-shopcard__initials">{initialsOf(shop.name)}</span>
          )}
        </span>
      </span>

      <span className="lq-shopcard__body">
        <span className="lq-shopcard__name" data-bidi>
          {shop.name}
        </span>

        {place ? (
          <span className="lq-shopcard__place" data-bidi>
            {place}
          </span>
        ) : description ? (
          <span className="lq-shopcard__place" data-bidi>
            {description}
          </span>
        ) : null}

        {hours || typeof pieceCount === "number" ? (
          <span className="lq-shopcard__foot">
            {hours ? <span>{hours}</span> : <span />}
            {typeof pieceCount === "number" ? (
              <span data-num>
                {pieceCount} {locale === "ar" ? "قطعة" : "pieces"}
              </span>
            ) : null}
          </span>
        ) : null}
      </span>
    </Link>
  );
}
