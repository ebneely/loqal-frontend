import type { Metadata } from "next";
import Link from "next/link";

import { fetchCategories } from "@/lib/catalog";
import { defaultLocale } from "@/lib/locale";
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
export const revalidate = 300;

export const metadata: Metadata = {
  title: "الأقسام",
  description: "كل أقسام لوكال — تيشيرتات، قمصان، تريكو، بناطيل، جواكت وأكتر، من محلات القاهرة والجيزة.",
  alternates: {
    canonical: "/categories",
    languages: { ar: "/categories", en: "/categories?lang=en" },
  },
};

export default async function CategoriesPage() {
  const locale = defaultLocale;

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
              <h1 className="lq-sec__title">{locale === "ar" ? "الأقسام" : "Categories"}</h1>
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
            <div className="lq-tiles">
              {categories.map((category, index) => (
                <Link
                  key={category.id}
                  href={`/search?category=${encodeURIComponent(category.slug)}`}
                  className="lq-tile lq-rv"
                  style={{ "--lq-d": `${(index % 4) * 70}ms` } as React.CSSProperties}
                >
                  <span className="lq-tile__art">
                    <Garment className="lq-garment" kind={garmentFor(category.slug)} />
                  </span>
                  <span className="lq-tile__name" data-bidi>
                    {category.name[locale] ?? category.name.ar ?? category.name.en}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </Shell>
  );
}
