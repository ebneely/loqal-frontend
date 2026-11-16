import Link from "next/link";

import { EmptyState } from "@/components/state";
import { Wordmark } from "@/components/wordmark";

/**
 * The 404.
 *
 * Without this file Next serves its own built-in page — unstyled, in English,
 * and dark on a storefront that is light and Arabic, which reads as the site
 * being broken rather than the address being wrong.
 *
 * A SERVER COMPONENT, so it carries no locale: `useLocale` needs a client
 * boundary and `notFound()` can fire from anywhere including the static shell.
 * Arabic is the storefront's original language, so Arabic is what it says, with
 * the English underneath — the one thing it knows about the reader is that
 * they are lost.
 *
 * NO CHROME. `notFound()` can fire from inside a page that is already wrapped
 * in `Shell`, and a second header nested in the first is worse than none. The
 * three buttons are the navigation for this screen.
 */
export default function NotFound() {
  return (
    <div className="lq-shell lq-lost">
      <div className="lq-wrap lq-lost__in">
        <Link href="/" className="lq-mark">
          <Wordmark />
        </Link>

        <EmptyState
          art="slipped"
          size="page"
          title="هذه الصفحة غير موجودة"
          body={
            <>
              ربما تغيّر الرابط، أو نزلت القطعة من الرف.
              <br />
              <span className="lq-hint" lang="en" dir="ltr">
                This page does not exist. The link may have changed, or the
                piece may have come off the shop&apos;s shelf.
              </span>
            </>
          }
          actions={
            <>
              <Link className="lq-btn lq-btn--primary" href="/">
                الرئيسية <span className="lq-lost__en" lang="en" dir="ltr">Home</span>
              </Link>
              <Link className="lq-btn lq-btn--secondary" href="/shops">
                المتاجر <span className="lq-lost__en" lang="en" dir="ltr">Shops</span>
              </Link>
              <Link className="lq-btn lq-btn--secondary" href="/search">
                البحث <span className="lq-lost__en" lang="en" dir="ltr">Search</span>
              </Link>
            </>
          }
        />
      </div>
    </div>
  );
}
