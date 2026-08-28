import type { Metadata } from "next";
import Link from "next/link";

import { fetchBrands, fetchBrandProducts, fetchCategories } from "@/lib/catalog";
import { getLocale } from "@/lib/locale-server";
import { Shell } from "@/components/shell";
import { Hero } from "@/components/hero";
import { ShopCard } from "@/components/shop-card";
import { ProductCard } from "@/components/product-card";
import { Garment, garmentFor } from "@/components/garment";

/**
 * ISR, five minutes — the same clock as every other catalogue read. The home
 * screen is identical for every visitor, so rendering it per request buys
 * nothing and costs a database round trip on the busiest URL on the site.
 */
export const revalidate = 300;

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

/**
 * The home screen, as `design/storefront-screens.html` draws it. That file
 * supersedes `design/index.html`, which built this page out of full-bleed
 * bands; the board puts the section heads in the capped 1200px column and
 * insets the rails below them by the gutter alone, so a rail runs wider than
 * the text above it on a large screen.
 *
 * Two sections, both rails on a phone. At 1024 the shops rail becomes a static
 * 4-up grid — `.lq-shops` does that in CSS, so nothing here branches on width
 * and the server never has to know it.
 *
 * There is no product grid and no filter chip row. `/search` owns the product
 * grid and already has the query state for one.
 */
