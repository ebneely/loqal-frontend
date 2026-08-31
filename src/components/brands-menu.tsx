"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import type { PublicBrand } from "@loqal/contracts/storefront.contract";
import { fetchBrands, queryKeys } from "@/lib/catalog";
import { useLocale } from "@/lib/locale-context";
import { Garment, garmentFor } from "@/components/garment";
import { MegaMenu } from "@/components/mega-menu";

/**
 * The brands mega-menu: an A–Z index of every shop, with a feature pane that
 * follows whichever shop the pointer or the keyboard is on.
 *
 * The panel itself — the portal, the hover timing, `inert`, one-open-at-a-time
 * — is `mega-menu.tsx`, and the reasons it is built that way are documented
 * there. What is left here is the index and the pane.
 *
 * The feature pane is the one place this diverges upward from the reference
 * (suuupply.com), which parks a static product image beside its index. A
 * marketplace index is a list of *places*, and the pane is where the place gets
 * to be one. What it can say is currently thin — see the note on `Feature`.
 */

/** Latin initial, or `#` for a shop whose name starts in Arabic or a digit. */
const initialOf = (name: string) => {
  const first = name.trim().charAt(0);
  return /[A-Za-z]/.test(first) ? first.toUpperCase() : "#";
};

function Feature({ brand }: { brand: PublicBrand }) {
  const locale = useLocale();

  /**
   * BACKEND GAP, and it is the one that matters most on this surface.
   *
   * `publicBrandSchema` carries id, slug, name, logoUrl, coverUrl and
   * description. It does NOT carry the neighbourhood, the street, the opening
   * hours or a piece count — the four things `design/`'s version of this pane
   * showed, and the four things PRODUCT.md calls the product's premise. That
   * mockup had them because `design/app.js` invented them in a hardcoded array.
   *
   * So the pane renders what the API can answer and says nothing where it
   * cannot. It does not print a placeholder neighbourhood: a location a shopper
   * cannot walk to is worse than no location, and this is the exact screen
   * where the difference is the product.
   */
  const description =
    brand.description?.[locale] ??
    brand.description?.ar ??
    brand.description?.en ??
    null;

  return (
    <>
      <span className="lq-mega__pic">
        <Garment className="lq-garment" kind={garmentFor(brand.slug)} />
      </span>
      <span className="lq-mega__nm" data-bidi>
        {brand.name}
      </span>
      {description ? (
        <span className="lq-mega__hd" data-bidi>
          {description}
        </span>
      ) : null}
      <span className="lq-mega__rw">
        {locale === "ar" ? "افتح المحل" : "Open the shop"}
      </span>
    </>
  );
}

export function BrandsMenu() {
  const locale = useLocale();
  const [featured, setFeatured] = useState<PublicBrand | null>(null);

  /**
   * The same query key and the same endpoint the home page uses, so opening the
   * menu on `/` costs nothing: TanStack serves it from cache.
   *
   * One page of shops, not all of them. `/v1/brands` is paged and the menu
   * shows page 1 — an A-Z index that silently omits page 2 would be wrong, so
   * when the shop count outgrows a page this needs a dedicated index endpoint
   * rather than a bigger `perPage`.
   */
  const { data, isPending, isError } = useQuery({
    queryKey: queryKeys.brands(1),
    queryFn: () => fetchBrands(1, 24),
    staleTime: 5 * 60 * 1000,
  });

  const brands = useMemo(() => data?.items ?? [], [data]);

  /** Grouped once per list, not per render of a group. */
  const groups = useMemo(() => {
    const map = new Map<string, PublicBrand[]>();
    for (const brand of brands) {
      const key = initialOf(brand.name);
      const bucket = map.get(key);
      if (bucket) bucket.push(brand);
      else map.set(key, [brand]);
    }
    /** `#` sorts last: a Latin index that opens on a non-Latin bucket reads as
        broken, and Arabic-named shops are the exception here, not the rule. */
    return [...map.entries()].sort(([a], [b]) =>
      a === "#" ? 1 : b === "#" ? -1 : a.localeCompare(b),
    );
  }, [brands]);

  /** The pane is never empty while the panel is open. */
  const shown = featured ?? brands[0] ?? null;

  return (
    <MegaMenu
      id="shops"
      href="/shops"
      label={locale === "ar" ? "المحلات" : "Shops"}
    >
      <div className="lq-mega__az" data-empty={groups.length === 0}>
        {/* The panel used to render an empty band when the read failed or had
            not landed: a pale strip, a scrim over the page and no word about
            why. Loading is a skeleton, and an empty list says which of the two
            it is. */}
        {groups.length === 0 ? (
          isPending ? (
            <div className="lq-mega__wait" aria-hidden="true">
              {[0, 1, 2, 3].map((i) => (
                <span
                  className="lq-skel"
                  key={i}
                  style={{ blockSize: "14px" }}
                />
              ))}
            </div>
          ) : (
            <p className="lq-hint" role={isError ? "alert" : undefined}>
              {isError
                ? locale === "ar"
                  ? "مش قادرين نوصل للمحلات دلوقتي."
                  : "We cannot reach the shops right now."
                : locale === "ar"
                  ? "المحلات هتظهر هنا أول ما تفتح."
                  : "Shops show up here as they open."}
            </p>
          )
        ) : null}

        {groups.map(([letter, items]) => (
          <div className="lq-mega__grp" key={letter}>
            <span className="lq-mega__ltr">{letter}</span>
            {items.map((brand) => (
              <Link
                key={brand.id}
                href={`/shop/${brand.slug}`}
                data-bidi
                /**
                 * Pointer AND keyboard both drive the pane. `design/`'s version
                 * listened for `mouseover` only, so tabbing through the index
                 * left the pane frozen on whichever shop the mouse had last
                 * grazed — the feature is invisible to a keyboard.
                 */
                onMouseEnter={() => setFeatured(brand)}
                onFocus={() => setFeatured(brand)}
              >
                {brand.name}
              </Link>
            ))}
          </div>
        ))}
      </div>

      {shown ? (
        <Link className="lq-mega__feat" href={`/shop/${shown.slug}`}>
          <Feature brand={shown} />
        </Link>
      ) : null}
    </MegaMenu>
  );
}
