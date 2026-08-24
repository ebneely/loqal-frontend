import type { Metadata } from "next";
import Link from "next/link";

import { fetchBrands } from "@/lib/catalog";
import { defaultLocale } from "@/lib/locale";
import { Shell } from "@/components/shell";
import { ShopCard } from "@/components/shop-card";

/**
 * المحلات — the shop index.
 *
 * The destination behind the brands mega-menu, and the one every shop card in
 * the product grid and the footer eventually points at. `design/`'s version of
 * this screen filtered by neighbourhood and by open/closed; this one does not,
 * and the reason is worth stating where somebody will read it before adding the
 * chips back.
 *
 * BACKEND GAP. `publicBrandSchema` carries id, slug, name, logoUrl, coverUrl
 * and description. There is no neighbourhood, no street, no opening hours and
 * no open/closed flag on it — `design/app.js` invented all four in a hardcoded
 * array, which is fine in a mockup and is not shippable here.
 *
 * So there are no filter chips. A neighbourhood filter over data the API does
 * not return would either filter nothing or filter against a fiction, and on
 * this product that field is not a nice-to-have: PRODUCT.md calls the shop
 * having a real address the premise. The chips come back the day the field
 * does, and `ShopCard` already takes it.
 */
export const revalidate = 300;

export const metadata: Metadata = {
  title: "المحلات",
  description: "كل المحلات على لوكال — محلات ليها عناوين حقيقية في القاهرة والجيزة، بتجهّز وتبعت بنفسها.",
  alternates: {
    canonical: "/shops",
    languages: { ar: "/shops", en: "/shops?lang=en" },
  },
};

export default async function ShopsPage() {
  const locale = defaultLocale;

  let page;
  try {
    page = await fetchBrands(1, 24);
  } catch {
    page = null;
  }

  return (
    <Shell title={locale === "ar" ? "المحلات" : "Shops"}>
      <div className="lq-wrap lq-pad">
        <section className="lq-sec">
          <div className="lq-sec__head">
            <div>
              <h1 className="lq-sec__title">{locale === "ar" ? "المحلات" : "Shops"}</h1>
              <p className="lq-eyebrow">
                {locale === "ar"
                  ? "محلات ليها عناوين حقيقية تقدر تعدّي عليها."
                  : "Shops with real addresses you could walk to."}
              </p>
            </div>
            {page && page.total > 0 ? (
              <span className="lq-hint" data-num>
                {page.total}
              </span>
            ) : null}
          </div>

          {page === null ? (
            <p className="lq-hint lq-hint--error" role="alert">
              {locale === "ar"
                ? "مش قادرين نوصل للمحلات دلوقتي. حدّث الصفحة بعد شوية."
                : "We cannot reach the shops right now. Reload in a moment."}
            </p>
          ) : page.items.length === 0 ? (
            <p className="lq-hint">
              {locale === "ar"
                ? "المحلات اللي بتوصّل لمنطقتك هتظهر هنا."
                : "Shops that deliver to your area show up here."}
            </p>
          ) : (
            <div className="lq-cells">
              {page.items.map((shop, index) => (
                <ShopCard
                  key={shop.id}
                  shop={shop}
                  locale={locale}
                  delayMs={(index % 3) * 70}
                />
              ))}
            </div>
          )}
        </section>

        {/* The catalogue is paged and this screen shows page one. Said out
            loud rather than left as a silent truncation. */}
        {page && page.total > page.items.length ? (
          <p className="lq-hint">
            {locale === "ar"
              ? `بتشوف أول ${page.items.length} محل من ${page.total}.`
              : `Showing the first ${page.items.length} of ${page.total} shops.`}
          </p>
        ) : null}
      </div>
    </Shell>
  );
}
