"use client";

import Link from "next/link";
import { useEffect } from "react";

import { useLocale } from "@/lib/locale-context";
import { EmptyState } from "@/components/state";
import { Wordmark } from "@/components/wordmark";

/**
 * The 500.
 *
 * Without this file a throw anywhere under `app/` renders Next's own built-in
 * error page: unstyled, dark, and in English on a storefront that is light and
 * Arabic.
 *
 * NO CHROME, for the same reason `not-found.tsx` carries none plus one more.
 * `Shell` is a client component that reads the bag and the locale, so it is
 * itself a thing that can throw; a rescue screen that renders the component
 * that may have failed can only fail again, and a throw inside an error
 * boundary escalates straight to `global-error`. This screen depends on
 * nothing but the CSS and `state.tsx`, which has no hooks and no context.
 *
 * It says what happened, offers the retry first, then two ways out. No
 * apology — a failed render is a fact.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const locale = useLocale();
  const t = (ar: string, en: string) => (locale === "ar" ? ar : en);

  /**
   * The server strips the message out of a production build and leaves only
   * `digest`, so this is the only place the real stack is visible at all — in
   * the browser console, where a developer can reach it. Not rendered.
   */
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="lq-shell lq-lost">
      <div className="lq-wrap lq-lost__in">
        <Link href="/" className="lq-mark">
          <Wordmark />
        </Link>

        <EmptyState
          art="crooked"
          size="page"
          tone="loud"
          role="alert"
          title={t("تعذّر عرض هذه الصفحة", "This page did not load")}
          body={t(
            "توقف الطلب في منتصفه. سلتك وطلباتك كما هي؛ حاول مرة أخرى، وإن تكرر الأمر فانتقل إلى صفحة أخرى.",
            "The request stopped halfway. Your bag and your orders are untouched. Try again, and if it keeps stopping, go to another page."
          )}
          /* The digest is the ONLY identifier that survives a production
             build, and it is what support would ask for. */
          note={
            error.digest ? (
              <>
                {t("رقم العطل", "Fault reference")}{" "}
                <span data-num dir="ltr">
                  {error.digest}
                </span>
              </>
            ) : null
          }
          actions={
            <>
              {/* `reset()` re-renders the failed segment in place rather than
                  reloading the document, so a transient API blip costs one
                  render and not a full boot on mobile data. */}
              <button type="button" className="lq-btn lq-btn--primary" onClick={() => reset()}>
                {t("أعد المحاولة", "Try again")}
              </button>
              <Link className="lq-btn lq-btn--secondary" href="/">
                {t("الرئيسية", "Home")}
              </Link>
              <Link className="lq-btn lq-btn--secondary" href="/shops">
                {t("المتاجر", "Shops")}
              </Link>
            </>
          }
        />
      </div>
    </div>
  );
}
