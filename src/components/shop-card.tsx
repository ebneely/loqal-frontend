"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { PublicBrand } from "@loqal/contracts/storefront.contract";
import { Money } from "@/components/money";
import { clock, initialsOf, isOpenNow } from "@/lib/shop-hours";
import type { Locale } from "@/lib/locale";

/**
 * The shop card — one object, rendered on the shop index and anywhere else a
 * shop appears, so the surfaces cannot drift into different ideas of what a
 * shop is.
 *
 * IT LEADS WITH THE SHOP'S OWN PHOTOGRAPH, 4:3, then the name in the display
 * face with "open" answering it from the other end of the line, then where it
 * is. A shopper is buying from a place, and the card should look like one.
 * With more than one photo, hovering steps through them.
 *
 * ── Where it is and whether it is open ──────────────────────────────────────
 *
 * `neighbourhood` and `hours` come from the API; "open" is worked out in Cairo
 * time as the card paints, because shop pages are cached and "open" is a fact
 * about the moment somebody looks. The props of the same names still win when
 * a caller passes them. Each renders only if it exists: a shop that has not
 * given its hours shows no status at all, never "closed". NOTHING IS FAKED.
 */
const STEP = 1150;
const SLOTS = 5;

/* Lives in a server-safe module so server pages can call it too; re-exported
   here for the callers that already import it from the card. */
export { initialsOf };

export function ShopCard({
  shop,
  locale,
  delayMs = 0,
  neighbourhood,
  street,
  hours,
  openNow,
  pieceCount,
}: {
  shop: PublicBrand;
  locale: Locale;
  /** Stagger within a revealed group. */
  delayMs?: number;
  neighbourhood?: string | null;
  street?: string | null;
  hours?: string | null;
  openNow?: boolean | null;
  pieceCount?: number | null;
}) {
  const t = (ar: string, en: string) => (locale === "ar" ? ar : en);

  const description =
    shop.description?.[locale] ?? shop.description?.ar ?? shop.description?.en ?? null;

  const where = neighbourhood ?? shop.neighbourhood;
  const open = openNow ?? (shop.hours ? isOpenNow(shop.hours) : null);

  /** The line under the name: the address if we have one, the shop's own
      description if we do not, and nothing at all rather than filler. */
  const place = [where, street].filter(Boolean).join(" · ") || description;

  const gallery = (
    shop.images.length > 0 ? shop.images : shop.coverUrl ? [shop.coverUrl] : []
  ).slice(0, SLOTS);

  const [at, setAt] = useState(0);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running || gallery.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = window.setInterval(() => {
      setAt((n) => (n + 1) % gallery.length);
    }, STEP);
    return () => window.clearInterval(timer);
  }, [running, gallery.length]);

  return (
    <Link
      href={`/shop/${shop.slug}`}
      className="lq-shopcard lq-rv"
      style={{ "--lq-d": `${delayMs}ms` } as React.CSSProperties}
      onPointerEnter={() => setRunning(true)}
      onPointerLeave={() => {
        setRunning(false);
        setAt(0);
      }}
    >
      <span className="lq-shopcard__ph" data-none={gallery.length === 0 ? "true" : undefined}>
        {gallery.length === 0 ? (
          shop.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="lq-shopcard__logo" src={shop.logoUrl} alt="" loading="lazy" decoding="async" />
          ) : (
            <span className="lq-shopcard__mark" aria-hidden="true">
              {initialsOf(shop.name)}
            </span>
          )
        ) : (
          gallery.map((url, index) => (
            /* A plain <img>, not next/image: `remotePatterns` is read from
               LOQAL_MEDIA_HOST, so on any deployment that has not set it every
               shop photo would throw instead of rendering. */
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={index}
              className="lq-shopcard__shot"
              src={url}
              alt=""
              loading="lazy"
              decoding="async"
              data-on={index === at ? "true" : undefined}
            />
          ))
        )}

        {gallery.length > 1 ? (
          <span className="lq-shopcard__ticks" aria-hidden="true">
            {gallery.map((url, index) => (
              <span
                key={index}
                className="lq-shopcard__tick"
                data-done={index < at ? "true" : undefined}
                data-run={running && index === at ? "true" : undefined}
              >
                <i />
              </span>
            ))}
          </span>
        ) : null}

        {/* Placement we sold is labelled wherever it renders. */}
        {shop.isPromoted ? (
          <span className="lq-shopcard__promo lq-badge lq-badge--tint">
            {t("مموّل", "Promoted")}
          </span>
        ) : null}
      </span>

      <span className="lq-shopcard__t">
        <span className="lq-shopcard__name" data-bidi>
          {shop.name}
        </span>

        {/* Only when the flag actually exists — a missing field is NOT closed.
            `suppressHydrationWarning`: "open" is worked out from the clock,
            and the server and the browser can read it a minute apart. */}
        {open === true ? (
          <span className="lq-shopcard__state" data-open="true" suppressHydrationWarning>
            {shop.hours
              ? t(
                  `مفتوح حتى ${clock(shop.hours.closesAt, "ar")}`,
                  `Open until ${clock(shop.hours.closesAt, "en")}`,
                )
              : t("مفتوح الآن", "Open now")}
          </span>
        ) : open === false ? (
          <span className="lq-shopcard__state" data-open="false" suppressHydrationWarning>
            {t("مغلق الآن", "Closed now")}
          </span>
        ) : null}
      </span>

      {place ? (
        <span className="lq-shopcard__place" data-bidi>
          {place}
        </span>
      ) : null}

      <span className="lq-shopcard__terms">
        {shop.deliveryFee != null ? (
          <span>
            {t("التوصيل", "Delivery")}{" "}
            <Money amount={shop.deliveryFee} locale={locale} />
          </span>
        ) : null}
        {hours ? (
          <span dir="ltr" data-num>
            {hours}
          </span>
        ) : null}
        {typeof pieceCount === "number" ? (
          <span data-num>
            {pieceCount} {t("قطعة", "pieces")}
          </span>
        ) : null}
      </span>
    </Link>
  );
}
