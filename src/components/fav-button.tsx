"use client";

import { useFavourite } from "@/lib/favourites";
import type { FavouriteTarget } from "@/lib/favourites-store";
import { useLocale } from "@/lib/locale-context";

/**
 * The heart. A real toggle button (`aria-pressed`), never inside the card's
 * link — a button inside an <a> is two controls in one, so the cards place it
 * beside their link in `.lq-fav-host`.
 *
 * The state carries a word as well as a fill: the accessible name says what
 * the tap does, and a failed save says so in a status line.
 */
export function FavButton({
  target,
  label,
  className,
}: {
  target: FavouriteTarget;
  /** The thing's own name, for the accessible label. */
  label: string;
  className?: string;
}) {
  const locale = useLocale();
  const { on, toggle, failed } = useFavourite(target);
  const t = (ar: string, en: string) => (locale === "ar" ? ar : en);

  return (
    <>
      <button
        type="button"
        className={`lq-fav${className ? ` ${className}` : ""}`}
        aria-pressed={on}
        aria-label={on ? t(`إزالة «${label}» من المفضلة`, `Remove “${label}” from saved`) : t(`حفظ «${label}» في المفضلة`, `Save “${label}”`)}
        title={on ? t("في المفضلة", "Saved") : t("أضف إلى المفضلة", "Save")}
        onClick={toggle}
      >
        <span className="lq-icon" data-icon={on ? "heart-filled" : "heart"} aria-hidden="true" />
      </button>
      {failed ? (
        <span className="lq-vh" role="status">
          {t("لم يُحفظ التغيير. حاول مرة أخرى.", "The change was not saved. Try again.")}
        </span>
      ) : null}
    </>
  );
}
