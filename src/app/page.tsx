import type { Metadata } from "next";
import Link from "next/link";

import type { PublicBrand, PublicProduct } from "@loqal/contracts/storefront.contract";
import { fetchBrands, fetchBrandProducts, fetchCategories } from "@/lib/catalog";
import { getLocale } from "@/lib/locale-server";
import { initialsOf, shopCount, shopFacts } from "@/lib/shop-hours";
import { Shell } from "@/components/shell";
import { Hero } from "@/components/hero";
import { ProductCard } from "@/components/product-card";
import { ProductPhoto } from "@/components/product-photo";
import { Garment, garmentFor } from "@/components/garment";
import { Money } from "@/components/money";
import { EmptyState } from "@/components/state";
import { ReloadButton } from "@/components/reload";
import { Distance, NearestFirst } from "@/components/nearest";

/**
 * NOT ISR, and it cannot be: the language comes from a cookie, so the HTML is
 * per-reader. `revalidate` asked Next to cache one copy of it, which threw
 * DYNAMIC_SERVER_USAGE on every request.
 *
 * The catalogue reads keep their own `next: { revalidate }`, so a request
 * costs a render and no database round trip.
 */

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const photoOf = (shop: PublicBrand) => shop.images[0] ?? shop.coverUrl ?? null;

/**
 * Home: the hero, where to shop, what just arrived, one shop up close, and how
 * one bag holds several shops.
 */
