import Link from "next/link";

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
 */
export default function NotFound() {
  return (
    <div
      className="lq-shell"
      style={{ minBlockSize: "100dvh", display: "grid", placeItems: "center" }}
    >
      <div
        className="lq-wrap lq-pad"
        style={{
          display: "grid",
          gap: "var(--space-4)",
          justifyItems: "center",
          textAlign: "center",
        }}
      >
        <span className="lq-topbar__mark">لوكال</span>

        <h1 style={{ fontSize: "var(--text-2xl)" }}>الصفحة مش موجودة</h1>
        <p className="lq-hint">The page you asked for does not exist.</p>

        <Link href="/" className="lq-btn lq-btn--primary lq-btn--lg">
          ارجع للمحلات
        </Link>
      </div>
    </div>
  );
}
