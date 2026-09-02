"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { PublicBrand } from "@loqal/contracts/storefront.contract";
import { Money } from "@/components/money";
import type { Locale } from "@/lib/locale";

/**
 * The shop card — one object, rendered on the home rail, the shop index and
 * anywhere else a shop appears, so the three cannot drift into three different
 * ideas of what a shop is.
 *
 * IT LEADS WITH THE SHOP'S OWN PHOTOGRAPHS. A 16:10 band, because a shopfront
 * is a wide thing and a portrait well ate the section; the logo rides the
 * corner of that band on a stone notch rather than floating over the picture,
 * so it never fights the photograph behind it. Under the plate is a strip of
 * five slots: the filled ones are the shop's photos, the numbered outlines are
 * the slots it has not used. A shopper is buying from a place, and the card
 * should look like one.
 *
 * ── The fields it wants and mostly cannot have ──────────────────────────────
 *
 * `neighbourhood`, `street`, `hours` and `openNow` are optional, and today
 * every call site leaves all four undefined, because `publicBrandSchema`
 * carries none of them: it has id, slug, name, logoUrl, coverUrl, description,
 * the three figures below, and now `images`.
 *
 * They are in the props anyway, and the card renders each one only if it
 * arrives. Two reasons that is better than deleting them:
 *
 *   1. It is the shape the product needs. `design/app.js` had all four, invented
 *      in a hardcoded array. Writing the component to the real shape means the
 *      day the API answers them, this file does not change.
 *   2. NOTHING IS FAKED IN THE MEANTIME. A placeholder neighbourhood is worse
 *      than no neighbourhood — a shopper who picks a shop because it is in
 *      الزمالك and finds out at checkout that it is not has been lied to by the
 *      one screen this product asks them to trust.
 *
 * `images` is defaulted to `[]` in the contract and the API does not send it
 * yet, so the gallery falls back to `coverUrl` and the card is exactly what it
 * was — and lights up the moment the backend starts answering.
 */
const SLOTS = 5;
const STEP = 1150;

/**
 * One or two letters for a shop with no logo. Two initials only when the name
 * is two words of Latin script — Arabic joins, so a second letter lifted out
 * of the middle of a word is a different glyph than the one the reader sees.
 */
export function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";

  const latin = /^[\p{Script=Latin}]/u.test(words[0]);
  if (latin && words.length > 1) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return latin ? words[0][0].toUpperCase() : words[0][0];
}

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

  /** The line under the name: the address if we have one, the shop's own
      description if we do not, and nothing at all rather than filler. */
  const place = [neighbourhood, street].filter(Boolean).join(" — ") || null;

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
      <span className="lq-shopcard__gal" data-none={gallery.length === 0 ? "true" : undefined}>
        {gallery.length === 0 ? (
          <span className="lq-shopcard__mark" aria-hidden="true">
            {initialsOf(shop.name)}
          </span>
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

        {/* Rendered only when the flag actually exists. `openNow === undefined`
            means the API did not say, which is NOT the same as closed — and a
            card that shows "مقفول" because a field is missing turns a gap in
            the schema into a shop losing a sale. */}
        {openNow === true ? (
          <span className="lq-shopcard__state" data-open="true">
            <i className="lq-shopcard__dot" />
            {t("مفتوح", "Open")}
          </span>
        ) : openNow === false ? (
          <span className="lq-shopcard__state" data-open="false">
            {t("مقفول", "Closed")}
          </span>
        ) : null}

        {shop.isPromoted ? (
          <span className="lq-shopcard__promo">
            <span className="lq-badge lq-badge--tint">{t("مموّل", "Promoted")}</span>
          </span>
        ) : null}

        {/* No notch on a shop with no photograph: the mark already stands alone
            and centred in the band, and this would print the same initial twice
            on one card. */}
        {gallery.length > 0 ? (
          <span className="lq-shopcard__logo" aria-hidden="true">
            {shop.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={shop.logoUrl} alt="" loading="lazy" decoding="async" />
            ) : (
              <span className="lq-shopcard__initials">{initialsOf(shop.name)}</span>
            )}
          </span>
        ) : null}
      </span>

      <span className="lq-shopcard__plate">
        <span className="lq-shopcard__name" data-bidi>
          {shop.name}
        </span>

        {place ? (
          <span className="lq-shopcard__place" data-bidi>
            {place}
          </span>
        ) : description ? (
          <span className="lq-shopcard__place" data-bidi>
            {description}
          </span>
        ) : null}

        <span className="lq-shopcard__fig">
          <span className="lq-shopcard__figure">
            <span className="lq-shopcard__figkey">{t("التوصيل", "Delivery")}</span>
            <Money className="lq-shopcard__figval" amount={shop.deliveryFee} locale={locale} />
          </span>
          <span className="lq-shopcard__figure">
            <span className="lq-shopcard__figkey">{t("أقل أوردر", "Minimum")}</span>
            <Money
              className="lq-shopcard__figval"
              amount={shop.minimumOrderValue}
              locale={locale}
            />
          </span>
          <span className="lq-shopcard__figure">
            <span className="lq-shopcard__figkey">{t("مرتجع", "Returns")}</span>
            <span className="lq-shopcard__figval" data-num>
              {shop.returnWindowDays}
              <small>{t("يوم", "d")}</small>
            </span>
          </span>
        </span>

        {hours || typeof pieceCount === "number" ? (
          <span className="lq-shopcard__foot">
            {hours ? <span>{hours}</span> : <span />}
            {typeof pieceCount === "number" ? (
              <span data-num>
                {pieceCount} {t("قطعة", "pieces")}
              </span>
            ) : null}
          </span>
        ) : null}

        <span className="lq-shopcard__go">{t("افتح المحل ‹", "Open the shop ›")}</span>
      </span>

      {/* Only the photographs that exist, and nothing at all below two of them.
          The empty numbered slots belong to the dashboard, where they tell a
          shop what it has not uploaded; here they would tell a shopper the shop
          is unfinished — five cards of four grey boxes each. */}
      {gallery.length > 1 ? (
        <span className="lq-shopcard__strip" aria-hidden="true">
          {gallery.map((url, index) => (
            <span
              key={index}
              className="lq-shopcard__thumb"
              data-on={index === at ? "true" : undefined}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" loading="lazy" decoding="async" />
            </span>
          ))}
        </span>
      ) : null}
    </Link>
  );
}
