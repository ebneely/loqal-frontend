"use client";

import Link from "next/link";

import { useMyOrders } from "@/lib/account";
import { formatDate } from "@/lib/locale";
import { useLocale } from "@/lib/locale-context";
import { shopCount } from "@/lib/shop-hours";
import { Money } from "@/components/money";
import { EmptyState } from "@/components/state";

/**
 * A signed-in shopper's orders, newest first.
 *
 * It includes the guest orders they placed before the account existed — the
 * API matches those on a phone or email the account has verified — so a new
 * account opens onto the shopper's own history instead of an empty list.
 *
 * Each row opens the order page the guest flow already uses, with the phone
 * the order was placed with as its credential. One order screen, reached two
 * ways, rather than a second one that could drift from it.
 */
export function MyOrders() {
  const locale = useLocale();
  const t = (ar: string, en: string) => (locale === "ar" ? ar : en);
  const { data, isPending, isError, isFetching, refetch } = useMyOrders(true);

  if (isPending) {
    return (
      <div className="lq-acct__list" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <div key={i} className="lq-orow">
            <span className="lq-skel" style={{ blockSize: 14, inlineSize: "40%" }} />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        art="crooked"
        tone="loud"
        role="alert"
        title={t("تعذّر تحميل طلباتك الآن", "We cannot load your orders right now")}
        body={t(
          "طلباتك محفوظة كما هي، لكن الاتصال انقطع. أعد المحاولة بعد لحظة.",
          "Your orders are safe; the connection dropped. Try again in a moment."
        )}
        actions={
          <button
            type="button"
            className="lq-btn lq-btn--primary"
            aria-busy={isFetching}
            onClick={() => void refetch()}
          >
            {t("أعد المحاولة", "Try again")}
          </button>
        }
      />
    );
  }

  if (!data || data.items.length === 0) {
    return (
      <EmptyState
        art="shelf"
        title={t("لا طلبات بعد", "No orders yet")}
        body={t(
          "ستظهر هنا طلباتك فور أن تطلب، ومعها طلبات الضيف التي أجريتها بالرقم نفسه أو البريد نفسه.",
          "Your orders show up here as soon as you place one, along with any guest orders made with the same number or email."
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
        {t(
          "كل طلباتك، ومعها التي طلبتها كضيف بالرقم نفسه أو البريد نفسه.",
          "All your orders, including the ones placed as a guest with the same number or email."
        )}
      </p>
      <div className="lq-acct__list">
        {data.items.map((order) => (
            <Link
              key={order.id}
              className="lq-orow"
              href={`/orders/${encodeURIComponent(order.orderNumber)}?phone=${encodeURIComponent(order.shippingAddress.phone)}`}
            >
              <span className="lq-orow__id">
                <b className="lq-orow__num" dir="ltr">
                  {order.orderNumber}
                </b>
                <small>
                  {formatDate(order.placedAt, locale)} · {shopCount(order.brandOrders.length, locale)}
                </small>
              </span>
              <Money className="lq-money lq-orow__total" amount={order.grandTotal} locale={locale} reconciled />
              <span className="lq-orow__go">{t("عرض", "View")}</span>
            </Link>
        ))}
      </div>
    </>
  );
}
