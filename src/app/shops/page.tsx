import type { Metadata } from "next";
import Link from "next/link";

import { fetchBrands } from "@/lib/catalog";
import { getLocale } from "@/lib/locale-server";
import { Shell } from "@/components/shell";
import { ShopCard } from "@/components/shop-card";
import { EmptyState } from "@/components/state";
import { ReloadButton } from "@/components/reload";

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
/**
 * NOT ISR, and it cannot be: the language comes from a cookie, so the HTML is
 * per-reader. `revalidate` asked Next to cache one copy of it, which threw
 * DYNAMIC_SERVER_USAGE on every request — a 500 on the shop pages and a
 * "we cannot reach the categories" on the ones that catch their own errors.
 *
 * The catalogue reads keep their own `next: { revalidate }`, so a request
 * costs a render and no database round trip.
 */

export const metadata: Metadata = {
  title: "المحلات",
  description: "كل المحلات على loqaaal — محلات ليها عناوين حقيقية في القاهرة والجيزة، بتجهّز وتبعت بنفسها.",
  alternates: {
    canonical: "/shops",
    languages: { ar: "/shops", en: "/shops?lang=en" },
  },
};

export default async function ShopsPage() {
  const locale = await getLocale();

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
              <h1 className="lq-phead__title">
                {locale === "ar" ? "المحلات" : "Shops"}
                {page && page.total > 0 ? (
                  <span className="lq-sec__count" data-num>
                    {" · "}
                    {page.total}
                  </span>
                ) : null}
              </h1>
              <p className="lq-eyebrow">
                {locale === "ar"
                  ? "محلات ليها عناوين حقيقية تقدر تعدّي عليها."
                  : "Shops with real addresses you could walk to."}
              </p>
            </div>
          </div>

          {page === null ? (
            <EmptyState
              art="crooked"
              tone="loud"
              role="alert"
              seed="shops-down"
              title={
                locale === "ar"
                  ? "مش قادرين نوصل للمحلات دلوقتي"
                  : "We cannot reach the shops right now"
              }
              body={
                locale === "ar"
                  ? "المحلات فاتحة، إحنا اللي مش واصلين ليها في اللحظة دي. جرّب تاني."
                  : "The shops are open — we are the ones who cannot reach them this second. Try again."
              }
              actions={
                <>
                  <ReloadButton>{locale === "ar" ? "حاول تاني" : "Try again"}</ReloadButton>
                  <Link className="lq-btn lq-btn--secondary" href="/categories">
                    {locale === "ar" ? "اتفرّج على الأقسام" : "Browse the categories"}
                  </Link>
                </>
              }
            />
          ) : page.items.length === 0 ? (
            <EmptyState
              art="shelf"
              seed="shops-empty"
              title={locale === "ar" ? "لسه مفيش محل هنا" : "No shops here yet"}
              body={
                locale === "ar"
                  ? "المحلات اللي بتوصّل لمنطقتك هتظهر هنا أول ما تفتح. لو عندك محل، ده مكانه."
                  : "Shops that deliver to your area show up here as they open. If you run one, this is where it goes."
              }
              actions={
                <Link className="lq-btn lq-btn--primary" href="/">
                  {locale === "ar" ? "الرئيسية" : "Home"}
                </Link>
              }
            />
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
