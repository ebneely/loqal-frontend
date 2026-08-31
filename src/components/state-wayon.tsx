"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { fetchBrands, fetchCategories, queryKeys } from "@/lib/catalog";
import type { Locale } from "@/lib/locale";
import { Garment, categoryGarment } from "@/components/garment";
import { Money } from "@/components/money";

/**
 * The dead end that hands over what IS here.
 *
 * A screen that has failed still knows two true things — which shops are
 * trading and which shelves exist — and both are one cached read away, because
 * `/v1/brands` and `/v1/categories` are the reads that drew the tiles that got
 * her here. So the vertical space that would hold a drawing holds the way on.
 *
 * NOTHING IS INVENTED. `publicBrandSchema` carries no street and no
 * neighbourhood, so no shop row claims one; what it does carry is the delivery
 * fee and the return window, which is a number a shopper can act on and
 * exactly what this brand's voice would rather say than an adjective.
 *
 * The sibling categories are the ones sharing this category's `parentId` —
 * the shelves either side of the one she walked up to, not the whole index.
 */
export function StateWayOn({
  categorySlug,
  categoryName,
  locale,
  onSearchName,
  t,
}: {
  categorySlug: string;
  categoryName: string;
  locale: Locale;
  /** Runs the shelf's own name as a text search, which the API does answer. */
  onSearchName: () => void;
  t: (ar: string, en: string) => string;
}) {
  const categories = useQuery({
    queryKey: queryKeys.categories(),
    queryFn: fetchCategories,
  });
  const brands = useQuery({
    queryKey: queryKeys.brands(1),
    queryFn: () => fetchBrands(1, 24),
  });

  const here = categories.data?.find((entry) => entry.slug === categorySlug);
  const siblings = (categories.data ?? [])
    .filter(
      (entry) =>
        entry.slug !== categorySlug &&
        entry.parentId === (here?.parentId ?? null),
    )
    .slice(0, 6);

  /* Placement Loqal sold is labelled wherever it renders, so a promoted shop
     leads this list the way it leads every other one. */
  const shops = [...(brands.data?.items ?? [])]
    .sort((a, b) => Number(b.isPromoted) - Number(a.isPromoted))
    .slice(0, 4);

  const name = (
    value: { ar?: string | null; en?: string | null } | null | undefined,
  ) => value?.[locale] ?? value?.ar ?? value?.en ?? "";

  return (
    <div className="lq-wayon">
      <section className="lq-wayon__sign" role="alert">
        <div className="lq-wayon__say">
          <h1 className="lq-wayon__title">
            {t(
              `«${categoryName}» موجودة، بس الباب ده لسه مقفول`,
              `${categoryName} are on the shelf. This door to them is not open yet`,
            )}
          </h1>
          <p className="lq-wayon__body">
            {t(
              "السيرفر ده بيرد على البحث بالاسم مش بالقسم. دوّر بالاسم وهترجع تلاقيها، والمحلات تحت شغالة دلوقتي.",
              "This server answers a search by name but not by shelf. Search the name and the same pieces come back; the shops below are trading now.",
            )}
          </p>
          <div className="lq-wayon__acts">
            <button
              type="button"
              className="lq-btn lq-btn--primary"
              onClick={onSearchName}
            >
              {t(`دوّر على «${categoryName}»`, `Search for “${categoryName}”`)}
            </button>
            <Link className="lq-btn lq-btn--secondary" href="/shops">
              {t("اتفرّج على المحلات", "Browse the shops")}
            </Link>
          </div>
        </div>
        <span className="lq-wayon__mark" aria-hidden="true">
          <Garment
            className="lq-garment"
            kind={categoryGarment(categorySlug)}
          />
        </span>
      </section>

      {shops.length > 0 ? (
        <section className="lq-wayon__sec">
          <div className="lq-sec__row">
            <h2 className="lq-sec__title">
              {t("محلات شغالة دلوقتي", "Shops trading now")}
            </h2>
            <Link className="lq-sec__more" href="/shops">
              {t("كل المحلات", "All shops")}
            </Link>
          </div>
          <div className="lq-rows">
            {shops.map((shop) => (
              <Link
                key={shop.id}
                className="lq-row lq-wayon__shop"
                href={`/shop/${shop.slug}`}
              >
                <span className="lq-wayon__logo" aria-hidden="true">
                  {shop.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={shop.logoUrl} alt="" loading="lazy" />
                  ) : (
                    <b>{shop.name.slice(0, 2)}</b>
                  )}
                </span>
                <span className="lq-wayon__shopbody">
                  <span className="lq-wayon__shopname" data-bidi>
                    {shop.name}
                  </span>
                  <span className="lq-hint">
                    {shop.deliveryFee ? (
                      <>
                        {t("التوصيل", "Delivery")}{" "}
                        <Money amount={shop.deliveryFee} locale={locale} />{" "}
                        ·{" "}
                      </>
                    ) : null}
                    {t(
                      `مرتجع خلال ${shop.returnWindowDays} يوم`,
                      `${shop.returnWindowDays}-day returns`,
                    )}
                  </span>
                </span>
                {shop.isPromoted ? (
                  <span className="lq-wayon__tag">
                    {t("مموّل", "Promoted")}
                  </span>
                ) : null}
                <span
                  className="lq-icon lq-row__end"
                  data-icon="chevron-right"
                  aria-hidden="true"
                />
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {siblings.length > 0 ? (
        <section className="lq-wayon__sec">
          <div className="lq-sec__row">
            <h2 className="lq-sec__title">
              {t("رفوف جنبها", "Shelves next door")}
            </h2>
            <Link className="lq-sec__more" href="/categories">
              {t("كل الأقسام", "All categories")}
            </Link>
          </div>
          <div className="lq-tiles">
            {siblings.map((entry) => (
              <Link
                key={entry.id}
                className="lq-tile"
                href={`/search?category=${encodeURIComponent(entry.slug)}`}
              >
                <span className="lq-tile__art">
                  <Garment
                    className="lq-garment"
                    kind={categoryGarment(entry.slug)}
                  />
                </span>
                <span className="lq-tile__name" data-bidi>
                  {name(entry.name)}
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
