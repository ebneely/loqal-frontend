import type { Metadata } from "next";

import { CheckoutView } from "./checkout-view";

/**
 * إتمام الطلب.
 *
 * `force-dynamic` and noindex, for the reasons the bag states: the screen is
 * keyed to a session cookie and to one shopper's basket, so an ISR entry would
 * be one person's order form served to the next visitor, and a crawler
 * reaching it would index a checkout for an empty bag.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "إتمام الطلب",
  description:
    "العنوان وطريقة الدفع. يراجع كل متجر في الطلب الرف ويجهّز جزءه ويرسله بنفسه.",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return <CheckoutView />;
}
