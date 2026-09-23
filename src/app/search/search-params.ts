/**
 * The two search parameters, read the same way on both sides of the wire.
 *
 * `page.tsx` reads them from the request to key the view, and the view reads
 * them from the address bar to seed itself. They used to be cleaned only on
 * the server, which was fine while the view took them as props — but after a
 * Back the props can describe an older render than the URL does (see
 * search-view.tsx), so the view reads the URL itself, and both have to agree
 * on what a clean `q` and a clean `category` are or a round trip through the
 * address bar would change the search.
 */

/**
 * `searchProductsQuerySchema` caps `query` at 200 and the DTO is `.strict()`,
 * so a pasted paragraph would come back a 400 rather than a result.
 */
export const cleanQuery = (value: string) => value.trim().slice(0, 200);

/**
 * The API's own `slug` primitive, verbatim: lowercase words joined by hyphens,
 * two to eighty characters. Checked rather than passed through, so a
 * hand-mangled address costs the shopper the view's "we do not have that
 * section" instead of a 400 they cannot read.
 */
const isSlug = (value: string) =>
  value.length >= 2 && value.length <= 80 && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(value);

/** Anything that is not a slug was never a category, and becomes none. */
export const cleanCategory = (value: string) => {
  const slug = value.trim().toLowerCase();
  return isSlug(slug) ? slug : "";
};

/**
 * The address a search lives at. Empty values are left out rather than sent
 * as `?q=`, so a category browse reads `/search?category=bags` and not
 * `/search?q=&category=bags`.
 */
export function searchHref(query: string, category: string): string {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (category) params.set("category", category);
  const search = params.toString();
  return search ? `/search?${search}` : "/search";
}
