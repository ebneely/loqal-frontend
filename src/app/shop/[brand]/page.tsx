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
    description: `تسوّق من ${brand} على لوكال — توصيل في نفس اليوم من محلات القاهرة والجيزة.`,
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

/**
 * The hairline product grid.
 *
 * Cells SHARE their borders — a 1px gap over a `--line` ground with one rule
 * top and bottom, which is the register's whole structural move. `.lq-grid2`
 * already carries the container-query column steps the system asks for (2-up
 * phone, 3-up at 768, 4-up at 1024); the gap and the ground are overridden here
 * rather than in a new class, because components.css is not this screen's file.
 *
 * Each card sits in a padded paper cell instead of flush against the rule, the
 * way `.lq-shopcard` sits inside `.lq-cells` — `.lq-pcard` frames its own well,
 * and two hairlines touching read as one 2px line.
 */
const GRID: React.CSSProperties = {
  gap: "1px",
  background: "var(--line)",
  borderBlock: "var(--border-width) solid var(--line)",
};

const CELL: React.CSSProperties = {
  background: "var(--paper)",
  padding: "var(--space-3)",
};

const CRUMB: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: "var(--space-2)",
  paddingBlock: "var(--space-3)",
  borderBlockEnd: "var(--border-width) solid var(--line)",
};

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
        <nav className="lq-pad" style={CRUMB} aria-label={ar ? "مسار" : "Breadcrumb"}>
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
          <div className="lq-grid2" style={GRID}>
            {page.items.map((product, index) => (
              <div key={product.id} style={CELL}>
                <ProductCard
                  product={product}
                  brandSlug={brand}
                  brandName={brand}
                  locale={locale}
                  /* The first row is the LCP. Everything below it stays lazy. */
                  priority={index < 2}
                  /* Staggered by column, so a row enters as a row. */
                  delayMs={(index % 4) * 70}
                />
              </div>
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
