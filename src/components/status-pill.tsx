import type { BrandOrderStatus } from "@loqal/contracts/enums";
import type { Locale } from "@/lib/locale";

/**
 * The order status pill.
 *
 * ONE MAP, so a screen reads the wording instead of inventing it. The backend
 * enum is the key, the tone and both labels are the value, and nothing
 * downstream gets to decide that CONFIRMED is amber on one screen and green on
 * another.
 *
 * `BrandOrderStatus`, not `OrderStatus`, and that is the whole shape of this
 * product: brands fulfil independently, so one shop can be DELIVERED while its
 * basket-mate is still PENDING_BRAND. The storefront shows a status PER SHOP.
 * A single rolled-up order status would have to pick one of them, and picking
 * the optimistic one tells a shopper their order arrived when half of it has
 * not left a shelf.
 *
 * ── Tones ───────────────────────────────────────────────────────────────────
 *
 *   good  is the brand emerald, on purpose — a finished thing is the same green
 *         as an available thing.
 *   live  is blue, so NOTHING GREEN EVER MEANS "still happening". A shopper
 *         glancing at a list needs "done" and "on its way" to be different at a
 *         glance, and two greens are not.
 *   act   pulses, and it is the only pill that does. It means the shopper has
 *         to do something.
 *   wait  is the shop's turn, not the shopper's.
 *   bad   is failure. A return in progress is `act`, not `bad`: the shopper
 *         asked for it and it is going fine.
 *
 * COLOUR IS NEVER THE ONLY CARRIER. Every pill carries a word, which is why
 * this map has labels in it at all rather than just tones.
 */

type Tone = "neutral" | "wait" | "act" | "live" | "good" | "bad";

const STATUS: Record<BrandOrderStatus, { tone: Tone; ar: string; en: string }> = {
  /* Loqal is checking the order is real — a guest cash order on a new number. */
  PENDING_VERIFICATION: { tone: "wait", ar: "بنتأكد من الأوردر", en: "Verifying" },
  /* The shopper owes an action: the card did not go through yet. */
  PENDING_PAYMENT: { tone: "act", ar: "محتاج تدفع", en: "Payment needed" },
  /* The shop is checking the shelf. This is the wait the copy explains rather
     than apologises for. */
  PENDING_BRAND: { tone: "wait", ar: "المحل بيراجع الرف", en: "Shop checking the shelf" },
  CONFIRMED: { tone: "good", ar: "اتأكد", en: "Confirmed" },
  PACKED: { tone: "live", ar: "متجهّز", en: "Packed" },
  /* Handed to the rider the shopper booked. */
  HANDED_OVER: { tone: "live", ar: "مع المندوب", en: "With the rider" },
  DELIVERED: { tone: "good", ar: "اتسلّم", en: "Delivered" },
  /* Not a return: a refused cash order was never paid, so there is nothing to
     refund. It is a failure and it is coloured like one. */
  DELIVERY_FAILED: { tone: "bad", ar: "التوصيل فشل", en: "Delivery failed" },
  /* The shopper asked, and it is proceeding. Not `bad`. */
  RETURN_REQUESTED: { tone: "act", ar: "طلب استرجاع", en: "Return requested" },
  RETURNED: { tone: "neutral", ar: "اترجّع", en: "Returned" },
  CANCELLED: { tone: "neutral", ar: "اتلغى", en: "Cancelled" },
  REFUNDED: { tone: "good", ar: "اترد الفلوس", en: "Refunded" },
};

export function statusLabel(status: BrandOrderStatus, locale: Locale): string {
  const entry = STATUS[status];
  /**
   * A status the map does not know prints the ENUM NAME rather than an empty
   * pill or a guess. The backend adding a value should look like a bug on
   * screen — visibly untranslated — not like a shipped state with no wording.
   */
  if (!entry) return status;
  return locale === "ar" ? entry.ar : entry.en;
}

export function StatusPill({
  status,
  locale,
}: {
  status: BrandOrderStatus;
  locale: Locale;
}) {
  const tone = STATUS[status]?.tone ?? "neutral";

  return (
    <span className="lq-pill" data-tone={tone}>
      {/* The dot is on the two tones where something is moving or waiting on
          the shopper. On `good` and `neutral` it would be decoration. */}
      {tone === "act" || tone === "live" ? <i className="lq-pill__dot" /> : null}
      {statusLabel(status, locale)}
    </span>
  );
}

const FORWARD: BrandOrderStatus[] = [
  "PENDING_BRAND",
  "CONFIRMED",
  "PACKED",
  "HANDED_OVER",
  "DELIVERED",
];

export function StatusRail({
  status,
  locale,
}: {
  status: BrandOrderStatus;
  locale: Locale;
}) {
  const gated = status === "PENDING_VERIFICATION" || status === "PENDING_PAYMENT";
  const steps = gated ? [status, ...FORWARD] : FORWARD;
  const index = steps.indexOf(status);
  // Off the forward path — cancelled, failed, a return — the pill and its
  // sentence carry the state; a progress rail under them would contradict it.
  if (index === -1) return null;

  return (
    <ol
      className="lq-steps"
      aria-label={locale === "ar" ? "مراحل النص ده" : "This half's stages"}
    >
      {steps.map((step, at) => (
        <li
          key={step}
          className="lq-steps__step"
          // A delivered half is finished — its last step rests instead of pulsing.
          data-state={
            at < index || (at === index && status === "DELIVERED")
              ? "done"
              : at === index
                ? "now"
                : "next"
          }
          aria-current={at === index ? "step" : undefined}
        >
          <i className="lq-steps__dot" aria-hidden="true" />
          <span className="lq-steps__name">{statusLabel(step, locale)}</span>
        </li>
      ))}
    </ol>
  );
}
