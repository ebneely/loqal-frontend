"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";

import { useSession, signOut } from "@/lib/auth-client";
import { setLocaleCookie } from "@/lib/locale-context";
import { useLocale } from "@/lib/locale-context";
import { Shell } from "@/components/shell";

/**
 * Account, as five sections with a rail rather than one column of everything.
 *
 * The list it replaced put identity, language, two campaign links and four
 * help disclosures on one scroll, which was fine at four rows and stopped
 * being fine the moment addresses, saved cards and notifications were on the
 * way. A rail holds those without the page growing: one more entry, not one
 * more block on a screen that already scrolls.
 *
 * ONE SECTION OPEN AT A TIME, and the rail is a real tablist — arrow keys move
 * between the tabs, the panel is labelled by its tab, and only the open panel
 * is in the tree. On a phone the rail lies down into a scrolling row of tabs
 * with the marker under them, because a 232px column beside a 128px panel is
 * not a layout.
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
 * THE ORDERS SECTION LISTS NOTHING. There is no "my orders" endpoint — an
 * order is opened by its number and the phone that placed it, which is the
 * credential, and `/orders` is the screen that asks for both. A list of
 * invented recent orders is the one thing this section must not be.
 */

/** The five sections, in the order the rail shows them. */
const TABS = [
  { key: "me", icon: "user", ar: "إنت مين", en: "Who you are" },
  { key: "orders", icon: "package", ar: "الأوردرات", en: "Orders" },
  { key: "lang", icon: "globe", ar: "اللغة", en: "Language" },
  { key: "help", icon: "message-circle", ar: "المساعدة", en: "Help" },
  { key: "about", icon: "info", ar: "loqaaal", en: "loqaaal" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

/**
 * The row is `.lq-row`, the register's own list-row primitive: 52px, which is
 * `--tap-primary`, the floor for the primary action of a screen — and on this
 * screen every row is one.
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
        <div id={id} className="lq-drawer">
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
  const [tab, setTab] = useState<TabKey>("me");
  const [open, setOpen] = useState<string | null>(null);
  const toggle = (key: string) => setOpen((current) => (current === key ? null : key));
  const rail = useRef<HTMLDivElement>(null);

  /**
   * Deep links, and the browser's own back button. `/account#help` is what the
   * footer's four links become the day they point at a section rather than at
   * the top of a scroll, and a section you cannot link to is a section nobody
   * can send anybody to.
   */
  useEffect(() => {
    const read = () => {
      const key = window.location.hash.replace("#", "");
      if (TABS.some((t) => t.key === key)) setTab(key as TabKey);
    };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);

  const goTo = (key: TabKey) => {
    setTab(key);
    /* replaceState, not a hash assignment: a section is not a page in the
       history, and a shopper pressing back from the fifth section should leave
       Account rather than walk back through four of them. */
    window.history.replaceState(null, "", `#${key}`);
  };

  /** Arrow keys move along the rail, as a tablist owes its keyboard. */
  const onRailKey = (event: React.KeyboardEvent) => {
    const next =
      event.key === "ArrowDown" || event.key === (ar ? "ArrowLeft" : "ArrowRight")
        ? 1
        : event.key === "ArrowUp" || event.key === (ar ? "ArrowRight" : "ArrowLeft")
          ? -1
          : 0;
    if (next === 0) return;
    event.preventDefault();

    const at = TABS.findIndex((t) => t.key === tab);
    const to = TABS[(at + next + TABS.length) % TABS.length];
    goTo(to.key);
    rail.current?.querySelector<HTMLElement>(`[data-tab="${to.key}"]`)?.focus();
  };

  const t = {
    title: ar ? "حسابي" : "Account",
    lede: ar ? "خمس أقسام، واحد مفتوح في كل مرة." : "Five sections, one open at a time.",
    guest: ar ? "بتتصفح كضيف" : "Browsing as a guest",
    guestBody: ar
      ? "الأوردر بيتفتح برقمه ورقم الموبايل. الحساب بس بيجمّعهم مع بعض."
      : "An order opens with its number and phone. An account only keeps them together.",
    signedBody: ar
      ? "الأوردرات والعناوين محفوظة على الحساب ده."
      : "Orders and addresses are kept on this account.",
    signOut: ar ? "تسجيل الخروج" : "Sign out",
    signIn: ar ? "ادخل على حسابك" : "Sign in",
    /* The phone route is live now (Better Auth's phone-number plugin on the
       API), so this no longer says it is not. What the ways in actually are is
       the sign-in screen's own question — it asks /v1/auth/methods and draws
       only what this deployment has. */
    howIn: ar
      ? "برقم الموبايل وكود، أو بالإيميل."
      : "With a mobile number and a code, or with email.",
    orders: ar ? "الأوردرات" : "Orders",
    ordersBody: ar
      ? "افتح أوردرك برقمه ورقم الموبايل اللي طلبت بيه. الرقمين مع بعض هما المفتاح، فمفيش حد تاني يقدر يفتحه."
      : "Open your order with its number and the phone that placed it. The two together are the key, so nobody else can open it.",
    track: ar ? "تتبّع أوردر" : "Track an order",
    shop: ar ? "كمّل تسوّق" : "Keep shopping",
    language: ar ? "اللغة" : "Language",
    languageBody: ar
      ? "لغة واحدة للجلسة، في كل الموقع."
      : "One language per session, everywhere on the site.",
    arabic: "العربية",
    english: "English",
    loqal: "loqaaal",
    loqalBody: ar
      ? "موقع الحملة سطح منفصل، فبيفتح في تبويب جديد."
      : "The campaign site is a separate surface, so it opens in a new tab.",
    help: ar ? "المساعدة" : "Help",
    helpBody: ar ? "الأربعة اللي الفوتر بيوديهم هنا." : "The four the footer sends here.",
    about: ar ? "عن loqaaal" : "About loqaaal",
    join: ar ? "انضم كمحل" : "Join as a shop",
    shipping: ar ? "الشحن والتوصيل" : "Shipping and delivery",
    returns: ar ? "الاستبدال والاسترجاع" : "Exchanges and returns",
    faq: ar ? "الأسئلة الشائعة" : "Common questions",
    contact: ar ? "تواصل معنا" : "Contact us",
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

  const paneProps = (key: TabKey) => ({
    id: `lq-acc-${key}`,
    role: "tabpanel" as const,
    "aria-labelledby": `lq-acc-tab-${key}`,
    className: "lq-arail__pane",
    tabIndex: 0,
  });

  return (
    <Shell title={t.title}>
      <div className="lq-wrap lq-pad">
        <section className="lq-sec lq-rv">
          <div className="lq-sec__head">
            <div>
              <h1 className="lq-phead__title">{t.title}</h1>
              <p className="lq-eyebrow">{t.lede}</p>
            </div>
          </div>

          <div className="lq-arail lq-rv" style={{ "--lq-d": "70ms" } as CSSProperties}>
            <div
              className="lq-arail__rail"
              role="tablist"
              aria-orientation="vertical"
              ref={rail}
              onKeyDown={onRailKey}
            >
              {TABS.map((entry) => (
                <button
                  key={entry.key}
                  type="button"
                  id={`lq-acc-tab-${entry.key}`}
                  data-tab={entry.key}
                  role="tab"
                  aria-selected={tab === entry.key}
                  aria-controls={`lq-acc-${entry.key}`}
                  tabIndex={tab === entry.key ? 0 : -1}
                  className="lq-arail__tab"
                  onClick={() => goTo(entry.key)}
                >
                  <span className="lq-icon" data-icon={entry.icon} aria-hidden="true" />
                  <span>{ar ? entry.ar : entry.en}</span>
                </button>
              ))}
            </div>

            {/* ── Who you are ─────────────────────────────────────────────── */}
            {tab === "me" ? (
              <div {...paneProps("me")}>
                {isPending ? (
                  <div className="lq-skel" style={{ blockSize: 96 }} />
                ) : (
                  <>
                    <h2 className="lq-arail__title" data-bidi>
                      {session?.user ? session.user.email : t.guest}
                    </h2>
                    <p className="lq-arail__sub">
                      {session?.user ? t.signedBody : t.guestBody}
                    </p>

                    <div className="lq-arail__acts">
                      {session?.user ? (
                        <button
                          type="button"
                          className="lq-btn lq-btn--secondary"
                          onClick={() => {
                            /*
                              A DOCUMENT LOAD, and the lint rule that objects to
                              it is wrong for this one case. Signing out is an
                              identity change: a soft navigation keeps the React
                              tree and Better Auth's session store alive, both
                              still holding the person who just left, and the
                              next screen reads them. The dashboard hit exactly
                              this — signing out and back in appeared to do
                              nothing until the second attempt.
                            */
                            // eslint-disable-next-line @next/next/no-location-assign-relative-destination
                            void signOut().finally(() => window.location.assign("/"));
                          }}
                        >
                          {t.signOut}
                        </button>
                      ) : (
                        <Link className="lq-btn lq-btn--primary" href="/account/sign-in">
                          {t.signIn}
                        </Link>
                      )}
                      <Link className="lq-btn lq-btn--secondary" href="/orders">
                        {t.track}
                      </Link>
                    </div>

                    {session?.user ? null : <p className="lq-prose">{t.howIn}</p>}
                  </>
                )}
              </div>
            ) : null}

            {/* ── Orders ──────────────────────────────────────────────────── */}
            {tab === "orders" ? (
              <div {...paneProps("orders")}>
                <h2 className="lq-arail__title">{t.orders}</h2>
                <p className="lq-arail__sub">{t.ordersBody}</p>
                <div className="lq-rows">
                  <RowLink icon="package" label={t.track} href="/orders" />
                  <RowLink icon="store" label={t.shop} href="/shops" />
                </div>
              </div>
            ) : null}

            {/* ── Language ────────────────────────────────────────────────── */}
            {/* One language per session. Also in the desktop header — this pane
                is the PHONE's switch, where the 56px bar has no room for a
                segmented control. Both call the same `setLocaleCookie`, so they
                cannot disagree about what is selected. */}
            {tab === "lang" ? (
              <div {...paneProps("lang")}>
                <h2 className="lq-arail__title">{t.language}</h2>
                <p className="lq-arail__sub">{t.languageBody}</p>
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
                        {/* The Latin label stays Latin — no tracking, no
                            uppercase, because the sibling row is Arabic and
                            they share a rule. */}
                        <span>{code === "ar" ? t.arabic : t.english}</span>
                        {current ? (
                          <span
                            className="lq-icon lq-row__end"
                            data-icon="check"
                            /* The one thing the class cannot carry: green is
                               "checked", per the colour rule, and `.lq-row__end`
                               is the muted chevron colour. */
                            style={{ color: "var(--green)" }}
                            aria-hidden="true"
                          />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {/* ── Help ────────────────────────────────────────────────────── */}
            {tab === "help" ? (
              <div {...paneProps("help")}>
                <h2 className="lq-arail__title">{t.help}</h2>
                <p className="lq-arail__sub">{t.helpBody}</p>
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
                      <div key={item.q} className="lq-qa">
                        <span className="lq-qa__q">{item.q}</span>
                        <p className="lq-prose">{item.a}</p>
                      </div>
                    ))}
                  </RowDisclosure>

                  {/* A real destination rather than a fourth disclosure:
                      WhatsApp is the number the footer already publishes. */}
                  <RowLink
                    icon="phone"
                    label={t.contact}
                    meta="wa.me/201559959890"
                    href="https://wa.me/201559959890"
                    external
                  />
                </div>
              </div>
            ) : null}

            {/* ── loqaaal ─────────────────────────────────────────────────── */}
            {tab === "about" ? (
              <div {...paneProps("about")}>
                <h2 className="lq-arail__title">{t.loqal}</h2>
                <p className="lq-arail__sub">{t.loqalBody}</p>
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
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </Shell>
  );
}
