import type { Metadata } from "next";

import { BagView } from "./bag-view";

/**
 * Never cached, never indexed.
 *
 * The bag is keyed to a session cookie, so an ISR entry would be one shopper's
 * basket served to the next visitor. `robots.ts` disallows it for the matching
 * reason: a crawler reaches an empty bag, indexes that, and the result is a
 * search listing promising a page nobody else can see.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "السلة",
  robots: { index: false, follow: false },
};

export default function BagPage() {
  return <BagView />;
}
