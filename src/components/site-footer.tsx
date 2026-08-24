"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { fetchBrands, queryKeys } from "@/lib/catalog";
import { useLocale } from "@/lib/locale-context";

/**
 * The footer. DESKTOP ONLY — the container query in components.css hides it
 * under 720px, where the tab bar is the navigation and `/account` carries these
 * same links. A dark 400px block above a fixed tab bar is a dead end on a
 * phone, and the links in it are ones a shopper reaches deliberately.
 *
 * Built once here and rendered by `Shell`, so the four pages that used to paste
 * it cannot drift into four footers.
 */

/**
 * Payment METHODS, drawn.
 *
 * NOT imitations of the Visa, Mastercard or Meeza marks. Those are trademarks,
 * and a hand-drawn near-copy is both a legal problem and a worse graphic than
 * the real asset — a real deployment drops in the official files the processor
 * supplies. One glyph per method also beats three near-identical card logos
 * sitting in a row saying the same thing.
 */
const PAYMENTS = [
  {
    ar: "بطاقات",
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
    ar: "كاش عند الاستلام",
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

const LINKS = [
  { ar: "عن لوكال", en: "About Loqal", href: "https://join-loqaaal.vercel.app/" },
  { ar: "انضم كمحل", en: "Join as a shop", href: "https://join-loqaaal.vercel.app/" },
  { ar: "الشحن والتوصيل", en: "Shipping", href: "/account" },
  { ar: "الاستبدال والاسترجاع", en: "Returns", href: "/account" },
  { ar: "الأسئلة الشائعة", en: "FAQ", href: "/account" },
  { ar: "تواصل معنا", en: "Contact", href: "/account" },
];

function Subscribe() {
  const locale = useLocale();
  const [state, setState] = useState<"idle" | "unavailable">("idle");

  return (
    <form
      className="lq-foot__sub"
      onSubmit={(event) => {
        event.preventDefault();
        /**
         * BACKEND GAP: there is no subscribe endpoint. Nothing in the contracts
         * accepts an email address for a mailing list.
         *
         * So this says so, rather than clearing the field and looking like it
         * worked. A form that swallows an address and reports success is the
         * one failure mode worth avoiding here — the shopper believes they will
         * hear from us and never does. "Say the consequence, not the caution."
         */
        setState("unavailable");
      }}
    >
      <input
        type="email"
        required
        placeholder={locale === "ar" ? "إيميلك" : "Your email"}
        aria-label={locale === "ar" ? "إيميلك" : "Your email"}
        aria-describedby={state === "unavailable" ? "lq-sub-note" : undefined}
        onChange={() => setState("idle")}
      />
      <button type="submit">{locale === "ar" ? "اشترك" : "Sign up"}</button>
      {state === "unavailable" ? (
        <span id="lq-sub-note" className="lq-foot__note" role="status">
          {locale === "ar"
            ? "التسجيل لسه مش شغال. جرّب تاني قريب."
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

  const shops = [...(data?.items ?? [])].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <footer className="lq-foot">
      <div className="lq-foot__cols">
        <div>
          <h3>{t("المحلات", "Shops")}</h3>
          <div className="lq-foot__shops">
            {shops.map((shop) => (
              <Link key={shop.id} href={`/shop/${shop.slug}`} data-bidi>
                {shop.name}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h3>{t("لوكال", "Loqal")}</h3>
          <div className="lq-foot__links">
            {LINKS.map((link) => {
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
          <h3>{t("اعرف الجديد", "Stay in touch")}</h3>
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
        <span className="lq-mark">{t("لوكال", "Loqal")}</span>
        <span>{t("تسوّق من محلات بلدك — القاهرة والجيزة", "Shop your own city — Cairo & Giza")}</span>
        <span className="lq-foot__social">
          <a href="https://wa.me/201559959890" target="_blank" rel="noopener noreferrer" aria-label={t("واتساب", "WhatsApp")}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M20 12a8 8 0 1 1-3.2-6.4" />
              <path d="M4 20l1.4-4A8 8 0 0 0 20 12" />
            </svg>
          </a>
        </span>
        <span data-num>© 2026</span>
      </div>
    </footer>
  );
}
