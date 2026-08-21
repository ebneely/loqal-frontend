"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { useBagCount } from "@/lib/cart";
import { useLocale } from "@/lib/locale-context";

/**
 * The storefront chrome.
 *
 * ONE COMPONENT, TWO LAYOUTS, decided by a CONTAINER query in globals.css —
 * `.lq-shell` sets `container-type: inline-size`, and the storefront rule is
 * that a 430px phone frame embedded in a desktop page still lays out like a
 * phone. Nothing here reads the viewport, and nothing branches on width in JS.
 *
 *   Phone   56px bar with the mark, and the five-slot tab bar at the bottom.
 *   Desktop 72px bar carrying the same five destinations as inline links, and
 *           NO tab bar — five buttons pinned to the bottom of a 1080px window
 *           with nothing near them is what "mobile on desktop" looks like.
 *
 * The destinations are declared once and rendered twice, so the two chromes
 * cannot drift into offering different navigation.
 */

const TABS = [
  { href: "/", icon: "house", ar: "الرئيسية", en: "Home" },
  { href: "/search", icon: "search", ar: "البحث", en: "Search" },
  { href: "/bag", icon: "shopping-bag", ar: "السلة", en: "Bag" },
  { href: "/orders", icon: "package", ar: "أوردراتي", en: "Orders" },
  { href: "/account", icon: "user", ar: "حسابي", en: "Account" },
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
  const label = (tab: (typeof TABS)[number]) => (locale === "ar" ? tab.ar : tab.en);

  return (
    <div className="lq-shell">
      <header className="lq-topbar">
        {title ? (
          <span className="lq-topbar__title">{title}</span>
        ) : (
          /* No logo file exists anywhere in the repo and none has been drawn.
             Wherever a mark would go, the word is set in Readex Pro 700 at
             −0.03em — which is what `.lq-topbar__mark` is. */
          <Link href="/" className="lq-topbar__mark" aria-label="Loqal">
            {locale === "ar" ? "لوكال" : "Loqal"}
          </Link>
        )}

        {/* Desktop only. Hidden by default and revealed by the container
            query, so the phone never pays for markup it does not show. */}
        <nav
          className="lq-topbar__nav"
          aria-label={locale === "ar" ? "التنقل" : "Navigation"}
        >
          {TABS.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={isActive(pathname, tab.href) ? "page" : undefined}
            >
              {label(tab)}
              {tab.href === "/bag" && bagCount > 0 ? ` · ${bagCount}` : ""}
            </Link>
          ))}
        </nav>
      </header>

      <main style={{ flex: 1 }}>{children}</main>

      {/* Phone only — the container query hides this at 1024. */}
      <nav
        className="lq-tabbar"
        aria-label={locale === "ar" ? "التنقل" : "Navigation"}
      >
        {TABS.map((tab) => {
          const active = isActive(pathname, tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="lq-tab"
              data-active={active}
              aria-current={active ? "page" : undefined}
            >
              <span className="lq-topbar__slot">
                <span className="lq-icon" data-icon={tab.icon} aria-hidden="true" />
                {tab.href === "/bag" && bagCount > 0 ? (
                  <span className="lq-badge lq-badge--count">{bagCount}</span>
                ) : null}
              </span>
              {/* Labels are ALWAYS visible — the design system pins the tab bar
                  at 60px for exactly that reason. An icon alone is a guess. */}
              <span>{label(tab)}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
