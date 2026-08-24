import type { Metadata } from "next";

import { OrdersView } from "./orders-view";

/**
 * أوردراتي.
 *
 * `force-dynamic` because there is nothing here worth caching and because the
 * screen is about one shopper's own order — an ISR'd shell for a lookup would
 * be a cached page whose only job is to hold an uncached form.
 *
 * The view is a client component and stays one: the lookup is state and a
 * navigation, and the order number plus the phone are the credential, so
 * nothing on this route is ever fetched on the server with them.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "أوردراتي",
  description:
    "افتح أوردرك برقمه ورقم الموبايل اللي طلبت بيه — من غير حساب. كل محل في الأوردر ليه حالته لوحده.",
  /**
   * NOINDEX, and not as boilerplate. The order number plus the phone IS the
   * credential on the lookup route, so a crawled or shared URL from this
   * screen is a shared credential. It is also a personal screen with nothing
   * on it a search result could usefully answer.
   */
  robots: { index: false, follow: false },
  alternates: {
    canonical: "/orders",
    languages: { ar: "/orders", en: "/orders?lang=en" },
  },
};

export default function OrdersPage() {
  return <OrdersView />;
}
