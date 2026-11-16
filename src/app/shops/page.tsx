import type { Metadata } from "next";
import Link from "next/link";

import { fetchBrands } from "@/lib/catalog";
import { getLocale } from "@/lib/locale-server";
import { Shell } from "@/components/shell";
import { ShopCard } from "@/components/shop-card";
import { NearestFirst } from "@/components/nearest";
import { EmptyState } from "@/components/state";
import { ReloadButton } from "@/components/reload";

/**
 * المتاجر — the shop index, filterable by area.
 *
 * The area filter reads `shop.neighbourhood` — the shop's own answer from the
 * API, never a hardcoded list. The pills are the areas the listed shops have
 * actually given, so a pill can never filter against a fiction; until any shop
 * has said where it is there are no pills at all. `?area=` is what the home
 * page's area rows link to.
 *
 * NOT ISR: the language comes from a cookie, so the HTML is per-reader. The
 * catalogue read keeps its own `next: { revalidate }`.
 */

export const metadata: Metadata = {
  title: "المتاجر",
  description:
    "كل المتاجر على loqaaal — متاجر لها عناوين حقيقية في القاهرة والجيزة، تجهّز طلبك وترسله بنفسها.",
  alternates: {
    canonical: "/shops",
    languages: { ar: "/shops", en: "/shops?lang=en" },
  },
};

export default async function ShopsPage({
  searchParams,
}: {
  searchParams: Promise<{ area?: string | string[] }>;
}) {
  const locale = await getLocale();
  const t = (ar: string, en: string) => (locale === "ar" ? ar : en);
  const { area: rawArea } = await searchParams;
  const area = (Array.isArray(rawArea) ? rawArea[0] : rawArea)?.trim() || null;

  let page;
  try {
    page = await fetchBrands(1, 24);
  } catch {
    page = null;
  }

  const areas = page
    ? [...new Set(page.items.map((shop) => shop.neighbourhood).filter((n): n is string => Boolean(n)))]
    : [];
  const list = page ? page.items.filter((shop) => !area || shop.neighbourhood === area) : [];

  return (
    <Shell title={area ?? t("المتاجر", "Shops")}>
      <header className="lq-browsehead">
        <h1 className="lq-pagetitle" data-bidi>
          {area ?? t("المتاجر", "Shops")}
        </h1>
        <p className="lq-lede">
          {t("متاجر لها عناوين حقيقية يمكنك زيارتها.", "Shops with real addresses you could walk to.")}
        </p>
      </header>

      {areas.length > 0 ? (
        <nav className="lq-tabsrow" aria-label={t("المناطق", "Areas")}>
          <Link className="lq-btab" href="/shops" aria-current={area ? undefined : "page"}>
            {t("الكل", "All")}
          </Link>
          {areas.map((name) => (
            <Link
              key={name}
              className="lq-btab"
              href={`/shops?area=${encodeURIComponent(name)}`}
              aria-current={area === name ? "page" : undefined}
              data-bidi
            >
              {name}
            </Link>
          ))}
        </nav>
      ) : null}

      <div className="lq-browsebody">
        {page === null ? (
          <EmptyState
            art="crooked"
            tone="loud"
            role="alert"
            seed="shops-down"
            title={t("تعذّر الوصول إلى المتاجر الآن", "We cannot reach the shops right now")}
            body={t(
              "المتاجر تعمل، والخلل في اتصالنا بها في هذه اللحظة. أعد المحاولة.",
              "The shops are open — we are the ones who cannot reach them this second. Try again.",
            )}
            actions={
              <>
                <ReloadButton>{t("أعد المحاولة", "Try again")}</ReloadButton>
                <Link className="lq-btn lq-btn--secondary" href="/categories">
                  {t("تصفّح الأقسام", "Browse the categories")}
                </Link>
              </>
            }
          />
        ) : list.length === 0 ? (
          <EmptyState
            art="shelf"
            seed="shops-empty"
            title={t("لا يوجد متجر هنا بعد", "No shops here yet")}
            body={
              area
                ? t(
                    "ستظهر هنا متاجر هذه المنطقة فور افتتاحها.",
                    "Shops in this area show up here as they open.",
                  )
                : t(
                    "ستظهر هنا المتاجر التي توصّل إلى منطقتك فور افتتاحها. وإن كان لديك متجر، فهذا مكانه.",
                    "Shops that deliver to your area show up here as they open. If you run one, this is where it goes.",
                  )
            }
            actions={
              area ? (
                <Link className="lq-btn lq-btn--primary" href="/shops">
                  {t("كل المتاجر", "All shops")}
                </Link>
              ) : (
                <Link className="lq-btn lq-btn--primary" href="/">
                  {t("الرئيسية", "Home")}
                </Link>
              )
            }
          />
        ) : (
          <div className="lq-shopgrid">
            {/* Nearest first once a delivery location is chosen, in the browser. */}
            <NearestFirst points={list.map((shop) => [shop.location])}>
              {list.map((shop, index) => (
                <ShopCard key={shop.id} shop={shop} locale={locale} delayMs={(index % 3) * 70} />
              ))}
            </NearestFirst>
          </div>
        )}

        {/* The catalogue is paged and this screen shows page one. Said out
            loud rather than left as a silent truncation. */}
        {page && page.total > page.items.length ? (
          <p className="lq-hint lq-browsebody__more">
            {t(
              `تعرض هذه الصفحة أول ${page.items.length} متجرًا من ${page.total}.`,
              `Showing the first ${page.items.length} of ${page.total} shops.`,
            )}
          </p>
        ) : null}
      </div>
    </Shell>
  );
}
