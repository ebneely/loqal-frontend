import Link from "next/link";

import type { Locale } from "@/lib/locale";

/**
 * The first screen: a shop's own photograph owning the inline-END 57% of the
 * width, and the heading crossing onto it — ink on the paper, white on the
 * photo, switching exactly at the photo's edge.
 *
 * The switch is a second, aria-hidden copy of the heading in an overlay
 * clipped to the photo's rectangle. Same box, same type, so the two copies
 * line up to the pixel and the reader hears the heading once.
 *
 * On home the desktop header lies over this section (`.lq-shell[data-home]`):
 * its mark and tools sit on the photo and are white, its nav sits on paper and
 * is ink. The plate's 57% is what keeps that split true.
 *
 * SERVER-RENDERED, plain <img>: `remotePatterns` is read from LOQAL_MEDIA_HOST
 * and the shop photos are presigned URLs, the same reason `shop-card.tsx` uses
 * a plain <img>. No photo is a green plate, not a stock picture.
 */
export type HeroPhoto = { url: string; shop: string };

export function Hero({
  locale,
  photo,
  inset,
  links,
}: {
  locale: Locale;
  photo: HeroPhoto | null;
  inset: HeroPhoto | null;
  /** Category quick links: label and destination. */
  links: { label: string; href: string }[];
}) {
  const t = (ar: string, en: string) => (locale === "ar" ? ar : en);
  const title = t("متاجر حيّك", "Your neighbourhood’s shops");

  return (
    <section className="lq-hero" aria-labelledby="hero-title">
      <div className="lq-hero__plate">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo.url} alt={t(`من متجر ${photo.shop}`, `Inside ${photo.shop}`)} fetchPriority="high" />
        ) : null}
      </div>

      <h1 className="lq-hero__title" id="hero-title">
        {title}
      </h1>
      <div className="lq-hero__over" aria-hidden="true">
        <p className="lq-hero__title">{title}</p>
      </div>

      {inset ? (
        <div className="lq-hero__inset">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={inset.url} alt={t(`من متجر ${inset.shop}`, `Inside ${inset.shop}`)} loading="lazy" />
        </div>
      ) : null}

      <div className="lq-hero__side">
        <p className="lq-hero__lede">
          {t(
            "متاجر تعرفها، ومن رفوفها إلى بابك في اليوم نفسه.",
            "Shops you know, from their shelves to your door the same day.",
          )}
        </p>

        {/* A plain GET form: it works before the bundle lands, and /search
            reads `q` from the address. */}
        <form className="lq-hero__find" action="/search" role="search">
          <label className="lq-search">
            <span className="lq-icon" data-icon="search" aria-hidden="true" />
            <input
              type="search"
              name="q"
              enterKeyHint="search"
              placeholder={t("عمّ تبحث؟", "What are you looking for?")}
              aria-label={t("بحث", "Search")}
            />
          </label>
        </form>

        {links.length > 0 ? (
          <nav className="lq-hero__links" aria-label={t("الأقسام", "Categories")}>
            {links.map((link) => (
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            ))}
          </nav>
        ) : null}
      </div>
    </section>
  );
}
