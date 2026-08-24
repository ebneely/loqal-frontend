"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { useBagCount } from "@/lib/cart";
import { useLocale } from "@/lib/locale-context";
import { BrandsMenu } from "@/components/brands-menu";
import { SiteFooter } from "@/components/site-footer";
import { Reveal } from "@/components/reveal";

/**
 * The storefront chrome.
 *
 * TWO CHROMES, ONE SET OF DESTINATIONS, decided by a CONTAINER query in
 * components.css — `.lq-shell` sets `container-type: inline-size`, and the
 * storefront rule is that a 430px phone frame embedded in a desktop page still
 * lays out like a phone. Nothing here reads the viewport and nothing branches
 * on width in JS.
 *
 *   Phone    56px bar with the mark and a search affordance, and the five-slot
 *            tab bar at the bottom. No footer: a dark 400px block above a fixed
 *            tab bar is a dead end, and `/account` carries those links.
 *   Desktop  the utility strip, a sticky header with the mark, a live search
 *            field and the tools, the brands mega-menu, and the footer. No tab
 *            bar — five buttons pinned to the bottom of a 1080px window with
 *            nothing near them is what "mobile on desktop" looks like.
 *
 * Both chromes are in the markup at all times and one is hidden by the
 * container query. That is deliberate: branching in JS would need the width,
 * which the server does not have, and would flash the wrong chrome on hydration.
 *
 * WHY THE TWO NAVIGATIONS DIFFER, and why they still agree: the phone tab bar
 * is the five destinations, and the desktop header is the same five plus the
 * brands mega-menu. `design/`'s header carried only الأقسام, المحلات and السلة,
 * which leaves a signed-in shopper no way to reach their own orders above
 * 720px. Every destination is reachable at every width.
 */

const TABS = [
  { href: "/", icon: "house", ar: "الرئيسية", en: "Home" },
  { href: "/search", icon: "search", ar: "البحث", en: "Search" },
  { href: "/bag", icon: "shopping-bag", ar: "السلة", en: "Bag" },
  { href: "/orders", icon: "package", ar: "أوردراتي", en: "Orders" },
  { href: "/account", icon: "user", ar: "حسابي", en: "Account" },
] as const;

/**
 * The three claims in the utility strip. Facts a shopper weighs before they
 * start, which is why they sit above the header rather than inside a page.
 *
 * NO tracking and NO uppercase on this strip — see `.lq-util` in
 * components.css. It carries Arabic.
 */
const CLAIMS = [
  { ar: "توصيل في نفس اليوم — القاهرة والجيزة", en: "Same-day delivery — Cairo & Giza" },
  { ar: "الدفع عند الاستلام", en: "Cash on delivery" },
  { ar: "استبدال خلال 14 يوم", en: "14-day returns" },
] as const;

/**
 * `/` matches only itself; every other destination owns its subtree, so a
 * product page keeps Home lit rather than lighting nothing at all.
 */
const isActive = (pathname: string, href: string) =>
  href === "/" ? pathname === "/" : pathname.startsWith(href);

export function Shell({
  children,
  title,
}: {
  children: ReactNode;
  /** Centred in the phone top bar. Omitted on home, which shows the mark. */
  title?: string;
}) {
  const locale = useLocale();
  const pathname = usePathname();
  const bagCount = useBagCount();
  const t = (ar: string, en: string) => (locale === "ar" ? ar : en);
  const label = (tab: (typeof TABS)[number]) => (locale === "ar" ? tab.ar : tab.en);

  return (
    <div className="lq-shell">
      {/* Renders nothing. Mounted once here so a SERVER component can opt into
          the entrance with a `.lq-rv` class and never has to become a client
          component just to animate. */}
      <Reveal />

      {/* ── Desktop ─────────────────────────────────────────────────────── */}
      <div className="lq-util">
        {CLAIMS.map((claim) => (
          <span key={claim.en}>{t(claim.ar, claim.en)}</span>
        ))}
      </div>

      <header className="lq-head">
        <div className="lq-head__bar">
          <Link href="/" className="lq-mark" aria-label="Loqal">
            {t("لوكال", "Loqal")}
          </Link>

          {/* A real link, not a live field. Search is a route with its own
              query state; a second input in the chrome would be a second
              source of truth for the same term. */}
          <Link className="lq-head__search lq-search" href="/search">
            <span className="lq-icon" data-icon="search" aria-hidden="true" />
            <span className="lq-search__fake">
              {t("دوّر على قطعة أو محل…", "Search for a piece or a shop…")}
            </span>
          </Link>

          <nav className="lq-tools" aria-label={t("التنقل", "Navigation")}>
            <Link href="/categories" aria-current={isActive(pathname, "/categories") ? "page" : undefined}>
              {t("الأقسام", "Categories")}
            </Link>

            <BrandsMenu />

            <Link href="/orders" aria-current={isActive(pathname, "/orders") ? "page" : undefined}>
              {t("أوردراتي", "Orders")}
            </Link>
            <Link href="/account" aria-current={isActive(pathname, "/account") ? "page" : undefined}>
              {t("حسابي", "Account")}
            </Link>
            <Link href="/bag" aria-current={isActive(pathname, "/bag") ? "page" : undefined}>
              {t("السلة", "Bag")}
              {bagCount > 0 ? <span className="lq-cartn" data-num>{bagCount}</span> : null}
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Phone ───────────────────────────────────────────────────────── */}
      <header className="lq-topbar">
        {title ? (
          <span className="lq-topbar__title">{title}</span>
        ) : (
          /* No logo file exists anywhere in the repo and none has been drawn.
             Wherever a mark would go, the word is set in Readex Pro 700 at
             −0.03em — which is what `.lq-topbar__mark` is. */
          <Link href="/" className="lq-topbar__mark" aria-label="Loqal">
            {t("لوكال", "Loqal")}
          </Link>
        )}
        <Link
          className="lq-iconbtn lq-topbar__end"
          href="/search"
          aria-label={t("بحث", "Search")}
        >
          <span className="lq-icon" data-icon="search" aria-hidden="true" />
        </Link>
      </header>

      <main style={{ flex: 1 }}>{children}</main>

      <SiteFooter />

      <nav className="lq-tabbar" aria-label={t("التنقل", "Navigation")}>
        {TABS.map((tab) => {
          const active = isActive(pathname, tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="lq-tab"
              aria-current={active ? "page" : undefined}
            >
              <span className="lq-tab__wrap">
                <span className="lq-icon" data-icon={tab.icon} aria-hidden="true" />
                {tab.href === "/bag" && bagCount > 0 ? (
                  <span className="lq-cartn lq-tab__badge" data-num>
                    {bagCount}
                  </span>
                ) : null}
              </span>
              {/* Labels are ALWAYS visible — the tab bar is 60px for exactly
                  that reason. An icon alone is a guess. */}
              <span>{label(tab)}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
