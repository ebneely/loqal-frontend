import {
  publicBrandPageSchema,
  publicBrandSchema,
  publicCategoryListSchema,
  publicProductDetailSchema,
  publicProductPageSchema,
  searchResultPageSchema,
  type ListPublicProductsQuery,
  type SearchSort,
} from "@loqal/contracts/storefront.contract";

import { api } from "./api";

/**
 * The catalogue reads, and the cache policy that goes with each one.
 *
 * The split is the whole point of this file. A catalogue page is the same for
 * every shopper, so it is fetched with `next.revalidate` and served from the
 * ISR cache — a shop's product grid does not need to hit Postgres once per
 * visitor. Anything carrying a session (the bag, an order, a chat thread) is
 * never cached at all and lives in `lib/session-data.ts`.
 *
 * Getting that boundary wrong in the cheap direction serves one shopper another
 * shopper's bag, so nothing in THIS file may take a cookie.
 */

/**
 * Five minutes.
 *
 * Long enough that a shop's grid is served from cache during a normal browsing
 * session, short enough that a price change or a sold-out variant is live
 * before anybody could reasonably complain. Stock is the reason it is not an
 * hour: `inStock` is on these rows, and a stale `true` is the one error that
 * sells something nobody has.
 */
const CATALOG_REVALIDATE = 300;

/**
 * A tag per shop, so publishing a product can drop exactly that shop's pages
 * rather than the whole catalogue. `revalidateTag` from the backend webhook is
 * the intended trigger; until that exists the 5-minute window is the floor.
 */
export const brandTag = (slug: string) => `brand:${slug}`;
export const categoriesTag = "categories";

export const queryKeys = {
  categories: () => ["categories"] as const,
  brands: (page: number) => ["brands", page] as const,
  /** brandId → name, for the one screen that is handed ids and no names. */
  brandDirectory: () => ["brand-directory"] as const,
  brand: (slug: string) => ["brand", slug] as const,
  brandProducts: (slug: string, query: ListPublicProductsQuery) =>
    ["brand-products", slug, query] as const,
  product: (brandSlug: string, productSlug: string) =>
    ["product", brandSlug, productSlug] as const,
  /**
   * The filters are PART OF THE KEY. Without them a shopper who ticks a shop
   * gets the unfiltered results served straight from cache under the same key,
   * and the rail looks broken rather than slow. `filters` is passed as an
   * object and TanStack hashes it deterministically, so key order does not
   * matter and two equivalent filter sets share a cache entry.
   */
  search: (q: string, page: number, filters?: SearchFilters) =>
    ["search", q, page, filters ?? {}] as const,
};

export function fetchCategories() {
  return api.get(publicCategoryListSchema, "/v1/categories", {
    next: { revalidate: CATALOG_REVALIDATE, tags: [categoriesTag] },
  });
}

export function fetchBrands(page = 1, perPage = 24) {
  return api.get(publicBrandPageSchema, "/v1/brands", {
    query: { page, perPage },
    next: { revalidate: CATALOG_REVALIDATE, tags: ["brands"] },
  });
}

/**
 * One shop, by the slug in the URL.
 *
 * The shop route used to render the SLUG wherever the name belongs — the `h1`,
 * the breadcrumb, the top bar and every metadata field all printed
 * `zara-zamalek`. The slug is an address, not a name, and a shopper reading an
 * Arabic page has no reason to be shown a hyphenated Latin handle of their own
 * shop. This is the read that answers the real one.
 *
 * Same ISR window and the SAME TAG as the shop's products, deliberately: a
 * brand renaming itself and a brand publishing a product both invalidate the
 * same page, so one `revalidateTag(brandTag(slug))` should drop both.
 */
export function fetchBrand(slug: string) {
  return api.get(publicBrandSchema, `/v1/brands/slug/${encodeURIComponent(slug)}`, {
    next: { revalidate: CATALOG_REVALIDATE, tags: [brandTag(slug)] },
  });
}

export function fetchBrandProducts(slug: string, query: ListPublicProductsQuery) {
  return api.get(publicProductPageSchema, `/v1/brands/${encodeURIComponent(slug)}/products`, {
    query: { page: query.page, perPage: query.perPage, categoryId: query.categoryId },
    next: { revalidate: CATALOG_REVALIDATE, tags: [brandTag(slug)] },
  });
}

