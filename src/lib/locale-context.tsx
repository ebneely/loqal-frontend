"use client";

import { createContext, useContext, useEffect, useSyncExternalStore } from "react";
import type { ReactNode } from "react";

import { defaultLocale, isLocale, localeDir, LOCALE_COOKIE, type Locale } from "./locale";

/**
 * The language, resolved in the BROWSER — and this is the decision that keeps
 * the catalogue on ISR.
 *
 * Reading the cookie in a server component (a layout or a page) marks the whole
 * route dynamic, and `next build` then reports every product page as `ƒ` rather
 * than a revalidating static one. That is not a small loss: a product page is
 * identical for every visitor, and rendering it per request is the difference
 * between a shop that survives a good day and one that falls over on it.
 *
 * So the server renders ARABIC, statically, and English is applied on the
 * client. That is the right way round rather than a compromise: the design
 * system is explicit that Arabic is the original and English is "a toggle, not
 * the source string", and Arabic is the language the pages should rank in.
 *
 * THE COST, stated plainly: a shopper who has chosen English sees one frame of
 * Arabic before this swaps it, on a cold load only. If that becomes
 * unacceptable the fix is Next 16 Cache Components (`use cache` on the
 * catalogue read, a dynamic shell around it), not a return to reading cookies
 * at the top of the tree.
 */
const LocaleContext = createContext<Locale>(defaultLocale);

export function useLocale(): Locale {
  return useContext(LocaleContext);
}

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * The cookie never changes without a full reload — `setLocaleCookie` below
 * reloads deliberately — so there is nothing to subscribe to.
 */
const subscribe = () => () => {};

function getSnapshot(): Locale {
  const stored = readCookie(LOCALE_COOKIE);
  return stored && isLocale(stored) ? stored : defaultLocale;
}

/** What the server rendered, so hydration matches the HTML it produced. */
const getServerSnapshot = (): Locale => defaultLocale;

export function LocaleProvider({ children }: { children: ReactNode }) {
  /**
   * `useSyncExternalStore` rather than `useState` + `useEffect`.
   *
   * The value lives outside React (a cookie), it cannot be read during a server
   * render, and it must not tear during hydration — which is the exact problem
   * this hook exists for. Setting state inside an effect would do the same job
   * one wasted render later, and React's own lint rule refuses it.
   */
  const locale = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  /**
   * `lang` and `dir` live on <html>, which this component does not render — the
   * server did. This is a DOM side effect on an element React does not own, so
   * an effect is correct here in a way that setting state would not be.
   */
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = localeDir(locale);
  }, [locale]);

  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

/**
 * The toggle itself. Writes the cookie, then reloads.
 *
 * A reload rather than a re-render: half the strings on a catalogue page were
 * rendered on the server and are in the ISR payload, so flipping the context
 * alone would leave Arabic product copy under an English chrome. One navigation
 * is honest and is what a shopper expects from a language switch.
 */
export function setLocaleCookie(next: Locale) {
  // A year, path-wide, Lax — it is a preference, not a credential.
  document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
  window.location.reload();
}
