"use client";

import { localeDir, defaultLocale } from "@/lib/locale";

import "./globals.css";

/**
 * The last resort: a throw in the ROOT LAYOUT itself.
 *
 * This file REPLACES `layout.tsx`, so it owns `<html>` and `<body>` — nothing
 * above it renders, which is also why it imports `globals.css` itself. Without
 * that import this screen would be unstyled text on white.
 *
 * NO HOOKS AND NO CONTEXT. `LocaleProvider` and `QueryProvider` live in the
 * root layout, which is the thing that just failed, so `useLocale()` here would
 * only ever answer the default and `useBagCount()` would be a second crash
 * inside the crash handler. It says both languages instead, the way
 * `not-found.tsx` does: the one thing this screen knows about the reader is
 * that they hit a wall.
 *
 * NO next/font EITHER. Loading a font loader in a file that only renders when
 * the app is already broken buys a second webfont on the worst render of the
 * session; `--font-sans` falls through to the system stack, which carries
 * Arabic on every device this storefront targets.
 *
 * A FULL DOCUMENT LOAD out to the home page, not a `<Link>` and not
 * `router.push`: the router lives under the root layout, which is the thing
 * that just failed, so a client navigation would be asking the broken tree to
 * move itself. `next/link` is an error here for the same reason and the lint
 * rule against `location.assign` is written for healthy screens, so it is
 * disabled on that one line rather than obeyed.
 */

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang={defaultLocale} dir={localeDir(defaultLocale)}>
      <body>
        <div
          className="lq-shell"
          style={{ minBlockSize: "100dvh", display: "grid", alignContent: "center" }}
        >
          <div className="lq-wrap lq-pad">
            <section className="lq-sec">
              <span className="lq-mark">loqaaal</span>

              <div style={{ display: "grid", gap: "var(--space-2)" }}>
                <h1 className="lq-phead__title">الموقع وقف دلوقتي</h1>
                <p className="lq-prose">
                  مش قادرين نحمّل الصفحة أصلاً. السلة والأوردرات بتاعتك زي ما هي.
                  جرّب تحمّل تاني بعد شوية.
                </p>
                <p className="lq-prose" lang="en">
                  The site failed to load. Your bag and your orders are untouched.
                  Try loading it again in a moment.
                </p>
                {error.digest ? (
                  <p className="lq-hint">
                    رقم العطل / Fault reference{" "}
                    <span data-num data-bidi>
                      {error.digest}
                    </span>
                  </p>
                ) : null}
              </div>

              <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap" }}>
                <button type="button" className="lq-btn lq-btn--primary" onClick={() => reset()}>
                  حاول تاني
                </button>
                <button
                  type="button"
                  className="lq-btn lq-btn--secondary"
                  // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- the router is under the layout that failed
                  onClick={() => window.location.assign("/")}
                >
                  الرئيسية
                </button>
              </div>
            </section>
          </div>
        </div>
      </body>
    </html>
  );
}
