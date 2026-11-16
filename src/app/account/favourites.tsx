"use client";

import Link from "next/link";

import { useFavouriteList, useSavedLocal } from "@/lib/favourites";
import type { Locale } from "@/lib/locale";
import { useLocale } from "@/lib/locale-context";
import { initialsOf, ratingLine } from "@/lib/shop-hours";
import { FavButton } from "@/components/fav-button";
import { Garment, garmentFor } from "@/components/garment";
import { Money } from "@/components/money";
import { ProductPhoto } from "@/components/product-photo";
import { EmptyState } from "@/components/state";

/**
 * «المفضلة»: the saved shops and pieces.
 *
 * Signed in, it is the account's list from `/v1/favourites`, with photos and
 * live prices. A guest — or an account on an API that has no favourites yet —
 * sees what this browser kept: names and addresses only, no price, because a
 * price remembered from last week is not a price.
 *
 * The heart on each row takes it off the list.
 */
type Row = {
  key: string;
  href: string;
  title: string;
  sub: string | null;
  thumb: React.ReactNode;
  price?: string | null;
  heart: React.ReactNode;
};

function Rows({ rows, locale }: { rows: Row[]; locale: Locale }) {
  return (
    <div className="lq-acct__list">
      {rows.map((row) => (
        <div key={row.key} className="lq-favrow">
          <Link className="lq-arow" href={row.href}>
            <span className="lq-favrow__th" aria-hidden="true">
              {row.thumb}
            </span>
            <span className="lq-arow__body">
              <span data-bidi>{row.title}</span>
              {row.sub ? <small data-bidi>{row.sub}</small> : null}
            </span>
            {row.price ? <Money className="lq-money lq-favrow__price" amount={row.price} locale={locale} /> : null}
          </Link>
          {row.heart}
        </div>
      ))}
    </div>
  );
}

export function FavouritesPane() {
  const locale = useLocale();
  const t = (ar: string, en: string) => (locale === "ar" ? ar : en);
  const { userId, list } = useFavouriteList();
  const saved = useSavedLocal();
  const name = (value: { ar?: string; en?: string } | null) =>
    value?.[locale] ?? value?.ar ?? value?.en ?? "";

  if (userId && list.isPending) {
    return <div className="lq-skel" style={{ blockSize: 96 }} />;
  }

  const fromAccount = userId != null && list.isSuccess;
  let shops: Row[];
  let pieces: Row[];

  if (fromAccount) {
    shops = list.data.shops.map((shop) => ({
      key: shop.id,
      href: `/shop/${shop.slug}`,
      title: shop.name,
      sub: [shop.neighbourhood, ratingLine(shop.rating, locale)].filter(Boolean).join(" · ") || null,
      thumb: shop.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={shop.logoUrl} alt="" loading="lazy" />
      ) : (
        <span>{initialsOf(shop.name)}</span>
      ),
      heart: (
        <FavButton label={shop.name} target={{ kind: "shop", item: { id: shop.id, slug: shop.slug, name: shop.name } }} />
      ),
    }));
    pieces = list.data.products.map((item) => {
      const title = name(item.name);
      return {
        key: item.id,
        href: `/shop/${item.brandSlug}/${item.slug}`,
        title,
        sub: item.brandName,
        thumb: item.coverUrl ? (
          <ProductPhoto src={item.coverUrl} alt="" productId={item.id} sizes="48px" />
        ) : (
          <Garment className="lq-garment" kind={garmentFor(item.id)} />
        ),
        price: item.priceFrom ?? item.basePrice,
        heart: (
          <FavButton
            label={title}
            target={{
              kind: "product",
              item: { id: item.id, slug: item.slug, brandSlug: item.brandSlug, brandName: item.brandName, name: item.name },
            }}
          />
        ),
      };
    });
  } else {
    shops = saved.shops.map((shop) => ({
      key: shop.id,
      href: `/shop/${shop.slug}`,
      title: shop.name,
      sub: null,
      thumb: <span>{initialsOf(shop.name)}</span>,
      heart: <FavButton label={shop.name} target={{ kind: "shop", item: shop }} />,
    }));
    pieces = saved.products.map((piece) => ({
      key: piece.id,
      href: `/shop/${piece.brandSlug}/${piece.slug}`,
      title: name(piece.name),
      sub: piece.brandName,
      thumb: <Garment className="lq-garment" kind={garmentFor(piece.id)} />,
      heart: <FavButton label={name(piece.name)} target={{ kind: "product", item: piece }} />,
    }));
  }

  if (shops.length + pieces.length === 0) {
    return (
      <EmptyState
        art="shelf"
        title={t("لا شيء في المفضلة بعد", "Nothing saved yet")}
        body={t(
          "اضغط القلب على أي قطعة أو متجر، وسيظهر هنا لتعود إليه متى شئت.",
          "Tap the heart on any piece or shop and it shows up here, to come back to whenever you like.",
        )}
        actions={
          <Link className="lq-btn lq-btn--primary" href="/shops">
            {t("تصفّح المتاجر", "Browse the shops")}
          </Link>
        }
      />
    );
  }

  return (
    <>
      <p className="lq-acct__sub">
        {fromAccount
          ? t("محفوظة في حسابك، وتجدها على أي جهاز تدخل منه.", "Kept on your account, on any device you sign in from.")
          : userId
            ? t("محفوظة في هذا المتصفح الآن، وتنتقل إلى حسابك حين يتاح ذلك.", "Kept in this browser for now; they move to your account once that is available.")
            : t("محفوظة في هذا المتصفح. سجّل دخولك لتنتقل إلى حسابك.", "Kept in this browser. Sign in and they move to your account.")}
      </p>

      {shops.length > 0 ? (
        <>
          <h2 className="lq-acct__title">{t("المتاجر", "Shops")}</h2>
          <Rows rows={shops} locale={locale} />
        </>
      ) : null}

      {pieces.length > 0 ? (
        <>
          <h2 className="lq-acct__title">{t("القطع", "Pieces")}</h2>
          <Rows rows={pieces} locale={locale} />
        </>
      ) : null}

      {!userId ? (
        <div className="lq-acct__acts">
          <Link className="lq-btn lq-btn--secondary" href="/account/sign-in?next=%2Faccount%23favourites">
            {t("تسجيل الدخول", "Sign in")}
          </Link>
        </div>
      ) : null}
    </>
  );
}
