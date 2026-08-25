"use client";

import Link from "next/link";
import { useState } from "react";
import type { CSSProperties, ReactNode } from "react";

import { useSession, signOut } from "@/lib/auth-client";
import { setLocaleCookie } from "@/lib/locale-context";
import { useLocale } from "@/lib/locale-context";
import { Shell } from "@/components/shell";

/**
 * Account.
 *
 * A HAIRLINE LIST OF ROWS, because this screen is a set of destinations rather
 * than a page of prose. Every group is a `.lq-rows` stack, the one-column
 * hairline grid: cells share their borders — a 1px gap over a `--line`
 * background with one border around the outside — so every interior edge is
 * drawn exactly once. That is the register's structural move, and it is why
 * there is no card here.
 *
 * WHY THIS SCREEN CARRIES THE FOOTER'S LINKS. The dark footer is desktop-only —
 * a container query in components.css hides it under 720px, where a 400px dark
 * block above a fixed tab bar is a dead end. `site-footer.tsx` says so and
 * points four of its six links at `/account`. So this is where عن لوكال,
 * انضم كمحل, shipping, returns, the FAQ and contact have to be reachable on a
 * phone, and this file is the only place they are.
 *
 * SHIPPING, RETURNS AND THE FAQ ARE DISCLOSURES, NOT LINKS. There is no
 * `/shipping`, `/returns` or `/faq` route in the app and inventing three links
 * to 404s is the bug this repo already fixed once. The footer sends those four
 * links *here*, which means this screen has to answer them, not forward them.
 * The day those routes exist they become link rows like the rest.
 *
 * The language toggle lives here because the design system puts it here — the
 * storefront is Arabic with an English toggle in Account, and it never shows
 * both at once.
 *
 * THERE IS NO SIGN-IN FORM, and that is a real gap rather than an omission. The
 * design system's entry screen is "رقم الموبايل بس" — phone, then a code — and
 * the backend's Better Auth instance is configured for email and password only
 * (`emailAndPassword.enabled`, no OTP plugin). Building a phone field against
 * an endpoint that does not exist would be a form that cannot succeed, so this
 * says what is true today and offers the thing that does work: buying as a
 * guest, which is how most Loqal shoppers check out anyway.
 */

/**
 * The row is `.lq-row`, the register's own list-row primitive: 52px, which is
 * `--tap-primary`, the floor for the primary action of a screen — and on this
 * screen every row is one. `.lq-selitem` is sized for the Select popover (44px)
 * and was only ever standing in for this while it did not exist.
 */
function RowLink({
  icon,
  label,
  meta,
  href,
  external,
}: {
  icon: string;
  label: string;
  /** Where an external row actually goes. A destination stated beats a guess. */
  meta?: string;
  href: string;
  external?: boolean;
}) {
  const body = (
    <>
      <span className="lq-icon lq-row__lead" data-icon={icon} aria-hidden="true" />
      <span className="lq-row__body">
        <span>{label}</span>
        {meta ? (
          <span className="lq-hint" data-bidi>
            {meta}
          </span>
        ) : null}
      </span>
      {/* Mirrors under RTL by the one base-layer rule in globals.css. */}
      <span className="lq-icon lq-row__end" data-icon="chevron-right" aria-hidden="true" />
    </>
  );

  return external ? (
    <a className="lq-row" href={href} target="_blank" rel="noopener noreferrer">
      {body}
    </a>
  ) : (
    <Link className="lq-row" href={href}>
      {body}
    </Link>
  );
}

/**
 * A row that answers in place. `.lq-chev` is the vocabulary's rotating chevron
 * and the base layer turns it 180° on `[aria-expanded="true"]`, so the state is
 * carried by the same glyph rather than by a second one.
 */