export default async function HomePage() {
  const locale = await getLocale();

  /**
   * Both reads in parallel. Sequential awaits would serialise two independent
   * queries and add the slower one's latency to the faster one for nothing —
   * and this is the page a first-time visitor lands on.
   *
   * `allSettled`, not `all`, so a failing category list does not blank the shop
   * rail. But the failure is CARRIED, not swallowed: an earlier version mapped
   * a rejected promise straight to `[]`, so an unreachable API rendered the
   * "no shops yet" empty state — a total outage and a brand-new marketplace
   * looked identical, on the one screen where the difference matters most.
   */
  const [categories, brands] = await Promise.allSettled([
    fetchCategories(),
    fetchBrands(1, 24),
  ]);

  const cats = categories.status === "fulfilled" ? categories.value : [];
  const shops = brands.status === "fulfilled" ? brands.value.items : [];
  const shopsFailed = brands.status === "rejected";

  /**
   * The pieces, after the shops — a shopper who has just read four shop names
   * should be able to see what is actually on their shelves without choosing
   * one first.
   *
   * FROM THE SHOPS THEMSELVES, not from search: `/v1/search/products` requires
   * a query of at least one character, so there is no endpoint that lists the
   * catalogue. Two pieces from each of the first four shops keeps one shop
   * from filling the row, and `allSettled` keeps one unreachable shop from
   * emptying it.
   *
   * Sequential after the brand read, because it needs the slugs. One extra
   * round trip on a page that is cached for five minutes.
   */
  const shopPicks = await Promise.allSettled(
    shops.slice(0, 4).map((shop) => fetchBrandProducts(shop.slug, { page: 1, perPage: 4 }))
  );

  const pieces = shopPicks
    .flatMap((result, index) =>
      result.status === "fulfilled"
        ? result.value.items.slice(0, 2).map((product) => ({ product, shop: shops[index] }))
        : []
    )
    .slice(0, 8);

  const t = (ar: string, en: string) => (locale === "ar" ? ar : en);

  return (
    <Shell>
      <Hero locale={locale} />

      {/* ── الأقسام ─────────────────────────────────────────────────────────
          A RAIL at every width. This screen is the way in, not the index: the
          rail says there are more categories than fit and hands the full set to
          `/categories`, where the same drawings get a whole cell each.

          Rendered only when there are categories — the outage distinction that
          matters on this screen is the shops one below, which is the section a
          shopper came for. */}
      {cats.length > 0 ? (
        <section aria-labelledby="home-cats">
          <div className="lq-band lq-home__head">
            <div className="lq-sec__head">
              <div>
                <h2 className="lq-sec__title" id="home-cats">
                  {t("الأقسام", "Categories")}
                </h2>
                <p className="lq-eyebrow">
                  {t(
                    "اتفرّج على الرفوف حسب النوع.",
                    "Browse the shelves by kind."
                  )}
                </p>
              </div>
              <Link className="lq-sec__more" href="/categories">
                {t("كل الأقسام", "All categories")}
              </Link>
            </div>
          </div>

          {/* The same `.lq-tile` the category index uses, laid into a hairline
              rail instead of a hairline grid. The kind is hashed off the slug,
              so a category keeps the same drawing here and on `/categories`.

              NOT LINKS, for the reason spelled out at length on
              `/categories`: the search API has no category filter and cannot
              be given one from here, so `/search?category=<slug>` was a tile
              that opened an empty search box. The rail names what the shops
              sell; `كل الأقسام` above and the shops below are the ways in that
              work. */}
          <div className="lq-crail lq-band">
            {cats.map((category, index) => (
              <div key={category.id}>
                <div
                  className="lq-tile lq-tile--static lq-rv"
                  style={
                    {
                      /* Modulo, not the raw index: a rail shows about six cells
                         at a time, and a straight stagger would leave the
                         twelfth category sitting visible and unanimated for
                         three-quarters of a second after it scrolls in. */
                      "--lq-d": `${(index % 6) * 70}ms`,
                    } as React.CSSProperties
                  }
                >
                  <span className="lq-tile__art">
                    <Garment className="lq-garment" kind={garmentFor(category.slug)} />
                  </span>
                  <span className="lq-tile__name" data-bidi>
                    {category.name[locale] ?? category.name.ar ?? category.name.en}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* ── المحلات ───────────────────────────────────────────────────────── */}
      <section aria-labelledby="home-shops">
        <div className="lq-band lq-home__head">
          <div className="lq-sec__head">
            <div>
              <h2 className="lq-sec__title" id="home-shops">
                {t("المحلات", "Shops")}
              </h2>
              <p className="lq-eyebrow">
                {t(
                  "محلات ليها عناوين حقيقية تقدر تعدّي عليها.",
                  "Shops with real addresses you could walk to."
                )}
              </p>
            </div>
            {/* Rendered whatever the fetch did. The list below is the first
                page of twenty-four, and `/shops` is still the right destination
                when it is empty or the read failed. */}
            <Link className="lq-sec__more" href="/shops">
              {t("كل المحلات", "All shops")}
            </Link>
          </div>
        </div>

        {shopsFailed ? (
          /*
            The API could not be reached. Says so plainly rather than pretending
            the marketplace is empty — and names the retry, because this is a
            page a shopper WILL reload.
          */
          <div className="lq-wrap lq-pad">
            <p className="lq-hint lq-hint--error" role="alert">
              {t(
                "مش قادرين نوصل للمحلات دلوقتي. حدّث الصفحة بعد شوية.",
                "We cannot reach the shops right now. Reload in a moment."
              )}
            </p>
          </div>
        ) : shops.length === 0 ? (
          /* Describes what will appear, not the emptiness. */
          <div className="lq-wrap lq-pad">
            <p className="lq-hint">
              {t(
                "المحلات اللي بتوصّل لمنطقتك هتظهر هنا.",
                "Shops that deliver to your area show up here."
              )}
            </p>
          </div>
        ) : (
          /* `ShopCard` — the one shop object, the same card `/shops` renders,
             so the two cannot drift into two ideas of what a shop is.

             It takes `shop`, `locale` and `delayMs` and NOTHING else here.
             `publicBrandSchema` carries id, slug, name, logoUrl, coverUrl and
             description, so a neighbourhood, a street, opening hours, an
             open/closed flag or a piece count would all have to be invented.
             A shopper who picks a shop because the card said الزمالك and finds
             out otherwise at checkout has been lied to by the one screen this
             product asks her to trust. The card renders each of those fields
             the day the API answers it, and not one release before. */
          <div className="lq-shops lq-band" data-cols={Math.min(shops.length, 4)}>
            {shops.map((shop, index) => (
              /* The cell, so the card stretches to the tallest in the row: a
                 shop with a one-line description and one with a three-line one
                 would otherwise leave a band of bare paper under the shorter
                 card, inside a frame made of hairlines. */
              <div key={shop.id}>
                <ShopCard shop={shop} locale={locale} delayMs={(index % 4) * 70} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── القطع ────────────────────────────────────────────────────────────
          Rendered only when the shops answered with something. An empty
          product grid under a full shop rail says the shelves are bare, which
          is a different claim from "we could not read them". */}
      {pieces.length > 0 ? (
        <section aria-labelledby="home-pieces">
          <div className="lq-band lq-home__head">
            <div className="lq-sec__head">
              <div>
                <h2 className="lq-sec__title" id="home-pieces">
                  {t("القطع", "Pieces")}
                </h2>
                <p className="lq-eyebrow">
                  {t(
                    "من رفوف المحلات اللي فوق.",
                    "From the shelves of the shops above."
                  )}
                </p>
              </div>
              <Link className="lq-sec__more" href="/search">
                {t("دوّر على قطعة", "Search for a piece")}
              </Link>
            </div>
          </div>

          <div className="lq-pgrid lq-band lq-pgrid--home" data-cols={Math.min(pieces.length, 4)}>
            {pieces.map(({ product, shop }, index) => (
              <ProductCard
                key={product.id}
                product={product}
                brandSlug={shop.slug}
                brandName={shop.name}
                locale={locale}
                delayMs={(index % 4) * 70}
              />
            ))}
          </div>
        </section>
      ) : null}

      {/* The board leaves this much air under the last row before the footer. */}
      <div style={{ blockSize: "var(--space-16)" }} />
    </Shell>
  );
}
