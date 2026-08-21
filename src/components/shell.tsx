"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { useBagCount } from "@/lib/cart";
import { useLocale } from "@/lib/locale-context";

/**
 * The storefront chrome: a sticky top bar and a five-slot bottom tab bar.
 *
 * `.lq-shell` sets `container-type: inline-size`, which is what makes every
 * grid inside it a CONTAINER query rather than a media query — a 430px phone
 * frame embedded in a desktop page still lays out like a phone. Nothing in the
 * storefront may read the viewport.
 *
 * Client, and only because of the bag count and the active tab. Everything the
 * shell wraps stays a server component.
 */

const TABS = [
  { href: "/", icon: "home", ar: "الرئيسية", en: "Home" },
  { href: "/search", icon: "search", ar: "البحث", en: "Search" },
  { href: "/bag", icon: "shopping-bag", ar: "السلة", en: "Bag" },
  { href: "/orders", icon: "receipt", ar: "أوردراتي", en: "Orders" },
  { href: "/account", icon: "person", ar: "حسابي", en: "Account" },
] as const;

export function Shell({
  children,
  title,
}: {
  children: ReactNode;
  /** Centred in the top bar. Omitted on the home screen, which shows the mark. */
  title?: string;
}) {
  const locale = useLocale();
  const pathname = usePathname();
  const bagCount = useBagCount();

  return (
    <div className="lq-shell">
      <header className="lq-topbar">
        {title ? (
          <span className="lq-topbar__title">{title}</span>
        ) : (
          /* No logo file exists anywhere in the repo, and none has been drawn.
             Wherever a mark would go, the word is set in Readex Pro 700 at
             −0.03em — which is what `.lq-topbar__mark` is. */
          <Link href="/" className="lq-topbar__mark" aria-label="Loqal">
            {locale === "ar" ? "لوكال" : "Loqal"}
          </Link>
        )}
      </header>

      <main style={{ flex: 1 }}>{children}</main>

      <nav className="lq-tabbar" aria-label={locale === "ar" ? "التنقل" : "Navigation"}>
        {TABS.map((tab) => {
          // "/" only matches itself; every other tab owns its subtree, so a
          // product page keeps Home lit rather than lighting nothing.
          const active =
            tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
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
              <span>{locale === "ar" ? tab.ar : tab.en}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
