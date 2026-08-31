"use client";

import Link from "next/link";
import { useEffect } from "react";

import { useLocale } from "@/lib/locale-context";
import { EmptyState } from "@/components/state";

/**
 * The 500.
 *
 * Without this file a throw anywhere under `app/` renders Next's own built-in
 * error page: unstyled, dark, and in English on a storefront that is light and
 * Arabic. `categories/page.tsx` already says out loud that "a failure should
 * reach the error boundary" — this is the boundary it was written against.
 *
 * NO CHROME, for the same reason `not-found.tsx` carries none plus one more.
 * `Shell` is a client component that reads the bag and the locale, so it is
 * itself a thing that can throw; a rescue screen that renders the component
 * that may have failed can only fail again, and a throw inside an error
 * boundary escalates straight to `global-error`. This screen depends on
 * nothing but the CSS and `state.tsx`, which has no hooks and no context.
 *
 * It says what happened, offers the retry first, and hands over the same three
 * doors as the 404. No apology, no "Oops" — a failed render is a fact, and the
 * drawing says it the way the shop would: the hanger is hanging crooked.
 */

const WAYS_OUT = [
  { href: "/", icon: "house", ar: "الرئيسية", en: "Home" },
  { href: "/shops", icon: "store", ar: "المحلات", en: "Shops" },
  { href: "/search", icon: "search", ar: "البحث", en: "Search" },
];

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const locale = useLocale();
  const ar = locale === "ar";

  /**
   * The server strips the message out of a production build and leaves only
   * `digest`, so this is the only place the real stack is visible at all — in
   * the browser console, where a developer can reach it. Not rendered.
   */
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      className="lq-shell"
      style={{ minBlockSize: "100dvh", display: "grid", alignContent: "center" }}
    >
      <div className="lq-wrap lq-pad">
        <section className="lq-sec">
          {/* No logo file exists anywhere in the repo and none has been drawn.
              Wherever a mark would go, the word is set in Readex Pro 700. */}
          <Link href="/" className="lq-mark" aria-label="loqaaal">
            loqaaal
          </Link>

          <EmptyState
            art="crooked"
            tone="loud"
            role="alert"
            seed={error.digest ?? "error"}
            title={ar ? "مش قادرين نعرض الصفحة دي" : "This page did not load"}
            body={
              ar
                ? "الطلب وقف في نصّه. السلة والأوردرات بتاعتك زي ما هي — جرّب تاني، ولو فضلت واقفة روح لصفحة تانية."
                : "The request stopped halfway. Your bag and your orders are untouched — try again, and if it keeps stopping take one of the doors below."
            }
            /* The digest is the ONLY identifier that survives a production
               build, and it is what support would ask for. Latin figures in the
               mono face, like every other reference number in the app. */
            note={
              error.digest ? (
                <>
                  {ar ? "رقم العطل" : "Fault reference"}{" "}
                  <span data-num data-bidi>
                    {error.digest}
                  </span>
                </>
              ) : null
            }
            actions={
              <button
                type="button"
                className="lq-btn lq-btn--primary"
                /* `reset()` re-renders the failed segment in place rather than
                   reloading the document, so a transient API blip costs one
                   render and not a full boot on mobile data. */
                onClick={() => reset()}
              >
                {ar ? "حاول تاني" : "Try again"}
              </button>
            }
          />

          {/* The same hairline list the rest of the app navigates with: cells
              share their borders, so every interior edge is drawn once. */}
          <div className="lq-rows">
            {WAYS_OUT.map((way) => (
              <Link key={way.href} href={way.href} className="lq-row">
                <span className="lq-icon lq-row__lead" data-icon={way.icon} aria-hidden="true" />
                <span className="lq-row__body">
                  <span>{ar ? way.ar : way.en}</span>
                </span>
                {/* Mirrors under RTL by the one base-layer rule in globals.css. */}
                <span className="lq-icon lq-row__end" data-icon="chevron-right" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
