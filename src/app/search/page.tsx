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
 * The API's own `slug` primitive, verbatim: lowercase words joined by hyphens,
 * two to eighty characters. Checked here rather than passed through, so a
 * hand-mangled address costs the shopper the view's "we do not have that
 * section" instead of a 400 they cannot read.
 */
const isSlug = (value: string) =>
  value.length >= 2 && value.length <= 80 && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(value);

const first = (value: string | string[] | undefined) =>
  (Array.isArray(value) ? value[0] : value) ?? "";

/**
 * TWO PARAMETERS ON THE WAY IN, AND NEITHER IS WRITTEN ON THE WAY OUT.
 *
 * `?q=` makes a typed search linkable — a shopper can send "دوّر على قميص" to
 * somebody, and the back button out of a product returns to the results rather
 * than to an empty box. `?category=` is the same idea for the tiles: every
 * category tile on `/` and on `/categories` is a link to this page, and the
 * slug in the address is the whole of what it carries.
 *
 * Not written on the way out for the other half of the same argument: pushing
 * the term into the URL on every submit re-runs the server render of this
 * route, and on Egyptian mobile data that is a round trip bought for a cosmetic
 * address bar. The typed term lives in component state.
 *
 * `q` is trimmed to 200 because `searchProductsQuerySchema` caps `query` there
 * and the DTO is `.strict()` — a pasted paragraph would come back a 400, not a
 * result. `category` is checked against the slug shape instead of trimmed:
 * anything else was never a category, and sending it would buy a 400 in place
 * of the "we do not have that section" the view can say for itself.
 */
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[]; category?: string | string[] }>;
}) {
  const params = await searchParams;
  const category = first(params.category).trim().toLowerCase();

  return (
    <SearchView
      initialQuery={first(params.q).trim().slice(0, 200)}
      initialCategory={isSlug(category) ? category : ""}
    />
  );
}
