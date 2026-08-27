import type { Metadata } from "next";
import { Suspense } from "react";

import { OrderView } from "./order-view";

/**
 * One order.
 *
 * `force-dynamic`, and this route is the strongest case for it in the app: the
 * URL contains an order number, and an ISR entry keyed by one would be one
 * shopper's order served from the edge to whoever asked for the same path.
 *
 * NOINDEX, and not as boilerplate. The order number plus the phone IS the
 * credential on the lookup route, so a crawled or shared URL from this screen
 * is a shared credential — the phone is right there in the query string. It is
 * also a personal page with nothing on it a search result could answer.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "الأوردر",
  robots: { index: false, follow: false, nocache: true },
};

export default async function OrderPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;

  /**
   * The Suspense boundary is required rather than decorative: the view reads
   * `?phone=` with `useSearchParams`, and a component that does so without one
   * above it opts the whole route out of static rendering with a build-time
   * error. The fallback is null because the shell paints instantly underneath
   * and the view has its own skeleton for the read that follows.
   */
  return (
    <Suspense fallback={null}>
      <OrderView orderNumber={decodeURIComponent(orderNumber)} />
    </Suspense>
  );
}
