import type { Metadata } from "next";
import Link from "next/link";

import { fetchBrands, fetchCategories } from "@/lib/catalog";
import { defaultLocale } from "@/lib/locale";
import { Shell } from "@/components/shell";

/**
 * ISR, five minutes — the same clock as every other catalogue read. The home
 * screen is identical for every visitor, so rendering it per request buys
 * nothing and costs a database round trip on the busiest URL on the site.
 */
export const revalidate = 300;

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const locale = defaultLocale;

  /**
   * Both reads in parallel. Sequential awaits here would serialise two
   * independent queries and add the slower one's latency to the faster one for
   * no reason — and this is the page a first-time visitor lands on.
   *
   * `allSettled`, not `all`: a category list that fails should not blank the
   * shop rail. Each section decides on its own whether it has anything to draw.
   */
  const [categories, brands] = await Promise.allSettled([
    fetchCategories(),
    fetchBrands(1, 24),
  ]);

  const cats = categories.status === "fulfilled" ? categories.value : [];
  const shops = brands.status === "fulfilled" ? brands.value.items : [];

  return (
    <Shell>
      <div className="lq-wrap lq-pad">
        {/* The city, as an eyebrow. Loqal is Cairo and Giza only today, and
            saying so is better than a shopper in Alexandria discovering it at
            checkout. */}
        <div className="lq-sec">
          <span className="lq-eyebrow">
            {locale === "ar" ? "القاهرة والجيزة" : "Cairo & Giza"}
          </span>
        </div>

        {cats.length > 0 ? (
          <section className="lq-sec" aria-label={locale === "ar" ? "الأقسام" : "Categories"}>
            <div className="lq-cats">
              {cats.map((category) => (
                <Link
                  key={category.id}
                  href={`/search?category=${encodeURIComponent(category.slug)}`}
                  className="lq-cat"
                >
                  {category.name[locale] ?? category.name.ar ?? category.name.en}
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <section className="lq-sec" aria-label={locale === "ar" ? "المحلات" : "Shops"}>
          <div className="lq-sec__head">
            <h1 className="lq-sec__title">
              {locale === "ar" ? "المحلات" : "Shops"}
            </h1>
          </div>

          {shops.length === 0 ? (
            /* Describes what will appear, not the emptiness. */
            <p className="lq-hint">
              {locale === "ar"
                ? "المحلات اللي بتوصّل لمنطقتك هتظهر هنا."
                : "Shops that deliver to your area show up here."}
            </p>
          ) : (
            <div className="lq-grid2">
              {shops.map((shop) => (
                <Link key={shop.id} href={`/shop/${shop.slug}`} className="lq-card lq-card--link lq-card--pad">
                  <span className="lq-pcard__name" data-bidi>
                    {shop.name}
                  </span>
                  {shop.description ? (
                    <span className="lq-hint" data-bidi>
                      {shop.description[locale] ?? shop.description.ar ?? shop.description.en}
                    </span>
                  ) : null}
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </Shell>
  );
}
