import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ApiError } from "@/lib/api";
import { fetchProduct } from "@/lib/catalog";
import { getLocale } from "@/lib/locale-server";
import { Shell } from "@/components/shell";

import { ProductView } from "./product-view";

/**
 * NOT ISR, and it cannot be: the language comes from a cookie, so the HTML is
 * per-reader. `revalidate` (and, on the shop routes, an empty
 * `generateStaticParams`) asked Next to cache one copy of it, which threw
 * DYNAMIC_SERVER_USAGE on every request — a 500 on the shop pages and a
 * "we cannot reach the categories" on the ones that catch their own errors.
 *
 * The catalogue reads keep their own `next: { revalidate }`, so a request
 * costs a render and no database round trip.
 */

type Params = { brand: string; product: string };

async function load(params: Params) {
  try {
    return await fetchProduct(params.brand, params.product);
  } catch (error) {
    // A product that was archived between the crawl and the click is a 404, not
    // a 500. Anything else is a real fault and must keep its stack.
    if (error instanceof ApiError && error.isNotFound) return null;
    throw error;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const resolved = await params;
  const product = await load(resolved);
  if (!product) return { title: "الصفحة مش موجودة" };

  const nameAr = product.name?.ar ?? product.name?.en ?? "";
  const nameEn = product.name?.en ?? product.name?.ar ?? "";
  const description =
    product.description?.ar ??
    product.description?.en ??
    `${nameAr} — اشتريه من محل ${resolved.brand} على loqaaal.`;

  const canonical = `/shop/${resolved.brand}/${resolved.product}`;

  return {
    title: nameAr,
    description,
    alternates: {
      canonical,
      /**
       * Both languages are the SAME URL, because the language is a cookie and
       * not a path segment. Declaring them as alternates of one canonical is
       * what stops Google treating the Arabic and English renders as duplicate
       * pages competing with each other.
       */
      languages: { ar: canonical, en: `${canonical}?lang=en` },
    },
    openGraph: {
      type: "website",
      title: nameAr,
      description,
      url: canonical,
      locale: "ar_EG",
      // The cover is the garment. Without it a shared link is a grey card.
      images: product.coverUrl ? [{ url: product.coverUrl, alt: nameEn }] : undefined,
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<Params> }) {
  const resolved = await params;
  const product = await load(resolved);
  if (!product) notFound();

  /**
   * Arabic, and not from the cookie — reading it here would take this route off
   * ISR. The interactive half re-reads the real preference through
   * `useLocale()`; the server-rendered copy is the one Google indexes, and
   * Arabic is the language it should rank in.
   */
  const locale = await getLocale();

  const name = product.name?.[locale] ?? product.name?.ar ?? product.name?.en ?? "";

  /**
   * Product structured data.
   *
   * `offers` uses the CHEAPEST live variant, which is the figure the page
   * actually prints — a rich result quoting a price the page does not show is
   * the fastest way to lose the rich result. `availability` is derived from the
   * same `inStock` boolean the card uses rather than a second guess at stock.
   *
   * No `aggregateRating`: reviews are a Later story and are not in the schema.
   * Emitting a rating the product does not have is exactly the markup Google
   * issues manual actions for.
   */
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description: product.description?.[locale] ?? undefined,
    sku: product.variants[0]?.sku,
    image: product.mediaUrls.length ? product.mediaUrls : undefined,
    brand: { "@type": "Brand", name: resolved.brand },
    ...(product.priceFrom
      ? {
          offers: {
            "@type": "Offer",
            price: product.priceFrom,
            priceCurrency: "EGP",
            availability: product.inStock
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
          },
        }
      : {}),
  };

  return (
    <>
      {/*
        Rendered as a plain script tag rather than through a helper: this has to
        be in the server-rendered HTML, because a crawler that does not run our
        JavaScript is precisely the reader it exists for.
      */}
      <script
        type="application/ld+json"
        // The payload is built from parsed API data, never from user input.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/*
        The chrome. This route was rendering WITHOUT it: a product page had no
        header, no tab bar and no way back to the shop — the one screen a shopper
        lands on straight from a search result was the one screen with no
        navigation on it. `Shell` is a client component that takes children, so
        the view below still server-renders inside it.
      */}
      <Shell title={name}>
        <ProductView product={product} brandSlug={resolved.brand} locale={locale} />
      </Shell>
    </>
  );
}
