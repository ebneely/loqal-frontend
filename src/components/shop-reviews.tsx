"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchReviews, queryKeys } from "@/lib/catalog";
import { formatDate } from "@/lib/locale";
import { useLocale } from "@/lib/locale-context";
import { ratingLine } from "@/lib/shop-hours";

/**
 * What shoppers who received an order from this shop said, with the shop's
 * reply under each. Only reviews of DELIVERED orders exist, one per order, and
 * they are public as soon as they are written (an admin can hide one later).
 * Nobody's name is shown: the review is about the shop, not the shopper.
 *
 * FAILS SOFT: until the API answers this route the section is not drawn at
 * all, rather than standing on the page as an error about a feature.
 */
const STARS = [1, 2, 3, 4, 5];

export function Stars({ value, label }: { value: number; label: string }) {
  return (
    <span className="lq-stars" role="img" aria-label={label}>
      {STARS.map((n) => (
        <span key={n} aria-hidden="true" data-on={n <= Math.round(value) ? "true" : undefined}>
          ★
        </span>
      ))}
    </span>
  );
}

export function ShopReviews({
  brandId,
  rating,
}: {
  brandId: string;
  rating: { average: number; count: number } | null;
}) {
  const locale = useLocale();
  const t = (ar: string, en: string) => (locale === "ar" ? ar : en);
  const reviews = useQuery({
    queryKey: queryKeys.reviews(brandId),
    queryFn: ({ signal }) => fetchReviews(brandId, signal),
    staleTime: 5 * 60_000,
    retry: false,
  });

  if (reviews.isPending || reviews.isError) return null;
  const list = reviews.data;
  const summary = ratingLine(rating, locale);

  return (
    <section className="lq-home__sec lq-reviews" id="reviews" aria-labelledby="shop-reviews">
      <header className="lq-sec__head lq-home__head">
        <h2 className="lq-sec__title" id="shop-reviews">
          {t("التقييمات", "Ratings")}
        </h2>
        {summary ? (
          <span className="lq-biglist__n" data-num>
            {summary}
          </span>
        ) : null}
      </header>

      {list.length === 0 ? (
        <p className="lq-shopempty">
          {t(
            "يقيّم المتسوّقون المتجر بعد استلام طلباتهم، وتظهر تقييماتهم هنا مع ردّ المتجر عليها.",
            "Shoppers rate the shop once their order arrives, and their ratings show here with the shop's reply.",
          )}
        </p>
      ) : (
        <ol className="lq-reviews__list">
          {list.map((review) => (
            <li key={review.id} className="lq-review">
              <div className="lq-review__head">
                <Stars
                  value={review.rating}
                  label={t(`${review.rating} من 5`, `${review.rating} out of 5`)}
                />
                <time className="lq-hint" dateTime={review.createdAt} data-num>
                  {formatDate(review.createdAt, locale)}
                </time>
              </div>
              {review.body ? (
                <p className="lq-review__body" data-bidi>
                  {review.body}
                </p>
              ) : null}
              {review.brandReply ? (
                <div className="lq-review__reply">
                  <b>{t("ردّ المتجر", "The shop replied")}</b>
                  <p data-bidi>{review.brandReply}</p>
                </div>
              ) : null}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
