import type { Metadata, Viewport } from "next";
import { Noto_Kufi_Arabic } from "next/font/google";

import { QueryProvider } from "@/lib/query";
import { LocaleProvider } from "@/lib/locale-context";
import { Opening } from "@/components/opening";
import { FavouritesSync } from "@/lib/favourites";
import { localeDir } from "@/lib/locale";
import { getLocale } from "@/lib/locale-server";

import "./globals.css";

/**
 * One face for everything, in both scripts: Noto Kufi Arabic. Straight Kufi
 * lines suit the square system; titles get weight, not a second family.
 *
 * Self-hosted through next/font: a fonts.googleapis.com stylesheet is
 * render-blocking and costs a connection on Egyptian mobile data.
 */
const notoKufi = Noto_Kufi_Arabic({
  subsets: ["latin", "arabic"],
  variable: "--font-noto-kufi",
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
    default: "loqaaal — متاجر حيّك",
    /** Product and shop pages supply their own name; this frames it. */
    template: "%s · loqaaal",
  },
  description:
    "تسوّق من متاجر الملابس القريبة منك. توصيل في اليوم نفسه، والدفع نقدًا أو بالبطاقة، ويجهّز كل متجر طلبك بنفسه.",
  applicationName: "loqaaal",
  referrer: "origin-when-cross-origin",
  formatDetection: { telephone: false, address: false, email: false },
  alternates: {
    canonical: "/",
    languages: { ar: "/", en: "/?lang=en" },
  },
  openGraph: {
    type: "website",
    siteName: "loqaaal",
    locale: "ar_EG",
    alternateLocale: ["en_US"],
    title: "loqaaal — متاجر حيّك",
    description:
      "تسوّق من متاجر الملابس القريبة منك. توصيل في اليوم نفسه، ويجهّز كل متجر طلبك بنفسه.",
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

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();

  return (
    <html
      lang={locale}
      dir={localeDir(locale)}
      className={notoKufi.variable}
      suppressHydrationWarning
    >
      <head>
        {/* Blocking and inline on purpose: it must decide before the body is
            parsed, and sessionStorage cannot be read on the server. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(sessionStorage.getItem('loqal_greeted')==='1'){document.documentElement.dataset.greeted='1'}else{sessionStorage.setItem('loqal_greeted','1')}}catch(e){}`,
          }}
        />
      </head>
      <body>
        <LocaleProvider locale={locale}>
          {/* Over the page, never instead of it — see the note in opening.tsx.
              Mounted inside LocaleProvider so a future greeting can be worded,
              though today it is only the mark and needs no words. */}
          <Opening />
          <QueryProvider>
            {/* Pushes a guest's hearts to the account on sign-in. Renders nothing. */}
            <FavouritesSync />
            {children}
          </QueryProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
