"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

import { useSession, signOut } from "@/lib/auth-client";
import { setLocaleCookie } from "@/lib/locale-context";
import { useLocale } from "@/lib/locale-context";
import { Shell } from "@/components/shell";
import { EmptyState } from "@/components/state";
import { AddressBook } from "./address-book";
import { MyOrders } from "./my-orders";
import { FavouritesPane } from "./favourites";

/**
 * Account: a rail of sections at the inline start and one panel beside it.
 *
 * ONE SECTION OPEN AT A TIME, and the rail is a real tablist — arrow keys move
 * between the tabs, the panel is labelled by its tab, and only the open panel
 * is in the tree. On a phone the rail lies down into a scrolling row above the
 * panel, because a 240px column beside what is left of a phone is not a layout.
 *
 * WHY THIS SCREEN CARRIES THE FOOTER'S LINKS. The footer is desktop-only, and
 * `site-footer.tsx` points its shipping, returns and FAQ links into this
 * screen's Help section. So this is where those, the campaign site and contact
 * have to be reachable on a phone, and this file is the only place they are.
 *
 * SHIPPING, RETURNS AND THE FAQ ARE DISCLOSURES, NOT LINKS. There is no
 * `/shipping`, `/returns` or `/faq` route in the app and inventing three links
 * to 404s is the bug this repo already fixed once.
 *
 * THE ORDERS SECTION IS REAL FOR AN ACCOUNT AND A LOOKUP FOR A GUEST. Signed
 * in, it lists `/v1/orders/mine` — including guest orders placed before the
 * account existed, matched by the API on a verified phone or email. A guest
 * still opens an order by its number and phone, which is their credential.
 *
 * THE ADDRESSES SECTION exists only for an account. A guest has no address
 * book, only the address frozen onto each order.
 */

