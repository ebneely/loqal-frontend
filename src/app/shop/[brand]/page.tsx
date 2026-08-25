import type { Metadata } from "next";
import Link from "next/link";
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
    description: `تسوّق من ${brand} على loqaaal — توصيل في نفس اليوم من محلات القاهرة والجيزة.`,
    alternates: {
      canonical,
      languages: { ar: canonical, en: `${canonical}?lang=en` },
    },
    openGraph: {
      type: "website",
      url: canonical,
      locale: "ar_EG",
      title: brand,
    },
  };
}

export default async function ShopPage({ params }: { params: Promise<Params> }) {
  const { brand } = await params;
  const page = await load(brand);
  if (!page) notFound();

  const locale = defaultLocale;
  const ar = locale === "ar";

  return (
    <Shell title={brand}>
      <div className="lq-wrap">
        {/* The trail back out. A shopper who arrived on a shop from a search
            result has no other way up to the shop index. */}
        <nav className="lq-pad lq-crumb" aria-label={ar ? "مسار" : "Breadcrumb"}>
          <Link className="lq-eyebrow" href="/">
            {ar ? "الرئيسية" : "Home"}
          </Link>
          <span className="lq-eyebrow" aria-hidden="true">
            /
          </span>
          <Link className="lq-eyebrow" href="/shops">
            {ar ? "المحلات" : "Shops"}
          </Link>
          <span className="lq-eyebrow" aria-hidden="true">
            /
          </span>
          <span className="lq-eyebrow" data-bidi>
            {brand}
          </span>
        </nav>

        {/*
          The shop sign. Set large and light, the way the name sits over a real
          shopfront — the shop is a place, not a seller label.

          NO neighbourhood and NO street, and that is deliberate:
          `publicBrandSchema` carries id, slug, name, logo, cover and
          description and nothing else, and this route reads
          `fetchBrandProducts`, which answers products. Printing an address here
          would mean inventing one. `/shops` carries the same note.
        */}
        <header
          className="lq-pad lq-sec lq-rv"
          style={{ "--lq-d": "0ms" } as React.CSSProperties}
        >
          <div className="lq-sec__head">
            <h1
              data-bidi
              /* Size and the hairline under it carry the weight, so 300 rather
                 than a bold. NO extra tracking: the shop name can be Arabic and
                 letter-spacing pulls a cursive script apart at the joins — the
                 base `h1` rule is the only tracking this heading gets. */
              style={{ fontSize: "var(--text-3xl)", fontWeight: 300 }}
            >
              {brand}
            </h1>
            {page.total > 0 ? (
              <span className="lq-hint" data-num>
                {page.total}
              </span>
            ) : null}
          </div>

          <p className="lq-eyebrow" style={{ maxInlineSize: "52ch" }}>
            {ar
              ? "المحل ده بيجهّز ويبعت بنفسه. إنت بتطلب أونلاين، والقطعة بتيجي من الرف بتاعه."
              : "This shop prepares and sends every order itself. You buy online and the piece comes off its own shelf."}
          </p>
        </header>

        {page.items.length === 0 ? (
          /* Describes what will appear, never the emptiness. */
          <p className="lq-pad lq-hint" style={{ paddingBlock: "var(--space-8)" }}>
            {ar
              ? "المحل لسه محطّش حاجات. أول ما يضيف قطعة، هتلاقيها هنا."
              : "This shop has not listed anything yet. The first piece it adds shows up here."}
          </p>
        ) : (
          /* Cells SHARE their borders and `.lq-pgrid > *` supplies the paper
             ground and the padding, so the card is the cell — a wrapper here
             would only re-pad what the grid already padded. */
          <div className="lq-pgrid">
            {page.items.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                brandSlug={brand}
                brandName={brand}
                locale={locale}
                /* The first row is the LCP. Everything below it stays lazy. */
                priority={index < 2}
                /* Staggered by column, so a row enters as a row. */
                delayMs={(index % 4) * 70}
              />
            ))}
          </div>
        )}

        {/* The catalogue is paged and this screen shows page one. Said out loud
            rather than left as a silent truncation. */}
        {page.total > page.items.length ? (
          <p className="lq-pad lq-hint" style={{ paddingBlock: "var(--space-6)" }}>
            {ar
              ? `بتشوف أول ${page.items.length} قطعة من ${page.total}.`
              : `Showing the first ${page.items.length} of ${page.total} pieces.`}
          </p>
        ) : null}
      </div>
    </Shell>
  );
}
