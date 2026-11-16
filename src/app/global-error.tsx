"use client";

import { localeDir, defaultLocale } from "@/lib/locale";
import { EmptyState } from "@/components/state";

import "./globals.css";

/**
 * The last resort: a throw in the ROOT LAYOUT itself.
 *
 * This file REPLACES `layout.tsx`, so it owns `<html>` and `<body>` — nothing
 * above it renders, which is also why it imports `globals.css` itself.
 *
 * NO HOOKS AND NO CONTEXT. `LocaleProvider` and `QueryProvider` live in the
 * root layout, which is the thing that just failed, so it says both languages
 * instead, the way `not-found.tsx` does.
 *
 * NO next/font EITHER. Loading a font loader in a file that only renders when
 * the app is already broken buys a second webfont on the worst render of the
 * session; the font tokens fall through to the system stack, which carries
 * Arabic on every device this storefront targets.
 *
 * A FULL DOCUMENT LOAD out to the home page, not a `<Link>`: the router lives
 * under the root layout, which is the thing that just failed. The lint rule
 * against `location.assign` is written for healthy screens, so it is disabled
 * on that one line rather than obeyed.
 *
 * `EmptyState` IS SAFE HERE and it is the only import that is: `state.tsx` has
 * no hooks, no context and no client-only API.
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
        <div className="lq-shell lq-lost">
          <div className="lq-wrap lq-lost__in">
            <span className="lq-mark">loqaaal</span>

            <EmptyState
              art="crooked"
              size="page"
              tone="loud"
              role="alert"
              title="تعذّر تحميل الموقع الآن"
              body={
                <>
                  لم نتمكن من تحميل الصفحة. سلتك وطلباتك كما هي؛ أعد المحاولة
                  بعد قليل.
                  <br />
                  <span className="lq-hint" lang="en" dir="ltr">
                    The site failed to load. Your bag and your orders are
                    untouched. Try again in a moment.
                  </span>
                </>
              }
              note={
                error.digest ? (
                  <>
                    رقم العطل / Fault reference{" "}
                    <span data-num dir="ltr">
                      {error.digest}
                    </span>
                  </>
                ) : null
              }
              actions={
                <>
                  <button type="button" className="lq-btn lq-btn--primary" onClick={() => reset()}>
                    أعد المحاولة <span className="lq-lost__en" lang="en" dir="ltr">Try again</span>
                  </button>
                  <button
                    type="button"
                    className="lq-btn lq-btn--secondary"
                    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- the router is under the layout that failed
                    onClick={() => window.location.assign("/")}
                  >
                    الرئيسية <span className="lq-lost__en" lang="en" dir="ltr">Home</span>
                  </button>
                </>
              }
            />
          </div>
        </div>
      </body>
    </html>
  );
}