function RowDisclosure({
  id,
  icon,
  label,
  open,
  onToggle,
  children,
}: {
  id: string;
  icon: string;
  label: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div>
      <button
        type="button"
        className="lq-row"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onClick={onToggle}
      >
        <span className="lq-icon lq-row__lead" data-icon={icon} aria-hidden="true" />
        <span>{label}</span>
        <span className="lq-icon lq-chev lq-row__end" data-icon="chevron-down" aria-hidden="true" />
      </button>
      {open ? (
        <div
          id={id}
          style={{
            display: "grid",
            gap: "var(--space-3)",
            padding: "0 var(--space-4) var(--space-4)",
          }}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

export function AccountView() {
  const locale = useLocale();
  const { data: session, isPending } = useSession();
  const ar = locale === "ar";
  const [open, setOpen] = useState<string | null>(null);
  const toggle = (key: string) => setOpen((current) => (current === key ? null : key));

  const t = {
    title: ar ? "حسابي" : "Account",
    lede: ar
      ? "اللغة، وكل حاجة تخص loqaaal والأوردرات."
      : "Language, and everything about loqaaal and your orders.",
    guest: ar ? "إنت بتتصفح كضيف" : "You are browsing as a guest",
    guestBody: ar
      ? "تقدر تشتري من غير حساب. الأوردر بيتفتح برقمه ورقم الموبايل."
      : "You can buy without an account. An order is opened by its number and phone.",
    signedIn: ar ? "داخل باسم" : "Signed in as",
    signOut: ar ? "تسجيل الخروج" : "Sign out",
    orders: ar ? "تتبّع أوردر" : "Track an order",
    language: ar ? "اللغة" : "Language",
    arabic: "العربية",
    english: "English",
    loqal: "loqaaal",
    help: ar ? "المساعدة" : "Help",
    about: ar ? "عن loqaaal" : "About loqaaal",
    join: ar ? "انضم كمحل" : "Join as a shop",
    shipping: ar ? "الشحن والتوصيل" : "Shipping and delivery",
    returns: ar ? "الاستبدال والاسترجاع" : "Exchanges and returns",
    faq: ar ? "الأسئلة الشائعة" : "Common questions",
    contact: ar ? "تواصل معنا" : "Contact us",
    signIn: ar ? "ادخل على حسابك" : "Sign in",
    /* Named as what is missing, not as "coming soon". Email sign-in works now;
       it is the PHONE route that does not, so the sentence says which. */
    noSignIn: ar
      ? "الدخول برقم الموبايل وكود لسه مش شغّال. دلوقتي الدخول بالإيميل."
      : "Signing in with a phone and a code is not live yet. For now it is email.",
  };

  /** Q and A, kept in one shape so the FAQ body is a list rather than prose. */
  const questions = ar
    ? [
        {
          q: "أقدر أشتري من غير حساب؟",
          a: "آه. الأوردر بيتفتح برقمه ورقم الموبايل، من صفحة أوردراتي.",
        },
        {
          q: "الرقم اللي مكتوب على القطعة مضمون؟",
          a: "ده آخر رقم قاله المحل. المحل بيراجع الرف قبل ما يأكد الأوردر، وساعتها بس القطعة تبقى محجوزة ليك.",
        },
        {
          q: "بدفع إزاي؟",
          a: "كاش عند الاستلام، أو بطاقة، أو فاليو، أو إنستاباي.",
        },
      ]
    : [
        {
          q: "Can I buy without an account?",
          a: "Yes. An order is opened by its number and phone, from the orders page.",
        },
        {
          q: "Is the figure on a piece guaranteed?",
          a: "It is the last figure the shop gave us. The shop checks the shelf before it confirms the order, and only then is the piece held for you.",
        },
        {
          q: "How do I pay?",
          a: "Cash on delivery, card, Valu or InstaPay.",
        },
      ];

  return (
    <Shell title={t.title}>
      <div className="lq-wrap lq-pad">
        {/* ── Who you are ───────────────────────────────────────────────── */}
        <section className="lq-sec lq-rv">
          <div className="lq-sec__head">
            <div>
              <h1 className="lq-phead__title">{t.title}</h1>
              <p className="lq-eyebrow">{t.lede}</p>
            </div>
          </div>

          {isPending ? (
            <div className="lq-skel" style={{ blockSize: 88 }} />
          ) : session?.user ? (
            <div className="lq-card lq-card--pad" style={{ display: "grid", gap: "var(--space-1)" }}>
              <span className="lq-eyebrow">{t.signedIn}</span>
              <span className="lq-pcard__name" data-bidi style={{ fontSize: "var(--text-base)" }}>
                {session.user.email}
              </span>
            </div>
          ) : (
            <div className="lq-card lq-card--pad" style={{ display: "grid", gap: "var(--space-2)" }}>
              <span className="lq-pcard__name" style={{ fontSize: "var(--text-base)" }}>
                {t.guest}
              </span>
              <p className="lq-prose">{t.guestBody}</p>
              <p className="lq-prose">{t.noSignIn}</p>
              {/* The way out of the guest state. It existed nowhere before:
                  auth-client exported `signIn`, nothing called it, and a
                  shopper who signed out could not sign back in. */}
              <Link className="lq-btn lq-btn--secondary" href="/account/sign-in">
                {t.signIn}
              </Link>
            </div>
          )}

          <div className="lq-rows">
            <RowLink icon="package" label={t.orders} href="/orders" />
            {session?.user ? (
              <button
                type="button"
                className="lq-row"
                onClick={() => {
                  /*
                    A DOCUMENT LOAD, and the lint rule that objects to it is
                    wrong for this one case. Signing out is an identity change:
                    a soft navigation keeps the React tree and Better Auth's
                    session store alive, both still holding the person who just
                    left, and the next screen reads them. The dashboard hit
                    exactly this — signing out and back in appeared to do
                    nothing until the second attempt.
                  */
                  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
                  void signOut().finally(() => window.location.assign("/"));
                }}
              >
                <span className="lq-icon lq-row__lead" data-icon="arrow-right" aria-hidden="true" />
                <span>{t.signOut}</span>
              </button>
            ) : null}
          </div>
        </section>

        {/* ── Language ──────────────────────────────────────────────────── */}
        {/* One language per session. Also in the desktop header — this row is
            the PHONE's switch, where the 56px bar has no room for a segmented
            control. Both call the same `setLocaleCookie`, so they cannot
            disagree about what is selected. */}
        <section className="lq-sec lq-rv" style={{ "--lq-d": "70ms" } as CSSProperties}>
          <span className="lq-eyebrow">{t.language}</span>
          <div className="lq-rows">
            {(["ar", "en"] as const).map((code) => {
              const current = locale === code;
              return (
                <button
                  key={code}
                  type="button"
                  className="lq-row"
                  aria-pressed={current}
                  data-active={current ? "true" : undefined}
                  onClick={() => setLocaleCookie(code)}
                >
                  {/* The Latin label stays Latin — no tracking, no uppercase,
                      because the sibling row is Arabic and they share a rule. */}
                  <span>{code === "ar" ? t.arabic : t.english}</span>
                  {/* Green is "checked", per the colour rule. The check glyph
                      carries the state as well as the colour does. */}
                  {current ? (
                    <span
                      className="lq-icon lq-row__end"
                      data-icon="check"
                      /* The one thing the class cannot carry: green is
                         "checked", per the colour rule, and `.lq-row__end` is
                         the muted chevron colour. */
                      style={{ color: "var(--green)" }}
                      aria-hidden="true"
                    />
                  ) : null}
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Loqal ─────────────────────────────────────────────────────── */}
        {/* Both go to the campaign site, which is a separate surface — hence
            the domain under each label and a new tab. */}
        <section className="lq-sec lq-rv" style={{ "--lq-d": "140ms" } as CSSProperties}>
          <span className="lq-eyebrow">{t.loqal}</span>
          <div className="lq-rows">
            <RowLink
              icon="info"
              label={t.about}
              meta="join-loqaaal.vercel.app"
              href="https://join-loqaaal.vercel.app/"
              external
            />
            <RowLink
              icon="store"
              label={t.join}
              meta="join-loqaaal.vercel.app"
              href="https://join-loqaaal.vercel.app/"
              external
            />
          </div>
        </section>

        {/* ── Help ──────────────────────────────────────────────────────── */}
        <section className="lq-sec lq-rv" style={{ "--lq-d": "210ms" } as CSSProperties}>
          <span className="lq-eyebrow">{t.help}</span>
          <div className="lq-rows">
            <RowDisclosure
              id="lq-acc-shipping"
              icon="truck"
              label={t.shipping}
              open={open === "shipping"}
              onToggle={() => toggle("shipping")}
            >
              <p className="lq-prose">
                {ar
                  ? "المحل بيجهّز الأوردر من رفّه ويحجز المندوب بنفسه. القاهرة والجيزة في نفس اليوم."
                  : "The shop packs the order off its own shelf and books the courier itself. Cairo and Giza, same day."}
              </p>
              <p className="lq-prose">
                {ar
                  ? "لو اشتريت من أكتر من محل، كل محل بيبعت نصّه لوحده وبرسوم توصيل خاصة بيه، وليه حالة منفصلة في أوردراتي. مفيش وقت وصول واحد للأوردر كله."
                  : "If you bought from more than one shop, each shop sends its own half with its own delivery fee and its own status in your orders. There is no single arrival time for the whole order."}
              </p>
            </RowDisclosure>

            <RowDisclosure
              id="lq-acc-returns"
              icon="refresh-cw"
              label={t.returns}
              open={open === "returns"}
              onToggle={() => toggle("returns")}
            >
              <p className="lq-prose">
                {ar
                  ? "استبدال خلال 14 يوم من الاستلام، والقطعة بحالتها زي ما وصلتك."
                  : "Exchange within 14 days of delivery, with the piece in the state it arrived in."}
              </p>
              <p className="lq-prose">
                {ar
                  ? "الاستبدال بيمشي مع المحل اللي باعلك، لأن القطعة رجعت لرفّه هو. كلّم المحل من صفحة الأوردر."
                  : "The exchange goes through the shop that sold you the piece, because it goes back onto that shop's shelf. Contact the shop from the order page."}
              </p>
            </RowDisclosure>

            <RowDisclosure
              id="lq-acc-faq"
              icon="message-circle"
              label={t.faq}
              open={open === "faq"}
              onToggle={() => toggle("faq")}
            >
              {questions.map((item) => (
                <div key={item.q} style={{ display: "grid", gap: 2 }}>
                  <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--weight-medium)" }}>
                    {item.q}
                  </span>
                  <p className="lq-prose">
                    {item.a}
                  </p>
                </div>
              ))}
            </RowDisclosure>

            {/* A real destination rather than a fourth disclosure: WhatsApp is
                the number the footer already publishes. */}
            <RowLink
              icon="phone"
              label={t.contact}
              meta="wa.me/201559959890"
              href="https://wa.me/201559959890"
              external
            />
          </div>
        </section>
      </div>
    </Shell>
  );
}
