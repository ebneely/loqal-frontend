import Link from "next/link";

import { EmptyState } from "@/components/state";

/**
 * The 404.
 *
 * Without this file Next serves its own built-in page — unstyled, in English,
 * and dark on a storefront that is light and Arabic. That is what a dead tab
 * bar link rendered: a black screen with "This page could not be found", which
 * reads as the site being broken rather than the address being wrong.
 *
 * A SERVER COMPONENT, so it carries no locale: `useLocale` needs a client
 * boundary and `notFound()` can fire from anywhere including the static shell.
 * Arabic is the storefront's original language, so Arabic is what it says, with
 * the English underneath — the one place in the app that shows both, because
 * the one thing it knows about the reader is that they are lost.
 *
 * NO CHROME. `notFound()` can fire from inside a page that is already wrapped
 * in `Shell`, and a second top bar and tab bar nested in the first is worse
 * than none. The three rows below are the navigation for this screen.
 *
 * THE DRAWING IS THE SENTENCE. The copy has always said the piece may have come
 * off the shop's shelf; `slipped` is exactly that picture — the hanger is still
 * on the rail, swinging, and the garment is on the floor under it. It is not an
 * apology and it is not a mascot: it is the same rail, hanger and line-art
 * garment every category tile in this app is drawn from.
 */

const WAYS_OUT = [
  { href: "/", icon: "house", ar: "الرئيسية", en: "Home" },
  { href: "/shops", icon: "store", ar: "المحلات", en: "Shops" },
  { href: "/search", icon: "search", ar: "البحث", en: "Search" },
];

export default function NotFound() {
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
            art="slipped"
            seed="not-found"
            title="العنوان ده مش موجود"
            body={
              <>
                يمكن الرابط اتغيّر، أو القطعة نزلت من على الشمّاعة وخلاص. مفيش
                حاجة اتكسرت — العنوان بس مش بتاعنا.
                <br />
                <span className="lq-hint" lang="en" data-bidi>
                  This address does not exist. The link may have changed, or the
                  piece may have come off the shop&apos;s shelf.
                </span>
              </>
            }
          />

          {/* The same hairline list the rest of the app navigates with: cells
              share their borders, so every interior edge is drawn once. */}
          <div className="lq-rows">
            {WAYS_OUT.map((way) => (
              <Link key={way.href} href={way.href} className="lq-row">
                <span className="lq-icon lq-row__lead" data-icon={way.icon} aria-hidden="true" />
                <span className="lq-row__body">
                  <span>{way.ar}</span>
                  <span className="lq-hint" lang="en" data-bidi>
                    {way.en}
                  </span>
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
