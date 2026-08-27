import type { MetadataRoute } from "next";

import { fetchBrands, fetchBrandProducts } from "@/lib/catalog";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://shop.loqal.com";

/**
 * Regenerated on the same clock as the catalogue itself.
 *
 * A sitemap that is fresher than the pages it points at just tells a crawler to
 * come back for content that has not changed; one that is staler hides new
 * shops. Matching the catalogue's revalidate window keeps the two honest.
 */
export const revalidate = 300;

/**
 * Shops and their products.
 *
 * `lastModified` comes from the row's own `updatedAt`, never `new Date()` —
 * a sitemap that claims every URL changed on every regeneration teaches Google
 * to ignore the field, which is the one signal that makes recrawling cheap.
 *
 * Deliberately NOT exhaustive past the first page of each shop: Next's sitemap
 * has a 50k-URL ceiling per file and walking every page of every shop on a
 * 5-minute clock would hammer the API. When the catalogue outgrows this it
 * wants `generateSitemaps()` and a shard per shop, not a bigger loop here.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = [
    { url: SITE, changeFrequency: "daily", priority: 1 },
  ];

  let brands;
  try {
    // FIFTY, not a hundred: `listBrandsSchema` on the API caps `perPage` at 50
    // and is `.strict()`, so 100 was a 400 that the catch below swallowed — the
    // sitemap shipped with the home page in it and nothing else. When there are
    // more than fifty shops this wants `generateSitemaps()` and a shard each,
    // which is the same note the block above already makes about products.
    brands = await fetchBrands(1, 50);
  } catch {
    // A sitemap that throws takes the whole route down and Google gets a 500.
    // Answering with the static entries is strictly better than that.
    return staticEntries;
  }

  const shopEntries: MetadataRoute.Sitemap = brands.items.map((brand) => ({
    url: `${SITE}/shop/${brand.slug}`,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  const productPages = await Promise.all(
    brands.items.map(async (brand) => {
      try {
        // Same cap, same reason: the API's `listPublicProductsQuerySchema`
        // stops at 50, so 60 was a 400 on every shop.
        const page = await fetchBrandProducts(brand.slug, { page: 1, perPage: 50 });
        return page.items.map((product) => ({
          url: `${SITE}/shop/${brand.slug}/${product.slug}`,
          lastModified: new Date(product.updatedAt),
          changeFrequency: "weekly" as const,
          priority: 0.7,
        }));
      } catch {
        // One shop failing must not lose the other ninety-nine.
        return [];
      }
    })
  );

  return [...staticEntries, ...shopEntries, ...productPages.flat()];
}
