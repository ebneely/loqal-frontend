"use client";

import Link from "next/link";

import { useMyOrders } from "@/lib/account";
import { formatDate } from "@/lib/locale";
import { useLocale } from "@/lib/locale-context";
import { Money } from "@/components/money";

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
  const { data, isPending, isError } = useMyOrders(true);

  if (isPending) {
    return (
      <div className="lq-rows" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <div key={i} className="lq-row">
            <span className="lq-skel" style={{ blockSize: 14, inlineSize: "40%" }} />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <p className="lq-hint lq-hint--error" role="alert">
        {t("مش قادرين نجيب أوردراتك دلوقتي.", "We cannot load your orders right now.")}
      </p>
    );
  }

  if (!data || data.items.length === 0) {
    return (
      <>
        <p className="lq-arail__sub">
          {t(
            "لسه مفيش أوردرات على الحساب ده. أول ما تطلب، هيظهر هنا.",
            "No orders on this account yet. The first one you place shows up here."
          )}
        </p>
        <Link className="lq-btn lq-btn--primary" href="/shops">
          {t("شوف المحلات", "Browse the shops")}
        </Link>
      </>
    );
  }

  return (
    <>
      <p className="lq-arail__sub">
        {t(
          "كل أوردراتك، حتى اللي طلبتها كضيف بنفس الرقم أو الإيميل.",
          "All your orders — including the ones placed as a guest with the same number or email."
        )}
      </p>
      <div className="lq-rows">
        {data.items.map((order) => {
          const shops = order.brandOrders.length;
          return (
            <Link
              key={order.id}
              className="lq-row lq-myorder"
              href={`/orders/${encodeURIComponent(order.orderNumber)}?phone=${encodeURIComponent(order.shippingAddress.phone)}`}
            >
              <span className="lq-icon lq-row__lead" data-icon="package" aria-hidden="true" />
              <span className="lq-row__body">
                <span className="lq-myorder__num" dir="ltr">
                  {order.orderNumber}
                </span>
                <span className="lq-hint">
                  {formatDate(order.placedAt, locale)} ·{" "}
                  {shops === 1
                    ? t("محل واحد", "1 shop")
                    : t(`${shops} محلات`, `${shops} shops`)}
                </span>
              </span>
              <Money
                className="lq-money lq-myorder__total"
                amount={order.grandTotal}
                locale={locale}
                reconciled
              />
              <span className="lq-icon lq-row__end" data-icon="chevron-right" aria-hidden="true" />
            </Link>
          );
        })}
      </div>
    </>
  );
}
