"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import type { RefObject } from "react";
import { createPortal } from "react-dom";

import { useLocale } from "@/lib/locale-context";
import { LocaleSwitch } from "@/components/locale-switch";
import { Wordmark } from "@/components/wordmark";

/**
 * The phone navigation drawer — everything that is not one of the five tabs.
 *
 * It exists because a five-slot tab bar is the whole of the phone navigation,
 * and five slots cannot carry a marketplace. Account, the category index, the
 * shop index, the language preference and the six links the desktop footer
 * carries all live here; the footer itself is hidden under 720px, so without
 * this drawer those six links are unreachable on a phone.
 *
 * WHY IT IS PORTALLED TO `document.body`, and it has to be:
 *
 * `.lq-shell` sets `container-type: inline-size`, which applies layout
 * containment, and a layout-contained element is A CONTAINING BLOCK FOR FIXED
 * DESCENDANTS. A `position: fixed` panel rendered inside the shell therefore
 * resolves `inset-block: 0` against the SHELL's box — the whole scrolling
 * document, not the viewport — so on a page scrolled halfway down the drawer
 * would be pinned to the top of the document, off screen, with a scrim the
 * height of the article. `.lq-topbar` adds a second reason: it sets
 * `backdrop-filter`, and a filter is a containing block for fixed descendants
 * too. So the trigger stays in the bar (layout, tab order) and the overlays
 * escape to the body. `brands-menu.tsx` portals its mega panel for the same
 * reason and says so at length.
 *
 * THE COST OF THE PORTAL, stated so nobody is surprised by it: outside
 * `.lq-shell` there is no query container, so the drawer cannot be hidden by
 * the 720px container query the way `.lq-topbar` is. It does not need to be —
 * the only way to open it is the hamburger, which lives in `.lq-topbar` and is
 * hidden above 720px — but a shopper who opens it at 390px and then widens the
 * window past 720px keeps an open drawer until they dismiss it. Closing it on
 * width would mean reading the viewport in JS, which is the one thing this
 * chrome refuses to do.
 *
 * MOUNTED AT ALL WIDTHS AND ALWAYS IN THE DOM, translated off the inline-start
 * edge while closed and `inert` — not conditionally rendered. `inert` is what
 * takes it out of the tab order and the accessibility tree, so a hidden drawer
 * costs a desktop reader nothing, and keeping it mounted is what lets it
 * transition out instead of vanishing mid-slide.
 */

/**
 * A store that never changes, hoisted so the subscribe identity is stable —
 * the same call `brands-menu.tsx` makes, for the same reason: `document.body`
 * does not exist during the server render, and the fact of being on the client
 * must not tear during hydration.
 */
const subscribeNever = () => () => {};
const onClient = () => true;
const onServer = () => false;

/**
 * The destinations the tab bar cannot carry, plus the two it can.
 *
 * `/categories` appears here under the tab bar's own word — المنتجات — because
 * one route may not answer to two names: a drawer calling it الأقسام while the
 * tab beneath calls it المنتجات reads as two places, and a shopper who wants
 * "products" looks in the drawer and decides there are none.
 */
const PLACES = [
  { href: "/account", icon: "user", ar: "حسابي", en: "Account" },
  { href: "/categories", icon: "shirt", ar: "المنتجات", en: "Products" },
  { href: "/shops", icon: "store", ar: "المحلات", en: "Shops" },
  { href: "/orders", icon: "package", ar: "أوردراتي", en: "Orders" },
] as const;

/**
 * COPIED FROM `site-footer.tsx`, and the duplication is on purpose rather than
 * an oversight: that file does not export its `LINKS`, and the footer is a
 * DESKTOP-ONLY component the container query hides under 720px. If the footer's
 * list changes, change this one too — or export it there and import it here.
 */
const LINKS = [
  { ar: "عن loqaaal", en: "About loqaaal", href: "https://join-loqaaal.vercel.app/" },
  { ar: "انضم كمحل", en: "Join as a shop", href: "https://join-loqaaal.vercel.app/" },
  { ar: "الشحن والتوصيل", en: "Shipping", href: "/account" },
  { ar: "الاستبدال والاسترجاع", en: "Returns", href: "/account" },
  { ar: "الأسئلة الشائعة", en: "FAQ", href: "/account" },
  { ar: "تواصل معنا", en: "Contact", href: "/account" },
] as const;