export function fetchProduct(brandSlug: string, productSlug: string) {
  return api.get(
    publicProductDetailSchema,
    `/v1/brands/${encodeURIComponent(brandSlug)}/products/${encodeURIComponent(productSlug)}`,
    { next: { revalidate: CATALOG_REVALIDATE, tags: [brandTag(brandSlug)] } }
  );
}

/**
 * Search is NOT cached.
 *
 * A query string is unique per shopper and caching it fills the ISR store with
 * entries nobody reads twice. It is also the one read where freshness is the
 * point: somebody searching "هودي" wants what is sellable now.
 */
/**
 * The filters a search can carry. Everything is optional — an unfiltered
 * search is the same call with none of them set.
 */
export type SearchFilters = {
  /**
   * A Category SLUG. It is a FILTER and not the query, which is what lets a
   * category tile open results with no typed word at all — and what lets a
   * shopper then type one on top of it without losing the category.
   */
  category?: string;
  brands?: string[];
  sizes?: string[];
  colors?: string[];
  priceMin?: number;
  priceMax?: number;
  inStockOnly?: boolean;
  sort?: SearchSort;
};

/**
 * `query` may be empty, and then it is NOT SENT.
 *
 * The endpoint takes a query, a category, or both. Sending `query=""` would be
 * a 400 against the min(1) rather than an unfiltered search, so an empty term
 * is dropped the same way an unset filter is — and a call with neither is a
 * bug this function will not paper over, so it is left to fail loudly at the
 * API rather than silently returning nothing here.
 */
export function searchProducts(
  query: string,
  page = 1,
  perPage = 20,
  filters: SearchFilters = {}
) {
  return api.get(searchResultPageSchema, "/v1/search/products", {
    // `query`, not `q` — the API's DTO is .strict(), so the wrong name is a
    // 400 rather than an ignored parameter. The same strictness is why every
    // filter below is omitted rather than sent empty when it is not set.
    query: {
      query: query.trim().length > 0 ? query : undefined,
      category: filters.category || undefined,
      page,
      perPage,
      brands: filters.brands?.length ? filters.brands : undefined,
      sizes: filters.sizes?.length ? filters.sizes : undefined,
      colors: filters.colors?.length ? filters.colors : undefined,
      priceMin: filters.priceMin,
      priceMax: filters.priceMax,
      inStockOnly: filters.inStockOnly ? true : undefined,
      sort: filters.sort && filters.sort !== "relevance" ? filters.sort : undefined,
    },
    cache: "no-store",
  });
}

/* ══════════════════════════════════════════════════════════════════════════
   The shop directory: brandId → name and slug.

   AN ORDER DOES NOT CARRY A SHOP'S NAME. `brandOrders[].brandId` is the only
   identifier on the whole response — no name, no slug, no logo — so the order
   screen cannot write "Versattire" over a shop's half from that read alone.

   Three ways to answer that, and only one of them is honest:

     - print the id. A UUID is not a name and reads as a bug.
     - invent a label per shop ("المحل الأول"). That is an ordering the API
       never claimed, and it is different every time the array order changes.
     - RESOLVE IT against the public brand index, which is a real endpoint
       that really carries ids and names, and say so plainly where the id is
       not in it.

   This is the third. It is one extra read of a list the storefront already
   caches for its own shop pages, and a shop that has been delisted since the
   order was placed is genuinely absent from it — which is a fact about the
   order, not a failure of the screen, and the order screen says it in words.
   ══════════════════════════════════════════════════════════════════════════ */

export type BrandDirectoryEntry = { id: string; name: string; slug: string };

/**
 * Every shop the public index will admit to, in as few round trips as the
 * page cap allows.
 *
 * `perPage` is 50 because the API's DTO is `.strict()` and refuses more — the
 * same cap that broke the sitemap when this repo assumed 60. The page loop is
 * bounded at four passes: a marketplace with more than 200 live shops needs a
 * `GET /v1/brands?ids=` on the API rather than a longer loop here, and an
 * unbounded loop on an order screen is a shopper's data budget spent on shops
 * that are not in their order.
 */
export async function fetchBrandDirectory(): Promise<BrandDirectoryEntry[]> {
  const PER_PAGE = 50;
  const MAX_PAGES = 4;

  const entries: BrandDirectoryEntry[] = [];
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const result = await fetchBrands(page, PER_PAGE);
    for (const brand of result.items) {
      entries.push({ id: brand.id, name: brand.name, slug: brand.slug });
    }
    if (entries.length >= result.total || result.items.length === 0) break;
  }
  return entries;
}
