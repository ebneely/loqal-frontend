import type { Metadata } from "next";
import Link from "next/link";

import { fetchBrands, fetchCategories } from "@/lib/catalog";
import { defaultLocale } from "@/lib/locale";
import { Shell } from "@/components/shell";
import { ShopCard } from "@/components/shop-card";
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
 * A rail cell has to be told how wide it is.
 *
 * `.lq-rail > *` is `flex:none`, which leaves a cell at its content width — so
 * a two-word category and a five-word one would be two different sizes in the
 * same hairline row, and the shared 1px edges would land on no rhythm at all.
 * These are the two widths from `design/index.html` (`#rail1 .item`,
 * `#rail2 .shopcard`), carried here as inline sizes because a rail cell width
 * is not in the `lq-*` layer and this file may not add to it.
 */
const CAT_CELL = "clamp(104px, 12vw, 140px)";
const SHOP_CELL = "clamp(224px, 22vw, 272px)";

export default async function HomePage() {
  const locale = defaultLocale;

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

        {/* ── الأقسام ───────────────────────────────────────────────────────
            A RAIL, not the 4-up grid `/categories` uses. This screen is the way
            in, not the index: the rail says there are more categories than fit
            and hands the full set to `/categories`, where the same drawings get
            a whole cell each.

            Rendered only when there are categories — the same condition as
            before. The outage distinction that matters on this screen is the
            shops one below, which is the section a shopper came for. */}
        {cats.length > 0 ? (
          <section className="lq-sec" aria-labelledby="home-cats">
            <div className="lq-sec__head">
              <div>
                <h2 className="lq-sec__title" id="home-cats">
                  {locale === "ar" ? "الأقسام" : "Categories"}
                </h2>
                <p className="lq-eyebrow">
                  {locale === "ar"
                    ? "كل قطعة على رف في محل — مش في مخزن."
                    : "Every piece is on a shelf in a shop, not in a warehouse."}
                </p>
              </div>
              <Link className="lq-btn lq-btn--ghost lq-btn--sm" href="/categories">
                {locale === "ar" ? "كل الأقسام" : "All categories"}
              </Link>
            </div>

            {/* The drawing IS the content, so it gets the cell — the same
                `.lq-tile` the category index uses, laid into a hairline rail
                instead of a hairline grid. The kind is hashed off the slug, so
                a category keeps the same drawing here and on `/categories`. */}
            <div className="lq-rail">
              {cats.map((category, index) => (
                <Link
                  key={category.id}
                  href={`/search?category=${encodeURIComponent(category.slug)}`}
                  className="lq-tile lq-rv"
                  style={
                    {
                      /* Modulo, not the raw index: a rail shows about six cells
                         at a time, and a straight stagger would leave the
                         twelfth category sitting visible and unanimated for
                         three-quarters of a second after it scrolls in. */
                      "--lq-d": `${(index % 6) * 70}ms`,
                      inlineSize: CAT_CELL,
                    } as React.CSSProperties
                  }
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
          </section>
        ) : null}

        {/* ── المحلات ─────────────────────────────────────────────────────── */}
        <section className="lq-sec" aria-labelledby="home-shops">
          <div className="lq-sec__head">
            <div>
              <h1 className="lq-sec__title" id="home-shops">
                {locale === "ar" ? "المحلات" : "Shops"}
              </h1>
              <p className="lq-eyebrow">
                {locale === "ar"
                  ? "محلات ليها عناوين حقيقية تقدر تعدّي عليها."
                  : "Shops with real addresses you could walk to."}
              </p>
            </div>
            {/* Rendered whatever the fetch did. The rail below is the first page
                of twenty-four, and `/shops` is still the right destination when
                the rail is empty or the read failed. */}
            <Link className="lq-btn lq-btn--ghost lq-btn--sm" href="/shops">
              {locale === "ar" ? "كل المحلات" : "All shops"}
            </Link>
          </div>

          {shopsFailed ? (
            /*
              The API could not be reached. Says so plainly rather than
              pretending the marketplace is empty — and names the retry, because
              this is a page a shopper WILL reload.
            */
            <p className="lq-hint lq-hint--error" role="alert">
              {locale === "ar"
                ? "مش قادرين نوصل للمحلات دلوقتي. حدّث الصفحة بعد شوية."
                : "We cannot reach the shops right now. Reload in a moment."}
            </p>
          ) : shops.length === 0 ? (
            /* Describes what will appear, not the emptiness. */
            <p className="lq-hint">
              {locale === "ar"
                ? "المحلات اللي بتوصّل لمنطقتك هتظهر هنا."
                : "Shops that deliver to your area show up here."}
            </p>
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
            <div className="lq-rail">
              {shops.map((shop, index) => (
                /* A one-cell grid, so the card stretches to the tallest cell in
                   the rail: a shop with a one-line description and one with a
                   three-line one would otherwise leave a band of bare paper
                   under the shorter card, inside a frame made of hairlines. */
                <div key={shop.id} style={{ inlineSize: SHOP_CELL, display: "grid" }}>
                  <ShopCard shop={shop} locale={locale} delayMs={(index % 4) * 70} />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </Shell>
  );
}