/** Everything a Tab can land on inside the panel. Order is DOM order. */
const FOCUSABLE = 'a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function NavDrawer({
  open,
  onClose,
  triggerRef,
  isActive,
}: {
  open: boolean;
  onClose: () => void;
  /** Focus goes back here on every dismissal that is not a navigation. */
  triggerRef: RefObject<HTMLButtonElement | null>;
  /** The shell's own active-route test, so the drawer and the tabs agree. */
  isActive: (href: string) => boolean;
}) {
  const locale = useLocale();
  const t = (ar: string, en: string) => (locale === "ar" ? ar : en);
  const panelRef = useRef<HTMLDivElement>(null);

  /**
   * Dismissal, as opposed to navigation. Escape, the scrim and the close button
   * all end with the pointer or the caret nowhere, so focus is handed back to
   * the control that opened the drawer. A link does NOT go through here: the
   * page is about to change and dragging focus back to the top bar would undo
   * whatever the new route wants to focus.
   */
  const dismiss = useCallback(() => {
    onClose();
    triggerRef.current?.focus();
  }, [onClose, triggerRef]);

  /**
   * Focus in, Escape out, and Tab kept inside while it is open — a drawer over
   * a scrim is a modal, and a modal a keyboard can walk out of behind the scrim
   * is worse than no drawer at all.
   */
  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    if (!panel) return;

    panel.querySelector<HTMLElement>(FOCUSABLE)?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        dismiss();
        return;
      }
      if (event.key !== "Tab") return;

      const items = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)];
      if (items.length === 0) return;

      const first = items[0];
      const last = items[items.length - 1];
      const here = document.activeElement;
      /** Off the end, off the start, or somehow outside: wrap it back in. */
      if (!panel.contains(here)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && here === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && here === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, dismiss]);

  /**
   * The page behind a scrim does not scroll. Restored to whatever it was rather
   * than to `""`, so two overlays open at once cannot leave the body locked.
   */
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const mounted = useSyncExternalStore(subscribeNever, onClient, onServer);
  if (!mounted) return null;

  return createPortal(
    <>
      <div
        className="lq-nav__scrim"
        data-open={open}
        onClick={dismiss}
        aria-hidden="true"
      />

      <div
        ref={panelRef}
        className="lq-nav"
        data-open={open}
        role="dialog"
        aria-modal="true"
        aria-label={t("القائمة", "Menu")}
        /** React 19 types `inert` as a boolean and serialises the attribute
            itself. `pointer-events:none` alone would stop the pointer and leave
            every link in the tab order. */
        inert={!open}
      >
        <div className="lq-nav__head">
          <Link href="/" className="lq-nav__mark" aria-label="loqaaal" onClick={onClose}>
            <Wordmark />
          </Link>
          <button
            type="button"
            className="lq-iconbtn lq-nav__close"
            onClick={dismiss}
            aria-label={t("اقفل القائمة", "Close menu")}
          >
            <span className="lq-icon" data-icon="x" aria-hidden="true" />
          </button>
        </div>

        <nav className="lq-nav__body" aria-label={t("التنقل", "Navigation")}>
          <div className="lq-nav__sec">
            {PLACES.map((place) => (
              <Link
                key={place.href}
                href={place.href}
                className="lq-nav__link"
                aria-current={isActive(place.href) ? "page" : undefined}
                onClick={onClose}
              >
                <span className="lq-icon" data-icon={place.icon} aria-hidden="true" />
                <span>{t(place.ar, place.en)}</span>
              </Link>
            ))}
          </div>

          <div className="lq-nav__sec">
            <p className="lq-nav__cap">{t("المزيد", "More")}</p>
            <div className="lq-nav__more">
              {LINKS.map((link) =>
                link.href.startsWith("http") ? (
                  <a
                    key={link.en}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={onClose}
                  >
                    {t(link.ar, link.en)}
                  </a>
                ) : (
                  <Link key={link.en} href={link.href} onClick={onClose}>
                    {t(link.ar, link.en)}
                  </Link>
                )
              )}
            </div>
          </div>

          {/* A preference, not a destination, so it is last and it is not a
              row that navigates. The same segmented control the desktop header
              carries — the phone had no room for it in a 56px bar, which is
              exactly the gap a drawer fills. */}
          <div className="lq-nav__sec lq-nav__lang">
            <span>{t("اللغة", "Language")}</span>
            <LocaleSwitch />
          </div>
        </nav>
      </div>
    </>,
    document.body
  );
}
