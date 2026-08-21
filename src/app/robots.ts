import type { MetadataRoute } from "next";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://shop.loqal.com";

/**
 * What a crawler may read.
 *
 * `/bag`, `/checkout`, `/orders` and `/account` are disallowed because they are
 * per-shopper and behind a session — a crawler reaches an empty bag or a
 * sign-in wall, indexes that, and the result is a search listing that promises
 * a page nobody else can see. `/api` is the BFF proxy and is not content.
 *
 * Search results are excluded for the classic reason: they are infinite,
 * generated on demand, and indexing them competes with the product pages that
 * should rank instead.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/bag", "/checkout", "/orders", "/account", "/search"],
    },
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
