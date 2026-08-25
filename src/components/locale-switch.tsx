"use client";

import { useLocale, setLocaleCookie } from "@/lib/locale-context";
import { locales, type Locale } from "@/lib/locale";

/**
 * العربية / English, in the desktop header.
 *
 * A SEGMENTED CONTROL showing both languages at once, not a single button that
 * flips. A one-button toggle has to answer "does this label name the language I
 * am in, or the one I would get?" and every design answers it differently, so
 * the shopper has to click to find out. Showing both with one pressed cannot be
 * read the wrong way.
 *
 * Each label is written in its OWN script and carries `lang`, so a screen
 * reader pronounces "English" in English inside an Arabic page instead of
 * spelling it out, and so neither label is a translation of the other.
 *
 * `aria-pressed` on both buttons rather than `aria-current` or a radio group:
 * these are two toggle buttons in a group, only one of which can be on, and
 * that is exactly what a pressed state announces.
 *
 * DESKTOP ONLY, deliberately. The phone chrome is a 56px bar carrying the
 * wordmark and a search affordance and there is no room for a third control
 * that is used once ever; `/account` keeps the same switch as a full row, which
 * is where a phone shopper goes to change a preference.
 *
 * Clicking the language already in effect does nothing. `setLocaleCookie`
 * reloads the page, and reloading to arrive where you already are is a bug the
 * shopper experiences as the site flickering for no reason.
 */
export function LocaleSwitch() {
  const locale = useLocale();

  const label: Record<Locale, string> = { ar: "عربي", en: "English" };

  return (
    <div
      className="lq-lang"
      role="group"
      /* Named in both languages: this control is the one thing on the page a
         shopper reading the "wrong" language still has to be able to find. */
      aria-label="اللغة / Language"
    >
      {locales.map((code) => (
        <button
          key={code}
          type="button"
          lang={code}
          aria-pressed={locale === code}
          onClick={() => {
            if (locale !== code) setLocaleCookie(code);
          }}
        >
          {label[code]}
        </button>
      ))}
    </div>
  );
}
