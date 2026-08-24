import { formatPrice, type Locale } from "@/lib/locale";

/**
 * Money.
 *
 * Every figure a shopper compares vertically goes through here, so the rules
 * live in one place instead of at forty call sites:
 *
 *   - LATIN DIGITS, in both languages. Egyptian shoppers read money in Latin
 *     numerals. `design/` set every price in Arabic-Indic (٤٥٠) and this is the
 *     one place the .dc system won that argument outright.
 *   - Source Code Pro, tabular and lining, via `data-num` in the base layer.
 *     A column of prices lines up and a total sits under a subtotal.
 *   - `ج.م` trails the figure in Arabic, `EGP` leads it in English.
 *   - A SHELF price carries no decimals. Anything being RECONCILED — a total, a
 *     delivery fee, a refund — carries two, because that is a figure somebody
 *     checks against another figure.
 *
 * `amount` is a string all the way from the API on purpose. `moneySchema` is a
 * decimal string precisely so nothing does float arithmetic on money; parsing
 * it here to format it would reintroduce the problem the string exists to
 * avoid, so `formatPrice` does the one narrowing conversion at the very end.
 */
export function Money({
  amount,
  locale,
  reconciled = false,
  className,
}: {
  /** A decimal string from the API, or null when nothing is priced. */
  amount: string | null | undefined;
  locale: Locale;
  /** Two decimals. Set on totals, fees and refunds; never on a shelf price. */
  reconciled?: boolean;
  className?: string;
}) {
  if (amount == null) {
    /**
     * An em dash, not "0". A product with no price set is not a free product,
     * and printing a zero next to a garment is a claim the API never made.
     */
    return (
      <span className={className} data-num>
        —
      </span>
    );
  }

  return (
    <span className={className} data-num>
      {formatPrice(amount, locale, { decimals: reconciled })}
    </span>
  );
}

/**
 * The struck-through "was" price.
 *
 * Rendered ONLY beside a live price it is genuinely higher than — the API
 * refuses a `compareAtPrice` at or below `price` with a 409, so a value that
 * reaches here has already been checked. It is never the only signal: the
 * discount badge carries the word, because a strike-through alone is a visual
 * cue and colour and decoration must never be the sole carrier.
 */
export function MoneyWas({
  amount,
  locale,
}: {
  amount: string | null | undefined;
  locale: Locale;
}) {
  if (amount == null) return null;
  return (
    <span className="lq-money--strike" data-num>
      {formatPrice(amount, locale)}
    </span>
  );
}
