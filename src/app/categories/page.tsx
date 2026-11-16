import type { Metadata } from "next";
import Link from "next/link";

import { fetchCategories } from "@/lib/catalog";
import { getLocale } from "@/lib/locale-server";
import { Shell } from "@/components/shell";
import { Garment, categoryGarment } from "@/components/garment";
import { EmptyState } from "@/components/state";
import { ReloadButton } from "@/components/reload";

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
  description: "كل أقسام loqaaal — قمصان، تريكو، سراويل، سترات وغيرها، من متاجر القاهرة والجيزة.",
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
      <header className="lq-browsehead">
        <h1 className="lq-pagetitle">{locale === "ar" ? "الأقسام" : "Categories"}</h1>
        <p className="lq-lede">
          {locale === "ar"
            ? "كل قطعة على رف في متجر، لا في مستودع."
            : "Every piece is on a shelf in a shop, not in a warehouse."}
        </p>
      </header>

      <div className="lq-browsebody">
          {categories === null ? (
            /* Says the API is unreachable rather than pretending the shop has
               no categories. A total outage and an empty catalogue must not
               look the same, which is why they get two different drawings: a
               hanger hanging crooked, and a rail with nothing on it. */
            <EmptyState
              art="crooked"
              tone="loud"
              role="alert"
              seed="categories-down"
              title={
                locale === "ar"
                  ? "تعذّر الوصول إلى الأقسام الآن"
                  : "We cannot reach the categories right now"
              }
              body={
                locale === "ar"
                  ? "الخلل من جهتنا لا من جهتك. الأقسام موجودة، لكننا لا نستطيع قراءتها في هذه اللحظة."
                  : "This one is on us, not on you. The sections are there; we just cannot read them this second."
              }
              actions={
                <>
                  <ReloadButton>{locale === "ar" ? "أعد المحاولة" : "Try again"}</ReloadButton>
                  <Link className="lq-btn lq-btn--secondary" href="/shops">
                    {locale === "ar" ? "تصفّح المتاجر" : "Browse the shops"}
                  </Link>
                </>
              }
            />
          ) : categories.length === 0 ? (
            <EmptyState
              art="shelf"
              seed="categories-empty"
              title={locale === "ar" ? "لا توجد أقسام بعد" : "No sections yet"}
              body={
                locale === "ar"
                  ? "ستظهر الأقسام هنا حين تبدأ المتاجر في عرض قطعها. وحتى ذلك الحين، المتاجر نفسها مفتوحة."
                  : "Sections show up here once shops start listing. Until they do, the shops themselves are open."
              }
              actions={
                <Link className="lq-btn lq-btn--primary" href="/shops">
                  {locale === "ar" ? "تصفّح المتاجر" : "Browse the shops"}
                </Link>
              }
            />
          ) : (
            <>
              {/*
                EVERY TILE OPENS ITS SHELF.

                The destination is `/search?category=<slug>`, and the slug is
                the whole of what the address carries — an id would be a UUID
                nobody can read and the name would be free text that changes.
                `/v1/search/products` takes `category` as a filter beside the
                brand and size ones, and `query` is optional as long as one of
                the two is present, so this is a real product listing with the
                filter rail, the sort and the paging on it rather than a search
                box with a word typed into it.

                THE NAME IS NOT RUN AS A TEXT SEARCH, and that was the other
                candidate. Search is trigram similarity over the product name
                and Egyptian category names are broken plurals: "تيشيرتات" would
                find "تيشيرت", but "بناطيل" shares almost no trigrams with
                "بنطلون" and "جواكت" none with "جاكيت". Half the tiles would
                have reported an empty category that is full. The filter reads
                the category relation, so it is right for all twelve.

                Filtering by a parent includes its DESCENDANTS. Category is a
                tree, and a shopper who taps a broad tile means the branch.
              */}
              {/* A big list, like the areas on home: the name in display type,
                  and on hover the category's drawing opens beside it. No piece
                  count: the API has no per-category total, and a count would
                  cost a search per row. */}
              <ul className="lq-biglist">
                {categories.map((category) => (
                  <li key={category.id}>
                    <Link
                      href={`/search?category=${encodeURIComponent(category.slug)}`}
                      className="lq-biglist__row"
                    >
                      <span className="lq-biglist__thumb" data-art aria-hidden="true">
                        <Garment className="lq-garment" kind={categoryGarment(category.slug)} />
                      </span>
                      <b className="lq-biglist__name" data-bidi>
                        {category.name[locale] ?? category.name.ar ?? category.name.en}
                      </b>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
      </div>
    </Shell>
  );
}
