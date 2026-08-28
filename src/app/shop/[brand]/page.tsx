import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ApiError } from "@/lib/api";
import { fetchBrand, fetchBrandProducts } from "@/lib/catalog";
import { getLocale } from "@/lib/locale-server";
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

/**
 * The shop and its first page of stock, in ONE round trip's worth of latency.
 *
 * Two reads rather than one because the products endpoint answers products and
 * nothing else — it carries no brand name — and the page was printing the URL
 * SLUG in every place the name belongs. `Promise.all`, not sequential awaits:
 * neither read depends on the other and serialising them would add an API
 * round trip to the render on Egyptian mobile data.
 *
 * A 404 from EITHER read is the shop not existing, which is `notFound()` and
 * not a 500 — the same rule the product page states. Anything else keeps its
 * stack and reaches `error.tsx`.
 */
async function load(slug: string) {
  try {
    const [brand, products] = await Promise.all([
      fetchBrand(slug),
      fetchBrandProducts(slug, { page: 1, perPage: 24 }),
    ]);
    return { brand, products };
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

  /**
   * The NAME, never the slug. A title of "zara-zamalek" is what a search
   * result and a shared WhatsApp link were both showing. If the shop cannot be
   * read the page below is a 404 anyway, so this falls back to the neutral
   * title rather than printing the address as a name.
   */
  const page = await load(brand);
  if (!page) return { title: "الصفحة مش موجودة" };

  const name = page.brand.name;
  const description =
    page.brand.description?.ar ??
    page.brand.description?.en ??
    `تسوّق من ${name} على loqaaal — توصيل في نفس اليوم من محلات القاهرة والجيزة.`;

  return {
    title: name,
    description,
    alternates: {
      canonical,
      languages: { ar: canonical, en: `${canonical}?lang=en` },
    },
    openGraph: {
      type: "website",
      url: canonical,
      locale: "ar_EG",
      title: name,
      description,
      // The shop's own cover if it has one. Without it a shared link is a
      // grey card; nothing is invented when it is null.
      images: page.brand.coverUrl ? [{ url: page.brand.coverUrl, alt: name }] : undefined,
    },
  };
}

export default async function ShopPage({ params }: { params: Promise<Params> }) {
  const { brand } = await params;
  const page = await load(brand);
  if (!page) notFound();

  const locale = await getLocale();
  const ar = locale === "ar";
  /** The shop's own name. `brand` stays what it is — the slug in the URL. */
  const name = page.brand.name;

  return (
    <Shell title={name}>
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
            {name}
          </span>
        </nav>

        {/*
          The shop sign. Set large and light, the way the name sits over a real
          shopfront — the shop is a place, not a seller label.

          The NAME comes from `fetchBrand`, not from the route param. The slug
          is the address and stays in the URL — a shopper who came from a
          search result was being shown `zara-zamalek` here.

          NO neighbourhood and NO street, and that is still deliberate:
          `publicBrandSchema` carries the name, the art, the delivery terms and
          the return window, and nothing anywhere in it is a location. Printing
          an address here would mean inventing one. `/shops` carries the same
          note.
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
              {name}
            </h1>
            {page.products.total > 0 ? (
              <span className="lq-hint" data-num>
                {page.products.total}
              </span>
            ) : null}
          </div>

          <p className="lq-eyebrow" style={{ maxInlineSize: "52ch" }}>
            {ar
              ? "المحل ده بيجهّز ويبعت بنفسه. إنت بتطلب أونلاين، والقطعة بتيجي من الرف بتاعه."
              : "This shop prepares and sends every order itself. You buy online and the piece comes off its own shelf."}
          </p>
        </header>

        {page.products.items.length === 0 ? (
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
            {page.products.items.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                brandSlug={brand}
                brandName={name}
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
        {page.products.total > page.products.items.length ? (
          <p className="lq-pad lq-hint" style={{ paddingBlock: "var(--space-6)" }}>
            {ar
              ? `بتشوف أول ${page.products.items.length} قطعة من ${page.products.total}.`
              : `Showing the first ${page.products.items.length} of ${page.products.total} pieces.`}
          </p>
        ) : null}
      </div>
    </Shell>
  );
}
