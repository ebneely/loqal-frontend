"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import type { ReactNode } from "react";

import { useBagCount } from "@/lib/cart";
import { useLocale } from "@/lib/locale-context";
import { BrandsMenu } from "@/components/brands-menu";
import { CategoriesMenu } from "@/components/categories-menu";
import { NavDrawer } from "@/components/nav-drawer";
import { SiteFooter } from "@/components/site-footer";
import { LocaleSwitch } from "@/components/locale-switch";
import { Reveal } from "@/components/reveal";
import { Wordmark } from "@/components/wordmark";

/**
 * The storefront chrome.
 *
 * TWO CHROMES, ONE SET OF DESTINATIONS, decided by a CONTAINER query in
 * components.css — `.lq-shell` sets `container-type: inline-size`, and the
 * storefront rule is that a 430px phone frame embedded in a desktop page still
 * lays out like a phone. Nothing here reads the viewport and nothing branches
 * on width in JS.
 *
 *   Phone    56px bar with a hamburger, the mark and a search affordance; the
 *            five-slot tab bar at the bottom; and a drawer behind the hamburger
 *            for everything the five slots cannot carry. No footer: a dark
 *            400px block above a fixed tab bar is a dead end, and the drawer
 *            carries the footer's links.
 *   Desktop  a sticky three-column header — destinations at the inline start,
 *            the mark in the centre, the tools at the inline end — and the
 *            footer. No tab bar. On home the header lies over the hero instead
 *            (`data-home` on the shell; see components.css).
 *
 * Both chromes are in the markup at all times and one is hidden by the
 * container query. That is deliberate: branching in JS would need the width,
 * which the server does not have, and would flash the wrong chrome on hydration.
 *
 * WHY THE TWO NAVIGATIONS DIFFER, and why they still agree: the phone carries
 * five tabs plus a drawer, and the desktop header carries the same destinations
 * plus the brands mega-menu. `design/`'s header carried only الأقسام, المحلات
 * and السلة, which leaves a signed-in shopper no way to reach their own orders
 * above 720px. Every destination is reachable at every width.
 */

/**
 * FIVE SLOTS, and the two that changed are the whole argument.
 *
 * Seven does not fit: at 390px each slot is ~50px and the labels — which are
 * always visible here, on purpose — stop being readable. So the bar carries the
 * five things a shop is for and the other two move somewhere that suits them
 * better rather than being deleted.
 *
 *   OUT, Search   it already has a permanent affordance in the top bar, one tap
 *                 away on every screen, so a slot of its own bought nothing.
 *   OUT, Account  a preference-and-history destination visited deliberately and
 *                 rarely, which is exactly what a hamburger drawer is for.
 *   IN, Products  the two things a marketplace is for were both missing from
 *   IN, Shops     the bar. Products lands on `/categories`, which IS the
 *                 browse-the-catalogue route — there is no `/products` in
 *                 `src/app` and a tab pointing at a 404 is worse than no tab.
 *
 * Every one of these hrefs is a real route: `/`, `/categories`, `/shops`,
 * `/bag`, `/orders`. Check `src/app` before adding a sixth.
 */
const TABS = [
  { href: "/", icon: "house", ar: "الرئيسية", en: "Home" },
  { href: "/categories", icon: "shirt", ar: "الأقسام", en: "Categories" },
  { href: "/shops", icon: "store", ar: "المتاجر", en: "Shops" },
  { href: "/bag", icon: "shopping-bag", ar: "السلة", en: "Bag" },
  { href: "/orders", icon: "package", ar: "طلباتي", en: "Orders" },
] as const;

/**
 * The three facts a shopper weighs before they start. The footer states them;
 * one source so the two places cannot drift apart.
 */
