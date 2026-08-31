import type { Metadata } from "next";
import Link from "next/link";

import { fetchCategories } from "@/lib/catalog";
import { getLocale } from "@/lib/locale-server";
import { Shell } from "@/components/shell";
import { Garment, garmentFor } from "@/components/garment";

/**
 * الأقسام — the category index.
 *
 * A destination in the desktop header, so it exists as a route rather than as a
 * link into `/search` with a filter pre-applied: a shopper who lands here has
 * not chosen anything yet, and a pre-filtered results page with nothing
 * filtered is a worse version of this screen.
 *
 * The categories themselves ARE the content, which is why each one gets a
 * drawing and a whole cell rather than a chip in a row.
 */
/**
 * NOT ISR, and it cannot be: the language comes from a cookie, so the HTML is
 * per-reader. `revalidate` asked Next to cache one copy of it, which threw
 * DYNAMIC_SERVER_USAGE on every request — a 500 on the shop pages and a
 * "we cannot reach the categories" on the ones that catch their own errors.
 *
 * The catalogue reads keep their own `next: { revalidate }`, so a request
 * costs a render and no database round trip.
 */

export const metadata: Metadata = {
  title: "الأقسام",
  description: "كل أقسام loqaaal — تيشيرتات، قمصان، تريكو، بناطيل، جواكت وأكتر، من محلات القاهرة والجيزة.",
  alternates: {
    canonical: "/categories",
    languages: { ar: "/categories", en: "/categories?lang=en" },
  },
};

export default async function CategoriesPage() {
  const locale = await getLocale();

  /**
   * Not `allSettled` here, unlike the home page: this screen IS the category
   * list. There is no second thing on it to keep alive, so a failure should
   * reach the error boundary rather than render a page whose only content is
   * an apology.
   */
  let categories;
  try {
    categories = await fetchCategories();
  } catch {
    categories = null;
  }

  return (
    <Shell title={locale === "ar" ? "الأقسام" : "Categories"}>
      <div className="lq-wrap lq-pad">
        <section className="lq-sec">
          <div className="lq-sec__head">
            <div>
              <h1 className="lq-phead__title">{locale === "ar" ? "الأقسام" : "Categories"}</h1>
              <p className="lq-eyebrow">
                {locale === "ar"
                  ? "كل قطعة على رف في محل — مش في مخزن."
                  : "Every piece is on a shelf in a shop, not in a warehouse."}
              </p>
            </div>
            {categories && categories.length > 0 ? (
              <span className="lq-hint" data-num>
                {categories.length}
              </span>
            ) : null}
          </div>

          {categories === null ? (
            /* Says the API is unreachable rather than pretending the shop has
               no categories. A total outage and an empty catalogue must not
               look the same. */
            <p className="lq-hint lq-hint--error" role="alert">
              {locale === "ar"
                ? "مش قادرين نوصل للأقسام دلوقتي. حدّث الصفحة بعد شوية."
                : "We cannot reach the categories right now. Reload in a moment."}
            </p>
          ) : categories.length === 0 ? (
            <p className="lq-hint">
              {locale === "ar"
                ? "الأقسام هتظهر هنا أول ما المحلات تبدأ ترفع قطعها."
                : "Categories show up here once shops start listing."}
            </p>
          ) : (
            <>
              {/*
                THE TILES ARE NOT LINKS, and that is the honest answer rather
                than a missing feature.

                They used to point at `/search?category=<slug>`. Nothing reads
                that parameter, because nothing CAN: `searchProductsQuerySchema`
                is `.strict()` and accepts query, page, perPage, brands, sizes,
                colors, price, sort and inStockOnly — there is no category
                filter anywhere in the search API. Every tile was a dead end
                that landed the shopper on an empty search box.

                Running the category NAME as a text search was the other
                candidate and it was rejected on the Arabic: search is trigram
                similarity over the product name, and Egyptian category names
                are broken plurals. "تيشيرتات" would find "تيشيرت", but
                "بناطيل" shares almost no trigrams with "بنطلون" and "جواكت"
                none with "جاكيت" — so half the tiles would look like the
                category was empty. A filter that works for some categories and
                silently reports nothing for the rest is worse than one that
                says it is not here yet.

                So the tiles stay as the answer to "what do these shops sell",
                the note below says why they do not open, and it hands over the
                two ways in that DO work today.
              */}
              <p className="lq-hint">
                {locale === "ar"
                  ? "التصفّح بالقسم لسه مش شغّال — البحث بيدوّر بأسماء القطع، مش بالأقسام. لحد ما ييجي، "
                  : "Browsing by category is not live yet — search matches piece names, not categories. Until it is, "}
                <Link href="/search">{locale === "ar" ? "دوّر بالاسم" : "search by name"}</Link>
                {locale === "ar" ? " أو افتح " : " or open a "}
                <Link href="/shops">{locale === "ar" ? "محل" : "shop"}</Link>
                {locale === "ar" ? "." : "."}
              </p>

              <div className="lq-tiles">
                {categories.map((category, index) => (
                  <div
                    key={category.id}
                    className="lq-tile lq-tile--static lq-rv"
                    style={{ "--lq-d": `${(index % 4) * 70}ms` } as React.CSSProperties}
                  >
                    <span className="lq-tile__art">
                      <Garment className="lq-garment" kind={garmentFor(category.slug)} />
                    </span>
                    <span className="lq-tile__name" data-bidi>
                      {category.name[locale] ?? category.name.ar ?? category.name.en}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </Shell>
  );
}
