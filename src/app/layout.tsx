import type { Metadata, Viewport } from "next";
import { Readex_Pro, Source_Code_Pro } from "next/font/google";

import { QueryProvider } from "@/lib/query";
import { LocaleProvider } from "@/lib/locale-context";
import { defaultLocale, localeDir } from "@/lib/locale";

import "./globals.css";

/**
 * Readex Pro carries both scripts. One family with matched x-height means an
 * Arabic price row and an English one are the same height in the same grid, and
 * its Arabic is a first-class design rather than a fallback. At 700 with
 * −0.03em tracking it is also the wordmark.
 *
 * Self-hosted through next/font rather than the design system's
 * `@import url(fonts.googleapis.com)`: that import is render-blocking, costs a
 * DNS lookup and a connection on a mid-range Android over Egyptian mobile data,
 * and shifts the layout when it lands. This is the one place the app knowingly
 * diverges from the token files, and tokens.css says so.
 */
const readexPro = Readex_Pro({
  subsets: ["latin", "arabic"],
  variable: "--font-readex-pro",
  display: "swap",
});

/**
 * Source Code Pro is the figures face: every price, order number and phone
 * number. Tabular and lining, so a cart total lines up under a subtotal. 800 is
 * included because a price is the loudest thing on a product card and the
 * heaviest weight in the system.
 */
const sourceCodePro = Source_Code_Pro({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-source-code-pro",
  display: "swap",
});

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://shop.loqal.com";

export const metadata: Metadata = {
  /**
   * Every relative URL in any nested `metadata` resolves against this. Without
   * it Next warns and emits relative og:image URLs, which no crawler resolves.
   */
  metadataBase: new URL(SITE),
  title: {
    default: "لوكال — تسوّق من محلات مصر",
    /** Product and shop pages supply their own name; this frames it. */
    template: "%s · لوكال",
  },
  description:
    "اشتري من محلات مصرية قريبة منك. توصيل في نفس اليوم، دفع كاش أو بالكارت، وكل محل بيجهّز طلبك بنفسه.",
  applicationName: "Loqal",
  referrer: "origin-when-cross-origin",
  formatDetection: { telephone: false, address: false, email: false },
  alternates: {
    canonical: "/",
    languages: { ar: "/", en: "/?lang=en" },
  },
  openGraph: {
    type: "website",
    siteName: "Loqal",
    locale: "ar_EG",
    alternateLocale: ["en_US"],
    title: "لوكال — تسوّق من محلات مصر",
    description:
      "اشتري من محلات مصرية قريبة منك. توصيل في نفس اليوم، وكل محل بيجهّز طلبك بنفسه.",
  },
  twitter: { card: "summary_large_image" },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export const viewport: Viewport = {
  /**
   * The brand emerald behind the phone's status bar, so the top of the screen
   * is not a white seam above a coloured top bar.
   */
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  /**
   * NOT `maximum-scale: 1`. Pinch-zoom is how somebody reads a garment
   * description on a 390px screen in daylight, and disabling it is an
   * accessibility failure the design system's own contrast rules exist to
   * avoid needing.
   */
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  /**
   * Rendered in ARABIC, statically, and NOT from the cookie.
   *
   * Reading cookies() here would mark every route in the app dynamic and the
   * whole catalogue would drop off ISR — `next build` reports it as `ƒ` the
   * moment this function awaits headers. English is applied on mount by
   * LocaleProvider instead; see the long note there for the trade-off.
   */
  const locale = defaultLocale;

  return (
    <html
      lang={locale}
      dir={localeDir(locale)}
      className={`${readexPro.variable} ${sourceCodePro.variable}`}
      suppressHydrationWarning
    >
      <body>
        <LocaleProvider>
          <QueryProvider>{children}</QueryProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