export const CLAIMS = [
  {
    ar: "توصيل في اليوم نفسه داخل القاهرة والجيزة",
    en: "Same-day delivery in Cairo & Giza",
  },
  { ar: "الدفع عند الاستلام", en: "Cash on delivery" },
  { ar: "الاستبدال خلال 14 يومًا", en: "14-day returns" },
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
  const label = (tab: (typeof TABS)[number]) =>
    locale === "ar" ? tab.ar : tab.en;
  /** The search route owns a real input; the chrome must not add a second. */
  const onSearch = pathname.startsWith("/search");

  /**
   * The drawer's state lives here rather than inside `NavDrawer`, because the
   * trigger and the panel cannot be siblings: the button belongs in the top bar
   * for layout and tab order, and the panel has to escape it entirely — see the
   * containing-block note in nav-drawer.tsx.
   *
   * NOTHING HERE READS THE VIEWPORT. The drawer is unreachable above 720px
   * because the bar the trigger sits in is hidden there by the container query,
   * not because any JS measured a width.
   */
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLButtonElement>(null);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  /** Passed to the drawer so its rows light the same way the tabs do. */
  const activeHere = useCallback(
    (href: string) => isActive(pathname, href),
    [pathname],
  );

  return (
    <div className="lq-shell" data-home={pathname === "/" || undefined}>
      {/* Renders nothing. Mounted once here so a SERVER component can opt into
          the entrance with a `.lq-rv` class and never has to become a client
          component just to animate. */}
      <Reveal />

      {/* ── Desktop ─────────────────────────────────────────────────────── */}
      <header className="lq-head">
        <div className="lq-head__bar">
          <nav className="lq-head__nav" aria-label={t("التنقل", "Navigation")}>
            {/* Both are panels that still point at their real route for a
                middle-click. */}
            <CategoriesMenu />
            <BrandsMenu />
            <Link
              href="/orders"
              aria-current={isActive(pathname, "/orders") ? "page" : undefined}
            >
              {t("طلباتي", "Orders")}
            </Link>
          </nav>

          <Link href="/" className="lq-mark" aria-label="loqaaal">
            <Wordmark />
          </Link>

          <div className="lq-tools">
            {/* Not on /search, where the page owns the real input and a link
                back to it would be a second search box. */}
            {onSearch ? null : (
              <Link href="/search" aria-label={t("بحث", "Search")}>
                <span className="lq-icon" data-icon="search" aria-hidden="true" />
              </Link>
            )}
            <Link
              href="/account"
              aria-label={t("حسابي", "Account")}
              aria-current={isActive(pathname, "/account") ? "page" : undefined}
            >
              <span className="lq-icon" data-icon="user" aria-hidden="true" />
            </Link>
            <Link
              className="lq-bag"
              href="/bag"
              aria-current={isActive(pathname, "/bag") ? "page" : undefined}
            >
              <span className="lq-icon" data-icon="shopping-bag" aria-hidden="true" />
              {t("السلة", "Bag")}
              {bagCount > 0 ? (
                <span className="lq-bag__n" data-num>
                  ({bagCount})
                </span>
              ) : null}
            </Link>
            {/* A preference, not a destination: last in the row. */}
            <LocaleSwitch />
          </div>
        </div>
      </header>

      {/* ── Phone ───────────────────────────────────────────────────────── */}
      <header className="lq-topbar">
        {/* THE LEADING CONTROL, before the mark and before any title. Every
            destination that is not one of the five tabs is behind it, so it is
            the first thing in the bar and the first thing in the tab order.
            It needs no width rule of its own: `.lq-topbar` is hidden above
            720px, and the hamburger goes with it. */}
        <button
          ref={menuRef}
          type="button"
          className="lq-iconbtn lq-topbar__menu"
          onClick={() => setMenuOpen(true)}
          aria-label={t("القائمة", "Menu")}
          aria-expanded={menuOpen}
          aria-haspopup="dialog"
        >
          <span className="lq-icon" data-icon="menu" aria-hidden="true" />
        </button>

        {title ? (
          <span className="lq-topbar__title">{title}</span>
        ) : (
          /* No logo file exists anywhere in the repo and none has been drawn.
             Wherever a mark would go, the word is set in Readex Pro 700 at
             −0.03em — which is what `.lq-topbar__mark` is. */
          <Link href="/" className="lq-topbar__mark" aria-label="loqaaal">
            <Wordmark />
          </Link>
        )}
        {/* Same rule as the desktop header: not on /search, where it would
            link to the page it is already on. */}
        {onSearch ? null : (
          <Link
            className="lq-iconbtn lq-topbar__end"
            href="/search"
            aria-label={t("بحث", "Search")}
          >
            <span className="lq-icon" data-icon="search" aria-hidden="true" />
          </Link>
        )}
      </header>

      {/* A SIBLING of the bar, never a child of it. It portals itself out to
          `document.body` from here; rendering it inside `.lq-topbar` would put
          a fixed panel inside a `backdrop-filter`ed containing block, which is
          the bug brands-menu.tsx documents at length. */}
      <NavDrawer
        open={menuOpen}
        onClose={closeMenu}
        triggerRef={menuRef}
        isActive={activeHere}
      />

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
                <span
                  className="lq-icon"
                  data-icon={tab.icon}
                  aria-hidden="true"
                />
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
