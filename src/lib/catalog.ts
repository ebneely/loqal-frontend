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
  brands?: string[];
  sizes?: string[];
  colors?: string[];
  priceMin?: number;
  priceMax?: number;
  inStockOnly?: boolean;
  sort?: SearchSort;
};

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
      query,
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
