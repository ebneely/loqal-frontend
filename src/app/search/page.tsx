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

/**
 * `?q=` is read on the way IN and is never written on the way out.
 *
 * Reading it means a search is linkable — a shopper can send "دوّر على قميص" to
 * somebody, and the back button out of a product returns to the results rather
 * than to an empty box. Not writing it is the other half of the same argument:
 * pushing the term into the URL on every submit re-runs the server render of
 * this route, and on Egyptian mobile data that is a round trip bought for a
 * cosmetic address bar. The typed term lives in component state.
 *
 * Trimmed to 200 because `searchProductsQuerySchema` caps `query` there and the
 * DTO is `.strict()` — a pasted paragraph would come back a 400, not a result.
 */
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const { q } = await searchParams;
  const raw = Array.isArray(q) ? q[0] : q;

  return <SearchView initialQuery={(raw ?? "").trim().slice(0, 200)} />;
}