export default async function HomePage() {
  const locale = await getLocale();
  const t = (ar: string, en: string) => (locale === "ar" ? ar : en);

  /**
   * THE FAILURE IS CARRIED, NOT SWALLOWED. A rejected shop read is `null`, not
   * `[]`, so an unreachable API and a brand-new marketplace never look the
   * same. Categories are only the hero's quick links; the header reads the
   * same cached list, and losing them costs nothing else on the page.
   */
  const [page, categories] = await Promise.all([
    fetchBrands(1, 24).then(
      (result) => result,
      () => null,
    ),
    fetchCategories().then(
      (result) => result,
      () => [],
    ),
  ]);

  const shops = page?.items ?? [];
  const shopsFailed = page === null;

  /**
   * The pieces come FROM THE SHOPS THEMSELVES, not from search: search refuses
   * a request with neither a query nor a category, and there is no category
   * that means "everything". Two from each of the first four shops keeps one
   * shop from filling the grid; `allSettled` keeps one unreachable shop from
   * emptying it. Newest first, because the section says "just arrived".
   */
  const shopPicks = await Promise.allSettled(
    shops
      .slice(0, 4)
      .map((shop) => fetchBrandProducts(shop.slug, { page: 1, perPage: 4 })),
  );

  const pieces = shopPicks
    .flatMap((result, index) =>
      result.status === "fulfilled"
        ? result.value.items
            .slice(0, 2)
            .map((product) => ({ product, shop: shops[index] }))
        : [],
    )
    .sort((a, b) => b.product.updatedAt.localeCompare(a.product.updatedAt))
    .slice(0, 5);

  /* The photographs: the hero plate, the small inset, the featured band.
     Different shops where there are enough of them. */
  const withPhoto = shops.filter((shop) => photoOf(shop));
  const heroShop = withPhoto[0] ?? null;
  const insetShop = withPhoto[1] ?? null;
  const featured =
    shops.find((shop) => shop.isPromoted) ?? withPhoto[2] ?? withPhoto[0] ?? shops[0] ?? null;

  /**
   * Where to shop: shops grouped by the neighbourhood they gave. Until at
   * least two shops have said where they are, a list of one area would be a
   * thin claim, so the list names the shops themselves instead.
   */
  const areaMap = new Map<string, PublicBrand[]>();
  for (const shop of shops) {
    if (!shop.neighbourhood) continue;
    areaMap.set(shop.neighbourhood, [...(areaMap.get(shop.neighbourhood) ?? []), shop]);
  }
  const areas = [...areaMap].map(([name, list]) => ({
    name,
    count: list.length,
    photo: list.map(photoOf).find(Boolean) ?? null,
    points: list.map((shop) => shop.location),
  }));

  /* The story needs two real pieces from two different shops, both priced. */
  const first = pieces.find((p) => p.product.priceFrom);
  const second = first
    ? pieces.find((p) => p.shop.id !== first.shop.id && p.product.priceFrom)
    : undefined;
  const pair = first && second ? [first, second] : null;

  return (
    <Shell>
      <Hero
        locale={locale}
        photo={heroShop ? { url: photoOf(heroShop)!, shop: heroShop.name } : null}
        inset={insetShop ? { url: photoOf(insetShop)!, shop: insetShop.name } : null}
        links={categories.slice(0, 5).map((category) => ({
          label: category.name[locale] ?? category.name.ar ?? category.name.en ?? category.slug,
          href: `/search?category=${encodeURIComponent(category.slug)}`,
        }))}
      />

      {/* ── Where to shop ──────────────────────────────────────────────── */}
      <section className="lq-home__sec" aria-labelledby="home-areas">
        <header className="lq-sec__head lq-home__head">
          <h2 className="lq-sec__title" id="home-areas">
            {t("من أين تتسوّق اليوم؟", "Where are you shopping today?")}
          </h2>
          <Link className="lq-textlink" href="/shops">
            {t("كل المتاجر", "All shops")}
          </Link>
        </header>

        {shopsFailed ? (
          <EmptyState
            art="crooked"
            tone="loud"
            role="alert"
            seed="home-shops-down"
            title={t("تعذّر الوصول إلى المتاجر الآن", "We cannot reach the shops right now")}
            body={t(
              "المتاجر تعمل، والخلل في اتصالنا بها في هذه اللحظة.",
              "The shops are open — we are the ones who cannot reach them this second.",
            )}
            actions={<ReloadButton>{t("أعد المحاولة", "Try again")}</ReloadButton>}
          />
        ) : shops.length === 0 ? (
          <EmptyState
            art="shelf"
            seed="home-shops-empty"
            title={t("لا يوجد متجر هنا بعد", "No shops here yet")}
            body={t(
              "ستظهر هنا المتاجر التي توصّل إلى منطقتك فور افتتاحها.",
              "Shops that deliver to your area show up here as they open.",
            )}
            actions={
              <Link className="lq-btn lq-btn--secondary" href="/categories">
                {t("تصفّح الأقسام", "Browse the categories")}
              </Link>
            }
          />
        ) : (
          <ul className="lq-biglist">
            {/* Nearest first (an area by its nearest shop) once a delivery
                location is chosen; worked out in the browser. */}
            <NearestFirst
              points={areas.length >= 2 ? areas.map((area) => area.points) : shops.map((shop) => [shop.location])}
            >
            {areas.length >= 2
              ? areas.map((area) => (
                  <li key={area.name}>
                    <Link className="lq-biglist__row" href={`/shops?area=${encodeURIComponent(area.name)}`}>
                      <span className="lq-biglist__thumb" aria-hidden="true">
                        {area.photo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={area.photo} alt="" loading="lazy" />
                        ) : null}
                      </span>
                      <b className="lq-biglist__name" data-bidi>
                        {area.name}
                      </b>
                      <span className="lq-biglist__n">
                        {shopCount(area.count, locale)}
                        <Distance points={area.points} />
                      </span>
                    </Link>
                  </li>
                ))
              : shops.map((shop) => {
                  const photo = photoOf(shop);
                  const note =
                    shop.neighbourhood ??
                    shop.description?.[locale] ??
                    shop.description?.ar ??
                    shop.description?.en ??
                    null;
                  return (
                    <li key={shop.id}>
                      <Link className="lq-biglist__row" href={`/shop/${shop.slug}`}>
                        <span className="lq-biglist__thumb" aria-hidden="true">
                          {photo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={photo} alt="" loading="lazy" />
                          ) : (
                            <span className="lq-biglist__initials">{initialsOf(shop.name)}</span>
                          )}
                        </span>
                        <b className="lq-biglist__name" data-bidi>
                          {shop.name}
                        </b>
                        {note || shop.location ? (
                          <span className="lq-biglist__n" data-bidi>
                            {note}
                            <Distance points={[shop.location]} />
                          </span>
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
            </NearestFirst>
          </ul>
        )}
      </section>

      {/* ── Just arrived ───────────────────────────────────────────────────
          Only when the shops answered with something: an empty grid under a
          full shop list says the shelves are bare, a different claim. */}
      {pieces.length > 0 ? (
        <section className="lq-home__sec" aria-labelledby="home-pieces">
          <header className="lq-sec__head lq-home__head">
            <h2 className="lq-sec__title" id="home-pieces">
              {t("وصل حديثًا إلى الرفوف", "Just in on the shelves")}
            </h2>
            <Link className="lq-textlink" href="/search">
              {t("ابحث عن قطعة", "Search for a piece")}
            </Link>
          </header>

          <div className="lq-feed lq-feed--bleed" data-lead={pieces.length >= 5 ? "true" : undefined}>
            {pieces.map(({ product, shop }, index) => (
              <ProductCard
                key={product.id}
                product={product}
                brandSlug={shop.slug}
                brandName={shop.name}
                area={shop.neighbourhood}
                locale={locale}
                priority={index === 0}
                delayMs={(index % 4) * 70}
              />
            ))}
          </div>
        </section>
      ) : null}

      {/* ── One shop up close ─────────────────────────────────────────────── */}
      {featured ? <Featured shop={featured} locale={locale} /> : null}

      {/* ── One bag, several shops ─────────────────────────────────────────
          Two real pieces from two real shops, labelled as an example. No
          invented statuses: the line says what each piece is and costs. */}
      {pair ? (
        <section className="lq-home__sec lq-story" aria-labelledby="home-story">
          <div>
            <h2 className="lq-story__title" id="home-story">
              {t("سلة واحدة، من عدة متاجر", "One bag, from several shops")}
            </h2>
            <p className="lq-story__lede">
              {t(
                "يراجع كل متجر رفوفه ويرسل قطعه بنفسه، فتعرف حالة كل جزء من طلبك.",
                "Each shop checks its own shelf and sends its own pieces, so you can follow every part of your order.",
              )}
            </p>
          </div>

          <figure className="lq-split">
            {pair.map(({ product, shop }) => (
              <StoryLine key={product.id} product={product} shop={shop} locale={locale} />
            ))}
            <div className="lq-split__total">
              <span>{t("المجموع قبل التوصيل", "Total before delivery")}</span>
              <Money
                amount={(Number(pair[0].product.priceFrom) + Number(pair[1].product.priceFrom)).toFixed(2)}
                locale={locale}
              />
            </div>
            <figcaption className="lq-split__cap">
              {t(
                "مثال من رفوف اليوم: قطعتان من متجرين، في سلة واحدة.",
                "An example from today’s shelves: two pieces from two shops, in one bag.",
              )}
            </figcaption>
          </figure>
        </section>
      ) : null}
    </Shell>
  );
}

function Featured({ shop, locale }: { shop: PublicBrand; locale: "ar" | "en" }) {
  const t = (ar: string, en: string) => (locale === "ar" ? ar : en);
  const photo = photoOf(shop);
  const about = shop.description?.[locale] ?? shop.description?.ar ?? shop.description?.en ?? null;
  const facts = shopFacts(shop, locale).slice(0, 3);

  return (
    <section className="lq-feature" aria-labelledby="home-feature">
      <div className="lq-feature__ph">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt={t(`من متجر ${shop.name}`, `Inside ${shop.name}`)} loading="lazy" />
        ) : (
          <span className="lq-feature__mark" aria-hidden="true">
            {initialsOf(shop.name)}
          </span>
        )}
      </div>
      <div className="lq-feature__tx">
        <div>
          {shop.isPromoted ? (
            <span className="lq-badge lq-badge--tint">{t("إعلان", "Promoted")}</span>
          ) : null}
          <Distance points={[shop.location]} className="lq-dist lq-feature__dist" />
          <h2 className="lq-feature__name" id="home-feature" data-bidi>
            {shop.name}
          </h2>
          {about ? (
            <p className="lq-feature__about" data-bidi>
              {about}
            </p>
          ) : null}
        </div>
        <div>
          <dl className="lq-facts">
            {facts.map((fact) => (
              <div key={fact.note}>
                <dt>{fact.value}</dt>
                <dd>{fact.note}</dd>
              </div>
            ))}
          </dl>
          <Link className="lq-btn lq-btn--onbrand lq-btn--lg" href={`/shop/${shop.slug}`}>
            {t("ادخل المتجر", "Enter the shop")}
          </Link>
        </div>
      </div>
    </section>
  );
}

function StoryLine({
  product,
  shop,
  locale,
}: {
  product: PublicProduct;
  shop: PublicBrand;
  locale: "ar" | "en";
}) {
  const name = product.name?.[locale] ?? product.name?.ar ?? product.name?.en ?? "";
  return (
    <Link className="lq-split__line" href={`/shop/${shop.slug}/${product.slug}`}>
      <span className="lq-split__th">
        {product.coverUrl ? (
          <ProductPhoto src={product.coverUrl} alt="" productId={product.id} sizes="76px" />
        ) : (
          <Garment className="lq-garment" kind={garmentFor(product.id)} />
        )}
      </span>
      <span className="lq-split__body">
        <b data-bidi>{shop.name}</b>
        <small data-bidi>
          {shop.neighbourhood ? `${name} · ${shop.neighbourhood}` : name}
        </small>
      </span>
      <Money className="lq-split__pr" amount={product.priceFrom} locale={locale} />
    </Link>
  );
}
