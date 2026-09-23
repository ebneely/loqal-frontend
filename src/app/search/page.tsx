import type { Metadata } from "next";
import { Suspense } from "react";

import { cleanCategory, cleanQuery } from "./search-params";
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

const first = (value: string | string[] | undefined) =>
  (Array.isArray(value) ? value[0] : value) ?? "";

/**
 * TWO PARAMETERS, READ ON THE WAY IN AND WRITTEN BACK ON THE WAY OUT.
 *
 * `?q=` makes a typed search linkable — a shopper can send "دوّر على قميص" to
 * somebody, and the back button out of a product returns to the results rather
 * than to an empty box. `?category=` is the same idea for the tiles: every
 * category tile on `/` and on `/categories` is a link to this page, and the
 * slug in the address is the whole of what it carries.
 *
 * The view writes both back with `history.replaceState` when a search is
 * submitted or the shelf is dropped. It used to keep the typed term in state
 * only, so Back out of a product restored a bare `/search` and the shopper had
 * to search again after every piece she opened. `replaceState` rather than a
 * router navigation, because pushing the term through the router re-runs the
 * server render of this route, and on Egyptian mobile data that is a round
 * trip bought for an address bar. Next folds a native `replaceState` into its
 * own router, so `useSearchParams` sees the new address without one.
 *
 * Both are cleaned by `search-params.ts`, which the view uses as well: `q` is
 * trimmed to the API's 200-character cap, and `category` is checked against
 * the slug shape instead, because anything else was never a category.
 */
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[]; category?: string | string[] }>;
}) {
  const params = await searchParams;
  const categorySlug = cleanCategory(first(params.category));
  const query = cleanQuery(first(params.q));

  return (
    /* KEYED ON THE PARAMS. The view seeds its state from the address ONCE, so
       without the key a navigation from `?category=a` to `?category=b` reuses
       the same instance and changes nothing — every category link in the
       header was a dead tap from this page. A remount is also the right reset:
       a new shelf should not inherit the old shelf's typed term or ticked
       filters, and the results already fetched stay warm in the query cache.

       The Suspense boundary is required rather than decorative: the view reads
       the address with `useSearchParams`, and Next wants a boundary above any
       component that does. This route is dynamic, so nothing suspends on it
       and the fallback is never drawn. */
    <Suspense fallback={null}>
      <SearchView key={`${categorySlug}|${query}`} />
    </Suspense>
  );
}
