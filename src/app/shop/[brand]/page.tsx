import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ApiError } from "@/lib/api";
import { fetchBrand, fetchBrandProducts } from "@/lib/catalog";
import { getLocale } from "@/lib/locale-server";
import { pieceCount, ratingLine, shopFacts } from "@/lib/shop-hours";
import { Shell } from "@/components/shell";
import { ProductCard } from "@/components/product-card";
import { FavButton } from "@/components/fav-button";
import { ShopReviews } from "@/components/shop-reviews";
import { TrackView } from "@/components/track-view";

/**
 * NOT ISR, and it cannot be: the language comes from a cookie, so the HTML is
 * per-reader. `revalidate` (and, on the shop routes, an empty
 * `generateStaticParams`) asked Next to cache one copy of it, which threw
 * DYNAMIC_SERVER_USAGE on every request — a 500 on the shop pages and a
 * "we cannot reach the categories" on the ones that catch their own errors.
 *
 * The catalogue reads keep their own `next: { revalidate }`, so a request
 * costs a render and no database round trip.
 */

type Params = { brand: string };

/**
 * The shop and its first page of stock, in ONE round trip's worth of latency.
 *
 * Two reads rather than one because the products endpoint answers products and
 * nothing else — it carries no brand name — and the page was printing the URL
 * SLUG in every place the name belongs. `Promise.all`, not sequential awaits:
 * neither read depends on the other and serialising them would add an API
 * round trip to the render on Egyptian mobile data.
 *
 * A 404 from EITHER read is the shop not existing, which is `notFound()` and
 * not a 500 — the same rule the product page states. Anything else keeps its
 * stack and reaches `error.tsx`.
 */
async function load(slug: string) {
  try {
    const [brand, products] = await Promise.all([
      fetchBrand(slug),
      fetchBrandProducts(slug, { page: 1, perPage: 24 }),
    ]);
    return { brand, products };
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound) return null;
    throw error;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { brand } = await params;
  const canonical = `/shop/${brand}`;

  /**
   * The NAME, never the slug. A title of "zara-zamalek" is what a search
   * result and a shared WhatsApp link were both showing. If the shop cannot be
   * read the page below is a 404 anyway, so this falls back to the neutral
   * title rather than printing the address as a name.
   */
  const page = await load(brand);
  if (!page) return { title: "الصفحة غير موجودة" };

  const name = page.brand.name;
  const description =
    page.brand.description?.ar ??
    page.brand.description?.en ??
    `تسوّق من ${name} على loqaaal — توصيل في اليوم نفسه من متاجر القاهرة والجيزة.`;

  return {
    title: name,
    description,
    alternates: {
      canonical,
      languages: { ar: canonical, en: `${canonical}?lang=en` },
    },
    openGraph: {
      type: "website",
      url: canonical,
      locale: "ar_EG",
      title: name,
      description,
      // The shop's own cover if it has one. Without it a shared link is a
      // grey card; nothing is invented when it is null.
      images: page.brand.coverUrl ? [{ url: page.brand.coverUrl, alt: name }] : undefined,
    },
  };
}

export default async function ShopPage({ params }: { params: Promise<Params> }) {
  const { brand } = await params;
  const page = await load(brand);
  if (!page) notFound();

  const locale = await getLocale();
  const ar = locale === "ar";
  const t = (arText: string, en: string) => (ar ? arText : en);
  /** The shop's own name. `brand` stays what it is — the slug in the URL. */
  const name = page.brand.name;
  const photo = page.brand.images[0] ?? page.brand.coverUrl ?? null;
  const about =
    page.brand.description?.[locale] ?? page.brand.description?.ar ?? page.brand.description?.en ?? null;
  /* Only what the shop has said: its area and hours once it gives them, its
     delivery terms until then. Never an invented address. */
  const facts = shopFacts(page.brand, locale).slice(0, 3);
  const { items, total } = page.products;
  const rating = ratingLine(page.brand.rating, locale);

  return (
    <Shell title={name}>
      <TrackView type="BRAND_VIEW" brandId={page.brand.id} />
      {/*
        The shop sign: its own photograph full-bleed, darkened from the foot so
        the name reads white over any picture. No photo is a green plate.

        The NAME comes from `fetchBrand`, not from the route param — the slug
        is the address and stays in the URL.
      */}
      <section className="lq-shophero" data-photo={photo ? "true" : undefined}>
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="" fetchPriority="high" />
        ) : null}
        <div className="lq-shophero__in">
          {/* The trail back out. A shopper who arrived on a shop from a search
              result has no other way up to the shop index. */}
          <nav className="lq-shophero__crumb" aria-label={t("مسار التصفح", "Breadcrumb")}>
            <Link href="/">{t("الرئيسية", "Home")}</Link>
            <span aria-hidden="true">/</span>
            <Link href="/shops">{t("المتاجر", "Shops")}</Link>
          </nav>
          <h1 className="lq-shophero__name" data-bidi>
            {name}
          </h1>
          <div className="lq-shophero__acts">
            {rating ? (
              <a className="lq-shophero__rating" href="#reviews" data-num>
                {rating}
              </a>
            ) : null}
            <FavButton
              label={name}
              target={{ kind: "shop", item: { id: page.brand.id, slug: page.brand.slug, name } }}
            />
          </div>
          <dl className="lq-facts">
            {facts.map((fact) => (
              <div key={fact.note}>
                <dt>{fact.value}</dt>
                <dd>{fact.note}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <p className="lq-lede lq-shoplede" data-bidi>
        {about ? `${about} ` : ""}
        {t(
          "يجهّز هذا المتجر طلبك ويرسله بنفسه من رفوفه.",
          "This shop prepares your order and sends it itself, from its own shelves.",
        )}
      </p>

      <section className="lq-home__sec" aria-labelledby="shop-pieces">
        <header className="lq-sec__head lq-home__head">
          <h2 className="lq-sec__title" id="shop-pieces">
            {t("قطع المتجر", "In this shop")}
          </h2>
          {total > 0 ? <span className="lq-biglist__n">{pieceCount(total, locale)}</span> : null}
        </header>

        {items.length === 0 ? (
          /* Describes what will appear, never the emptiness. */
          <p className="lq-shopempty">
            {t(
              "لم يعرض المتجر قطعًا بعد. ستظهر هنا أول قطعة يضيفها.",
              "This shop has not listed anything yet. The first piece it adds shows up here.",
            )}
          </p>
        ) : (
          <div className="lq-feed">
            {items.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                brandSlug={brand}
                brandName={name}
                area={page.brand.neighbourhood}
                locale={locale}
                /* The first row is the LCP. Everything below it stays lazy. */
                priority={index < 2}
                /* Staggered by column, so a row enters as a row. */
                delayMs={(index % 4) * 70}
              />
            ))}
          </div>
        )}

        {/* The catalogue is paged and this screen shows page one. Said out loud
            rather than left as a silent truncation. */}
        {total > items.length ? (
          <p className="lq-hint lq-browsebody__more">
            {t(
              `تعرض هذه الصفحة أول ${items.length} قطعة من ${total}.`,
              `Showing the first ${items.length} of ${total} pieces.`,
            )}
          </p>
        ) : null}
      </section>

      <ShopReviews brandId={page.brand.id} rating={page.brand.rating} />
    </Shell>
  );
}
