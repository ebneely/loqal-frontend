import type { Metadata } from "next";

import { OrdersView } from "./orders-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "أوردراتي",
  robots: { index: false, follow: false },
};

export default function OrdersPage() {
  return <OrdersView />;
}
