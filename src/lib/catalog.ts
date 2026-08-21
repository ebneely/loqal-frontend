import {
  publicBrandPageSchema,
  publicCategoryListSchema,
  publicProductDetailSchema,
  publicProductPageSchema,
  searchResultPageSchema,
  type ListPublicProductsQuery,
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
  brandProducts: (slug: string, query: ListPublicProductsQuery) =>
    ["brand-products", slug, query] as const,
  product: (brandSlug: string, productSlug: string) =>
    ["product", brandSlug, productSlug] as const,
  search: (q: string, page: number) => ["search", q, page] as const,
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
export function searchProducts(query: string, page = 1, perPage = 20) {
  return api.get(searchResultPageSchema, "/v1/search/products", {
    // `query`, not `q` — the API's DTO is .strict(), so the wrong name is a
    // 400 rather than an ignored parameter.
    query: { query, page, perPage },
    cache: "no-store",
  });
}
