import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ApiError } from "@/lib/api";
import { fetchBrandProducts } from "@/lib/catalog";
import { defaultLocale } from "@/lib/locale";
import { Shell } from "@/components/shell";
import { ProductCard } from "@/components/product-card";

export const revalidate = 300;
export const dynamicParams = true;

/**
 * Empty, and required — see the long note on the product page. Without a
 * `generateStaticParams` export a dynamic segment renders on demand no matter
 * what `revalidate` says.
 */
export function generateStaticParams(): { brand: string }[] {
  return [];
}

type Params = { brand: string };

async function load(brand: string) {
  try {
    return await fetchBrandProducts(brand, { page: 1, perPage: 24 });
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound) return null;
    throw error;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { brand } = await params;
  const canonical = `/shop/${brand}`;
  return {
    title: brand,
    description: `تسوّق من ${brand} على لوكال — توصيل في نفس اليوم من محلات القاهرة والجيزة.`,
    alternates: {
      canonical,
      languages: { ar: canonical, en: `${canonical}?lang=en` },
    },
    openGraph: { type: "website", url: canonical, locale: "ar_EG", title: brand },
  };
}

export default async function ShopPage({ params }: { params: Promise<Params> }) {
  const { brand } = await params;
  const page = await load(brand);
  if (!page) notFound();

  const locale = defaultLocale;

  return (
    <Shell title={brand}>
      <div className="lq-wrap lq-pad">
        <section className="lq-sec">
          {page.items.length === 0 ? (
            <p className="lq-hint">
              {locale === "ar"
                ? "المحل لسه محطّش حاجات. لما يضيف، هتلاقيها هنا."
                : "This shop has not listed anything yet. When it does, it shows up here."}
            </p>
          ) : (
            <div className="lq-grid2">
              {page.items.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  brandSlug={brand}
                  brandName={brand}
                  locale={locale}
                  /* The first row is the LCP. Everything below it stays lazy. */
                  priority={index < 2}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </Shell>
  );
}
