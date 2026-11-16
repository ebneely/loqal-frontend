"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { fetchBrands, queryKeys } from "@/lib/catalog";
import { useLocale } from "@/lib/locale-context";
import { CLAIMS } from "@/components/shell";

/**
 * The footer: a green band at every width, closed by the wordmark set huge.
 *
 * Built once here and rendered by `Shell`, so no page can grow a footer of its
 * own and drift.
 */

/**
 * Payment METHODS, drawn.
 *
 * NOT imitations of the Visa, Mastercard or Meeza marks. Those are trademarks,
 * and a real deployment drops in the official files the processor supplies.
 */
const PAYMENTS = [
  {
    ar: "البطاقات",
    en: "Cards",
    path: (
      <>
        <rect x="2.5" y="5.5" width="19" height="13" />
        <path d="M2.5 9.5h19" />
        <path d="M6 14.5h4" />
      </>
    ),
  },
  {
    ar: "فاليو",
    en: "Valu",
    path: (
      <>
        <path d="M3 7.5A2 2 0 0 1 5 5.5h11a2 2 0 0 1 2 2v1" />
        <rect x="3" y="7.5" width="18" height="11" />
        <path d="M21 11.5h-4a1.5 1.5 0 0 0 0 3h4" />
      </>
    ),
  },
  {
    ar: "إنستاباي",
    en: "InstaPay",
    path: (
      <>
        <rect x="6.5" y="2.5" width="11" height="19" />
        <path d="M10 7.5h4.5L13 6" />
        <path d="M14 12.5H9.5L11 14" />
      </>
    ),
  },
  {
    ar: "الدفع عند الاستلام",
    en: "Cash on delivery",
    path: (
      <>
        <rect x="2.5" y="6.5" width="19" height="11" />
        <circle cx="12" cy="12" r="2.6" />
        <path d="M5.5 12h.5" />
        <path d="M18 12h.5" />
      </>
    ),
  },
];

const HELP = [
  /* Into Account's Help section, each with its own answer already open — see
     the hash reader in account-view.tsx. */
  { ar: "الشحن والتوصيل", en: "Shipping", href: "/account#help-shipping" },
  { ar: "الاستبدال والاسترجاع", en: "Returns", href: "/account#help-returns" },
  { ar: "الأسئلة الشائعة", en: "FAQ", href: "/account#help-faq" },
  { ar: "تتبّع طلبك", en: "Track an order", href: "/orders" },
  { ar: "عن loqaaal", en: "About loqaaal", href: "https://join-loqaaal.vercel.app/" },
  { ar: "انضم كمتجر", en: "Join as a shop", href: "https://join-loqaaal.vercel.app/" },
];

/** Enough to be a directory, few enough to stay a column. */
const SHOPS_SHOWN = 7;

function Subscribe() {
  const locale = useLocale();
  const [state, setState] = useState<"idle" | "unavailable">("idle");

  return (
    <form
      className="lq-foot__sub"
      onSubmit={(event) => {
        event.preventDefault();
        /**
         * BACKEND GAP: there is no subscribe endpoint. So this says so, rather
         * than clearing the field and looking like it worked — a shopper who
         * believes they will hear from us and never does is the failure.
         */
        setState("unavailable");
      }}
    >
      <input
        type="email"
        required
        placeholder={locale === "ar" ? "بريدك الإلكتروني" : "Your email"}
        aria-label={locale === "ar" ? "بريدك الإلكتروني" : "Your email"}
        aria-describedby={state === "unavailable" ? "lq-sub-note" : undefined}
        onChange={() => setState("idle")}
      />
      <button type="submit">{locale === "ar" ? "اشترك" : "Sign up"}</button>
      {state === "unavailable" ? (
        <span id="lq-sub-note" className="lq-foot__note" role="status">
          {locale === "ar"
            ? "الاشتراك غير متاح بعد. حاول مجددًا قريبًا."
            : "Sign-up is not live yet. Try again soon."}
        </span>
      ) : null}
    </form>
  );
}

export function SiteFooter() {
  const locale = useLocale();
  const t = (ar: string, en: string) => (locale === "ar" ? ar : en);

  /** Same key as the home page and the mega menu: fetched once, read here. */
  const { data } = useQuery({
    queryKey: queryKeys.brands(1),
    queryFn: () => fetchBrands(1, 24),
    staleTime: 5 * 60 * 1000,
  });

  const shops = [...(data?.items ?? [])]
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, SHOPS_SHOWN);

  return (
    <footer className="lq-foot">
      <div className="lq-foot__cols">
        <div className="lq-foot__about">
          <strong>{t("متاجر حيّك، على الإنترنت", "Your neighbourhood's shops, online")}</strong>
          <ul className="lq-foot__list" style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {CLAIMS.map((claim) => (
              <li key={claim.en}>{t(claim.ar, claim.en)}</li>
            ))}
          </ul>
          <a
            className="lq-foot__wa"
            href="https://wa.me/201559959890"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("واتساب", "WhatsApp")}{" "}
            <span data-num dir="ltr">
              +20 155 995 9890
            </span>
          </a>
        </div>

        <div>
          <h3>{t("المتاجر", "Shops")}</h3>
          <div className="lq-foot__list">
            {shops.map((shop) => (
              <Link key={shop.id} href={`/shop/${shop.slug}`} data-bidi>
                {shop.name}
              </Link>
            ))}
            <Link href="/shops">{t("كل المتاجر", "All shops")}</Link>
          </div>
        </div>

        <div>
          <h3>{t("المساعدة", "Help")}</h3>
          <div className="lq-foot__list">
            {HELP.map((link) => {
              const external = link.href.startsWith("http");
              return external ? (
                <a
                  key={link.en}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t(link.ar, link.en)}
                </a>
              ) : (
                <Link key={link.en} href={link.href}>
                  {t(link.ar, link.en)}
                </Link>
              );
            })}
          </div>
        </div>

        <div>
          <h3>{t("ابقَ على اطلاع", "Stay in touch")}</h3>
          <Subscribe />
          <div className="lq-foot__pays">
            {PAYMENTS.map((pay) => (
              <span key={pay.en}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  {pay.path}
                </svg>
                {t(pay.ar, pay.en)}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="lq-foot__bot">
        <span>{t("متاجر القاهرة والجيزة", "Shops of Cairo & Giza")}</span>
        <span data-num>© 2026 loqaaal</span>
      </div>
      <p className="lq-foot__huge" aria-hidden="true">
        loqaaal
      </p>
    </footer>
  );
}