/** The sections, in the order the rail shows them. */
const TABS = [
  { key: "me", ar: "بياناتي", en: "Your details" },
  { key: "orders", ar: "الطلبات", en: "Orders" },
  { key: "favourites", ar: "المفضلة", en: "Saved" },
  { key: "addresses", ar: "العناوين", en: "Addresses" },
  { key: "help", ar: "المساعدة", en: "Help" },
  { key: "lang", ar: "اللغة", en: "Language" },
  { key: "about", ar: "عن loqaaal", en: "About loqaaal" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

/**
 * The Help answers a link can open directly: `#help-returns` is the Help
 * section with the returns answer already unfolded. These are the keys of the
 * disclosures below, and the footer and the drawer send one each.
 */
const HELP_ANSWERS: readonly string[] = ["shipping", "returns", "faq"];

/** A destination in the panel: label, an optional stated address, and a go. */
function RowLink({
  label,
  meta,
  href,
  external,
}: {
  label: string;
  /** Where an external row actually goes. A destination stated beats a guess. */
  meta?: string;
  href: string;
  external?: boolean;
}) {
  const body = (
    <>
      <span className="lq-arow__body">
        <span>{label}</span>
        {meta ? (
          <small dir="ltr" data-bidi>
            {meta}
          </small>
        ) : null}
      </span>
      {/* Mirrors under RTL by the one base-layer rule in globals.css. */}
      <span className="lq-icon lq-arow__end" data-icon="chevron-right" aria-hidden="true" />
    </>
  );

  return external ? (
    <a className="lq-arow" href={href} target="_blank" rel="noopener noreferrer">
      {body}
    </a>
  ) : (
    <Link className="lq-arow" href={href}>
      {body}
    </Link>
  );
}

/**
 * A row that answers in place. The plus is drawn by CSS and turns into a cross
 * on `[aria-expanded="true"]`, so the state is carried by one glyph.
 */
function Accordion({
  id,
  label,
  open,
  onToggle,
  children,
}: {
  id: string;
  label: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div className="lq-acc">
      <button
        type="button"
        className="lq-acc__q"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onClick={onToggle}
      >
        {label}
      </button>
      {open ? (
        <div id={id} className="lq-acc__a">
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
  const user = session?.user ?? null;

  /**
   * Deep links, and the browser's own back button. A section you cannot link
   * to is a section nobody can send anybody to.
   *
   * `#help` opens Help, and `#help-<answer>` opens Help with that answer
   * unfolded, which is what the footer's and the drawer's Shipping, Returns
   * and FAQ links send.
   *
   * Read on mount and on `hashchange`. A Next `<Link>` to a different hash on
   * THIS page changes the address without firing `hashchange`, so from
   * Account itself those links move the address but not the section; the rail
   * is right there for that case.
   */
  useEffect(() => {
    const read = () => {
      const hash = window.location.hash.replace("#", "");
      const answer = hash.startsWith("help-") ? hash.slice("help-".length) : null;
      const key = answer ? "help" : hash;
      if (TABS.some((t) => t.key === key)) setTab(key as TabKey);
      if (answer && HELP_ANSWERS.includes(answer)) setOpen(answer);
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

  /*
    A DOCUMENT LOAD, and the lint rule that objects to it is wrong for this one
    case. Signing out is an identity change: a soft navigation keeps the React
    tree and Better Auth's session store alive, both still holding the person
    who just left, and the next screen reads them.
  */
  const leave = () =>
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    void signOut().finally(() => window.location.assign("/"));

  const t = (a: string, e: string) => (ar ? a : e);
  const title = t("حسابي", "Account");
  const signIn = t("تسجيل الدخول", "Sign in");
  const signOutLabel = t("تسجيل الخروج", "Sign out");
  const track = t("تتبّع طلبًا", "Track an order");

  /** Q and A, kept in one shape so the FAQ body is a list rather than prose. */
  const questions = ar
    ? [
        {
          q: "هل يمكنني الشراء دون حساب؟",
          a: "نعم. يُفتح الطلب برقمه ورقم الهاتف من صفحة طلباتي.",
        },
        {
          q: "هل الكمية المعروضة مضمونة؟",
          a: "هي آخر رقم أبلغنا به المتجر. يراجع المتجر الرف قبل التأكيد، وعندها فقط تُحجز القطعة لك.",
        },
        {
          q: "كيف أدفع؟",
          a: "نقدًا عند الاستلام، أو ببطاقة بنكية، أو عبر فاليو، أو إنستاباي.",
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
    className: "lq-acct__pane",
    tabIndex: 0,
  });

  return (
    <Shell title={title}>
      <div className="lq-wrap lq-acct-page">
        <header className="lq-acct-page__head">
          <h1 className="lq-pagetitle">{title}</h1>
          {/* Held at one line's height while the session loads, so the page
              does not jump when it answers. */}
          <p className="lq-lede" data-bidi>
            {isPending
              ? " "
              : user
                ? t(`مرحبًا ${user.name?.trim() || user.email}.`, `Hello, ${user.name?.trim() || user.email}.`)
                : t("تتصفح الآن كضيف.", "You are browsing as a guest.")}
          </p>
        </header>

        <div className="lq-acct">
          <div className="lq-acct__rail">
            <div
              className="lq-acct__tabs"
              role="tablist"
              aria-orientation="vertical"
              aria-label={t("أقسام الحساب", "Account sections")}
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
                  className="lq-acct__tab"
                  onClick={() => goTo(entry.key)}
                >
                  {ar ? entry.ar : entry.en}
                </button>
              ))}
            </div>
            {isPending ? null : user ? (
              <button type="button" className="lq-acct__tab lq-acct__out" onClick={leave}>
                {signOutLabel}
              </button>
            ) : (
              /* `next` so signing in returns here rather than to wherever the
                 sign-in screen would otherwise guess. */
              <Link className="lq-acct__tab lq-acct__out" href="/account/sign-in?next=%2Faccount">
                {signIn}
              </Link>
            )}
          </div>

          {/* ── Your details ───────────────────────────────────────────── */}
          {tab === "me" ? (
            <div {...paneProps("me")}>
              {isPending ? (
                <div className="lq-skel" style={{ blockSize: 96 }} />
              ) : user ? (
                <>
                  <h2 className="lq-acct__title" data-bidi>
                    {user.name?.trim() || user.email}
                  </h2>
                  <p className="lq-acct__sub">
                    {t(
                      "طلباتك وعناوينك محفوظة في هذا الحساب.",
                      "Orders and addresses are kept on this account."
                    )}
                  </p>
                  <div className="lq-acct__list">
                    {user.name?.trim() ? (
                      <div className="lq-arow" data-static>
                        <span className="lq-arow__body">
                          <small>{t("البريد الإلكتروني", "Email")}</small>
                          <span dir="ltr" data-bidi>
                            {user.email}
                          </span>
                        </span>
                      </div>
                    ) : null}
                    <RowLink label={track} href="/orders" />
                  </div>
                  <div className="lq-acct__acts">
                    <button type="button" className="lq-btn lq-btn--secondary" onClick={leave}>
                      {signOutLabel}
                    </button>
                  </div>
                </>
              ) : (
                <EmptyState
                  art="shelf"
                  title={t("الحساب اختياري", "An account is optional")}
                  body={t(
                    "يُفتح الطلب برقمه ورقم الهاتف دون حساب. أما الحساب فيجمع طلباتك وعناوينك في مكان واحد، وتدخل إليه برقم هاتفك ورمز، أو ببريدك الإلكتروني.",
                    "An order opens with its number and phone, no account needed. An account keeps your orders and addresses together; you sign in with your number and a code, or with email."
                  )}
                  actions={
                    <>
                      <Link className="lq-btn lq-btn--primary" href="/account/sign-in?next=%2Faccount">
                        {signIn}
                      </Link>
                      <Link className="lq-btn lq-btn--secondary" href="/orders">
                        {track}
                      </Link>
                    </>
                  }
                />
              )}
            </div>
          ) : null}

          {/* ── Orders ─────────────────────────────────────────────────── */}
          {tab === "orders" ? (
            <div {...paneProps("orders")}>
              {isPending ? (
                <div className="lq-skel" style={{ blockSize: 96 }} />
              ) : user ? (
                <MyOrders />
              ) : (
                <EmptyState
                  art="shelf"
                  title={t("سجّل دخولك لعرض طلباتك", "Sign in to see your orders")}
                  body={t(
                    "يُفتح الطلب برقمه ورقم الهاتف دون حساب، أما الحساب فيجمع طلباتك في مكان واحد.",
                    "An order opens with its number and phone, no account needed. An account keeps them all in one place."
                  )}
                  actions={
                    <>
                      <Link className="lq-btn lq-btn--primary" href="/account/sign-in?next=%2Faccount%23orders">
                        {signIn}
                      </Link>
                      <Link className="lq-btn lq-btn--secondary" href="/orders">
                        {track}
                      </Link>
                    </>
                  }
                />
              )}
            </div>
          ) : null}

          {/* ── Saved ─────────────────────────────────────────────────────
              Open to guests too: their hearts live in this browser. */}
          {tab === "favourites" ? (
            <div {...paneProps("favourites")}>
              {isPending ? <div className="lq-skel" style={{ blockSize: 96 }} /> : <FavouritesPane />}
            </div>
          ) : null}

          {/* ── Addresses ──────────────────────────────────────────────── */}
          {tab === "addresses" ? (
            <div {...paneProps("addresses")}>
              {isPending ? (
                <div className="lq-skel" style={{ blockSize: 96 }} />
              ) : user ? (
                <AddressBook />
              ) : (
                <EmptyState
                  art="shelf"
                  title={t("العناوين تُحفظ في الحساب", "Addresses live on an account")}
                  body={t(
                    "سجّل دخولك، وسيُحفظ عنوان أول طلب تلقائيًا.",
                    "Sign in, and your next order saves its address by itself."
                  )}
                  actions={
                    <Link className="lq-btn lq-btn--primary" href="/account/sign-in?next=%2Faccount%23addresses">
                      {signIn}
                    </Link>
                  }
                />
              )}
            </div>
          ) : null}

          {/* ── Help ───────────────────────────────────────────────────── */}
          {tab === "help" ? (
            <div {...paneProps("help")}>
              <div className="lq-accs">
                <Accordion
                  id="lq-acc-shipping"
                  label={t("الشحن والتوصيل", "Shipping and delivery")}
                  open={open === "shipping"}
                  onToggle={() => toggle("shipping")}
                >
                  <p>
                    {t(
                      "يجهّز المتجر الطلب من رفوفه ويحجز المندوب بنفسه. يصل الطلب في اليوم نفسه داخل القاهرة والجيزة.",
                      "The shop packs the order off its own shelf and books the courier itself. Cairo and Giza, same day."
                    )}
                  </p>
                  <p>
                    {t(
                      "إن اشتريت من أكثر من متجر، يرسل كل متجر جزءه وحده برسوم توصيل خاصة به، ولكل جزء حالته في طلباتك. لا يوجد موعد وصول واحد للطلب كله.",
                      "If you bought from more than one shop, each shop sends its own part with its own delivery fee and its own status in your orders. There is no single arrival time for the whole order."
                    )}
                  </p>
                </Accordion>

                <Accordion
                  id="lq-acc-returns"
                  label={t("الاستبدال والاسترجاع", "Exchanges and returns")}
                  open={open === "returns"}
                  onToggle={() => toggle("returns")}
                >
                  <p>
                    {t(
                      "الاستبدال خلال 14 يومًا من الاستلام، على أن تكون القطعة بحالتها.",
                      "Exchange within 14 days of delivery, with the piece in the state it arrived in."
                    )}
                  </p>
                  <p>
                    {t(
                      "يتم الاستبدال مع المتجر الذي باعك القطعة، لأنها تعود إلى رفّه. تواصل مع المتجر من صفحة الطلب.",
                      "The exchange goes through the shop that sold you the piece, because it goes back onto that shop's shelf. Contact the shop from the order page."
                    )}
                  </p>
                </Accordion>

                <Accordion
                  id="lq-acc-faq"
                  label={t("الأسئلة الشائعة", "Common questions")}
                  open={open === "faq"}
                  onToggle={() => toggle("faq")}
                >
                  {questions.map((item) => (
                    <div key={item.q} className="lq-acc__qa">
                      <b>{item.q}</b>
                      <p>{item.a}</p>
                    </div>
                  ))}
                </Accordion>

                {/* A real destination rather than a fourth disclosure:
                    WhatsApp is the number the footer already publishes. */}
                <RowLink
                  label={t("تواصل معنا عبر واتساب", "Contact us on WhatsApp")}
                  meta="wa.me/201559959890"
                  href="https://wa.me/201559959890"
                  external
                />
              </div>
            </div>
          ) : null}

          {/* ── Language ───────────────────────────────────────────────── */}
          {/* One language per session. Also in the desktop header — this pane
              is the PHONE's switch. Both call the same `setLocaleCookie`, so
              they cannot disagree about what is selected. */}
          {tab === "lang" ? (
            <div {...paneProps("lang")}>
              <p className="lq-acct__sub">
                {t("لغة واحدة للموقع كله.", "One language, everywhere on the site.")}
              </p>
              <div className="lq-acct__list">
                {(["ar", "en"] as const).map((code) => {
                  const current = locale === code;
                  return (
                    <button
                      key={code}
                      type="button"
                      className="lq-arow"
                      lang={code}
                      aria-pressed={current}
                      onClick={() => {
                        if (!current) setLocaleCookie(code);
                      }}
                    >
                      <span className="lq-arow__body">
                        <span>{code === "ar" ? "العربية" : "English"}</span>
                      </span>
                      {current ? (
                        <span className="lq-icon lq-arow__end" data-icon="check" aria-hidden="true" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {/* ── About ──────────────────────────────────────────────────── */}
          {tab === "about" ? (
            <div {...paneProps("about")}>
              <p className="lq-acct__sub">
                {t(
                  "موقع التعريف منفصل عن المتجر، لذلك يُفتح في تبويب جديد.",
                  "The campaign site is a separate surface, so it opens in a new tab."
                )}
              </p>
              <div className="lq-acct__list">
                <RowLink
                  label={t("عن loqaaal", "About loqaaal")}
                  meta="join-loqaaal.vercel.app"
                  href="https://join-loqaaal.vercel.app/"
                  external
                />
                <RowLink
                  label={t("انضم كمتجر", "Join as a shop")}
                  meta="join-loqaaal.vercel.app"
                  href="https://join-loqaaal.vercel.app/"
                  external
                />
                <RowLink label={t("سياسة الخصوصية", "Privacy policy")} href="/privacy" />
                <RowLink label={t("شروط الاستخدام", "Terms of use")} href="/terms" />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </Shell>
  );
}
