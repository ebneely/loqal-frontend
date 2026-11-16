"use client";

import { useId, useState, useSyncExternalStore } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { ApiError } from "@/lib/api";
import { useSession } from "@/lib/auth-client";
import { queryKeys } from "@/lib/catalog";
import { createLocalStore } from "@/lib/local-store";
import type { Locale } from "@/lib/locale";
import { useReviewBrandOrder } from "@/lib/orders";

/**
 * Rate one shop's DELIVERED part of an order: one to five stars and an
 * optional sentence, public as soon as it is sent (an admin can hide it).
 *
 * The order carries no "already reviewed" flag, so a part rated from this
 * browser is remembered here, and the API's 409 for a second review is read
 * as the same fact rather than as an error.
 */
const reviewed = createLocalStore<string[]>(
  "lq:reviewed",
  (raw) => (Array.isArray(raw) ? raw.filter((id): id is string => typeof id === "string").slice(-200) : []),
  [],
);
const NONE: string[] = [];
const markReviewed = (id: string) => {
  const list = reviewed.get();
  if (!list.includes(id)) reviewed.set([...list, id]);
};

const STARS = [1, 2, 3, 4, 5] as const;

function describeError(error: Error, t: (ar: string, en: string) => string): string {
  if (error instanceof ApiError) {
    if (error.statusCode === 400 || error.isNotFound || error.isUnauthenticated || error.isPermissionDenied) {
      return t(
        "لا يمكن تقييم هذا الجزء من هنا بعد. طلبك على حاله، وسيُتاح التقييم قريبًا.",
        "This part cannot be rated from here yet. Your order is unaffected, and rating will open soon.",
      );
    }
  }
  return t("لم يُرسَل التقييم. حاول مرة أخرى بعد قليل.", "The rating did not go through. Try again shortly.");
}

export function RateShop({
  brandOrderId,
  brandId,
  shopName,
  orderNumber,
  phone,
  locale,
}: {
  brandOrderId: string;
  brandId: string;
  shopName: string | null;
  orderNumber: string;
  phone: string;
  locale: Locale;
}) {
  const t = (ar: string, en: string) => (locale === "ar" ? ar : en);
  const id = useId();
  const client = useQueryClient();
  const { data: session } = useSession();
  const done = useSyncExternalStore(reviewed.subscribe, reviewed.get, () => NONE).includes(brandOrderId);
  const review = useReviewBrandOrder();
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [tried, setTried] = useState(false);

  const already = review.error instanceof ApiError && review.error.isConflict;
  if (done || already) {
    return (
      <p className="lq-hint lq-group__act" role="status">
        {review.isSuccess
          ? t("وصل تقييمك، وهو منشور الآن في صفحة المتجر.", "Your rating is in, and it is on the shop's page now.")
          : t("قيّمت هذا الجزء من الطلب من قبل.", "You have already rated this part of the order.")}
      </p>
    );
  }

  return (
    <form
      className="lq-rate lq-group__act"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        setTried(true);
        if (rating === 0) return;
        review.mutate(
          {
            brandOrderId,
            rating,
            body: body.trim() || undefined,
            orderNumber,
            phone,
            signedIn: Boolean(session?.user),
          },
          {
            onSuccess: () => {
              markReviewed(brandOrderId);
              void client.invalidateQueries({ queryKey: queryKeys.reviews(brandId) });
            },
            onError: (error) => {
              if (error instanceof ApiError && error.isConflict) markReviewed(brandOrderId);
            },
          },
        );
      }}
    >
      <fieldset className="lq-rate__stars" aria-describedby={tried && rating === 0 ? `${id}-need` : undefined}>
        <legend className="lq-label">
          {shopName
            ? t(`كيف كان طلبك من ${shopName}؟`, `How was your order from ${shopName}?`)
            : t("كيف كان هذا الجزء من طلبك؟", "How was this part of your order?")}
        </legend>
        {STARS.map((n) => (
          <label key={n} className="lq-rate__star" data-on={n <= rating ? "true" : undefined}>
            <input
              type="radio"
              className="lq-vh"
              name={`${id}-rating`}
              value={n}
              checked={rating === n}
              onChange={() => setRating(n)}
            />
            <span aria-hidden="true">★</span>
            <span className="lq-vh">{t(`${n} من 5`, `${n} out of 5`)}</span>
          </label>
        ))}
      </fieldset>
      {tried && rating === 0 ? (
        <p id={`${id}-need`} className="lq-hint lq-hint--error" role="alert">
          {t("اختر عدد النجوم أولًا.", "Choose the stars first.")}
        </p>
      ) : null}

      <div className="lq-field">
        <label className="lq-label" htmlFor={`${id}-body`}>
          {t("تعليق (اختياري)", "A comment (optional)")}
        </label>
        <textarea
          id={`${id}-body`}
          className="lq-input"
          data-bidi
          rows={3}
          maxLength={1000}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder={t("ما الذي يحسن أن يعرفه غيرك عن هذا المتجر؟", "What should others know about this shop?")}
        />
        <p className="lq-hint">
          {t(
            "يُنشر التقييم في صفحة المتجر دون اسمك، ويستطيع المتجر الرد عليه.",
            "The rating appears on the shop's page without your name, and the shop can reply to it.",
          )}
        </p>
      </div>

      {review.isError ? (
        <p className="lq-hint lq-hint--error" role="alert">
          {describeError(review.error, t)}
        </p>
      ) : null}

      <div className="lq-ogate__acts">
        <button type="submit" className="lq-btn lq-btn--primary" disabled={review.isPending}>
          {review.isPending ? t("لحظة واحدة", "One moment") : t("أرسل التقييم", "Send the rating")}
        </button>
      </div>
    </form>
  );
}
