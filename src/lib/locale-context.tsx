"use client";

import { createContext, useContext } from "react";
import type { ReactNode } from "react";

import { defaultLocale, LOCALE_COOKIE, type Locale } from "./locale";

/**
 * The language, handed down from the server render.
 *
 * It used to be read from the cookie here, on mount. That left the server
 * rendering Arabic and the browser correcting it after hydration: the chrome
 * flashed Arabic on every reload, and server-rendered catalogue copy never
 * corrected at all, because a server component does not re-render on the
 * client. `getLocale()` in `lib/locale-server.ts` resolves it before the HTML
 * is written instead.
 */
const LocaleContext = createContext<Locale>(defaultLocale);

export function useLocale(): Locale {
  return useContext(LocaleContext);
}

export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

/**
 * The toggle. Writes the cookie, then reloads — the strings are in the HTML the
 * server wrote, so a re-render alone would not change them.
 */
export function setLocaleCookie(next: Locale) {
  // A year, path-wide, Lax — it is a preference, not a credential.
  document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
  window.location.reload();
}
