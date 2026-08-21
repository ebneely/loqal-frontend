import type { Metadata } from "next";

import { SearchView } from "./search-view";

/**
 * Never cached, never indexed.
 *
 * A query string is unique per shopper, so caching fills the store with entries
 * nobody reads twice. And search results are exactly the pages Google's own
 * guidance says to keep out of an index: infinite, generated on demand, and
 * competing with the product pages that should rank instead. `robots.ts`
 * disallows the path for the same reason.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "البحث",
  robots: { index: false, follow: true },
};

export default function SearchPage() {
  return <SearchView />;
}
