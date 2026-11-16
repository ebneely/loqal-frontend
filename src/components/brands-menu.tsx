"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { fetchBrands, queryKeys } from "@/lib/catalog";
import { useLocale } from "@/lib/locale-context";
import { initialsOf } from "@/components/shop-card";
import { MegaMenu } from "@/components/mega-menu";
import { Distance } from "@/components/nearest";
import { nearestKm, useDeliveryLocation } from "@/lib/delivery-location";

/**
 * المحلات, as the rail of shops it is.
 *
 * The A–Z index it replaced was built for an alphabet and given five shops, so
 * the panel was a row of headings over an empty field with a feature pane
 * stranded at one edge. A shop is a place, so each cell is the same object the
 * shops section shows: the shop's photograph in a 16:10 band, its logo on a
 * stone notch in the corner of that band, and — with no photograph — its
 * initials alone. The logo is never the tile itself; a rail of five brand
 * logos is a rail of five different colour schemes.
 *
 * ONE PAGE OF SHOPS. `/v1/brands` is paged and this shows page 1; an index
 * that silently omitted page 2 would be wrong, so when the shop count outgrows
 * a page this needs its own endpoint rather than a bigger `perPage`.
 */
export function BrandsMenu() {
  const locale = useLocale();

  const { data, isPending, isError } = useQuery({
    queryKey: queryKeys.brands(1),
    queryFn: () => fetchBrands(1, 24),
    staleTime: 5 * 60 * 1000,
  });

  /* Promoted first — placement Loqal sold is placement Loqal shows — then
     nearest to the chosen delivery location (shops with no point after those
     with one), then by name, so the order is a decision rather than whatever
     the page returned. */
  const here = useDeliveryLocation();
  const shops = useMemo(() => {
    const items = data?.items ?? [];
    const km = (shop: (typeof items)[number]) => nearestKm(here, [shop.location]) ?? Infinity;
    return [...items].sort(
      (a, b) =>
        Number(b.isPromoted) - Number(a.isPromoted) ||
        km(a) - km(b) || // Infinity − Infinity is NaN, which falls through to the name
        a.name.localeCompare(b.name),
    );
  }, [data, here]);

  return (
    <MegaMenu
      id="shops"
      href="/shops"
      label={locale === "ar" ? "المتاجر" : "Shops"}
      wide
    >
      {shops.length === 0 ? (
        isPending ? (
          <div className="lq-catrail" aria-hidden="true">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <span className="lq-catrail__item" key={i}>
                <span className="lq-skel lq-catrail__art lq-catrail__sign" />
                <span className="lq-skel" style={{ blockSize: "12px", inlineSize: "60%" }} />
              </span>
            ))}
          </div>
        ) : (
          <p className="lq-hint" role={isError ? "alert" : undefined}>
            {isError
              ? locale === "ar"
                ? "تعذّر الوصول إلى المتاجر الآن."
                : "We cannot reach the shops right now."
              : locale === "ar"
                ? "ستظهر المتاجر هنا فور افتتاحها."
                : "Shops show up here as they open."}
          </p>
        )
      ) : (
        <>
          <div className="lq-catrail">
            {shops.map((shop, index) => (
              <Link
                key={shop.id}
                className="lq-catrail__item"
                href={`/shop/${shop.slug}`}
                style={{ "--lq-d": `${index * 45}ms` } as React.CSSProperties}
              >
                <span
                  className="lq-catrail__art lq-catrail__sign"
                  data-none={shop.images[0] ?? shop.coverUrl ? undefined : "true"}
                  aria-hidden="true"
                >
                  {/* The photo alone. A logo stamped on its corner put a second,
                      smaller picture inside the first — and most logos are a
                      block of initials, which read as a broken badge. */}
                  {shop.images[0] ?? shop.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      className="lq-catrail__shot"
                      src={shop.images[0] ?? shop.coverUrl ?? undefined}
                      alt=""
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <b>{initialsOf(shop.name)}</b>
                  )}
                </span>
                <span className="lq-catrail__name" data-bidi>
                  {shop.name}
                </span>
                <Distance points={[shop.location]} className="lq-dist lq-catrail__in" />
                {shop.isPromoted ? (
                  <span className="lq-catrail__in">
                    {locale === "ar" ? "إعلان" : "Promoted"}
                  </span>
                ) : null}
              </Link>
            ))}
          </div>

          <Link className="lq-mega__all" href="/shops">
            {locale === "ar" ? "كل المتاجر" : "All shops"}
          </Link>
        </>
      )}
    </MegaMenu>
  );
}
