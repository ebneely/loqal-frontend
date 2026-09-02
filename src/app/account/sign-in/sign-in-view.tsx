"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { authClient, signIn } from "@/lib/auth-client";
import { EMAIL_ONLY, authMethodsKey, fetchAuthMethods } from "@/lib/auth-methods";
import { useLocale } from "@/lib/locale-context";
import { LocaleSwitch } from "@/components/locale-switch";
import { Wordmark } from "@/components/wordmark";

/**
 * Signing in — a number, then six digits, on a page of its own.
 *
 * NO SITE CHROME. The header, the mega-menus and the 400px footer belong to
 * shopping; on a credential screen they squeeze the one thing the page is for
 * into the strip between them and offer a dozen ways to wander off mid-sign-in.
 * So this route does not mount `Shell`: it is the mark, a way back to the shop,
 * the language toggle, and the form, filling the window.
 *
 * IT GOES BACK WHERE THE SHOPPER CAME FROM. `?next=` carries the path that sent
 * them here, and the browser's own referrer covers the links that forgot to;
 * both are refused unless they are a path on this site, because a `next` that
 * can point anywhere is an open redirect with a sign-in form in front of it.
 *
 * A phone is the credential an Egyptian shopper already has, and it is already
 * half of how this product works: a guest order is opened with its number and
 * the phone that placed it. So the phone route leads, Google sits under it, and
 * email and password — the route brand staff and admins use — is a toggle
 * rather than the front door.
 *
 * WHAT IS DRAWN IS WHAT THE DEPLOYMENT HAS. `/v1/auth/methods` answers three
 * booleans: Google is mounted only where both halves of its credential are set,
 * and the phone code only where a WhatsApp gateway credential exists (or in
 * development, where the code goes to the API's log). This screen renders what
 * that says and nothing else — a button that cannot work is worse than a button
 * that is not there. If the call itself fails, it falls back to email and
 * password, which is the one route always mounted.
 *
 * THE INK PANEL IS DESKTOP ONLY. It carries the three reasons to have an
 * account, which is the honest answer to "why am I being asked to do this" —
 * and on a phone it would be 300px of dark between the shopper and the form,
 * so a container query drops it.
 *
 * THE GUEST EXIT STAYS. Buying never required an account, and letting somebody
 * build one to find that out is the deceit this screen has always refused.
 */

/** Egyptian mobiles are ten digits after +20, and the API refuses anything else. */
const DIGITS = 10;
const CODE_LENGTH = 6;
/** Long enough that resending is a decision, short enough not to strand anyone. */
const RESEND_SECONDS = 45;

type Step = "number" | "code";
type Mode = "phone" | "email";

/** `10 0000 0000` — the grouping Egyptians read a mobile in. */
function groupDigits(digits: string): string {
  const parts = [digits.slice(0, 2), digits.slice(2, 6), digits.slice(6, 10)];
  return parts.filter(Boolean).join(" ");
}

/**
 * A destination this site is allowed to send somebody to after they sign in.
 *
 * Anything not starting with a single `/` is refused: `//evil.example` is a
 * protocol-relative URL a browser reads as another origin, and `https://…` is
 * the same hole spelled out. Sign-in is exactly the page where an open redirect
 * is worth having — the shopper has just proved who they are and will trust the
 * screen they land on.
 */
function safeNext(raw: string | null | undefined): string | null {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return null;
  // Landing back on the form they just completed is a loop, not a return.
  if (raw.startsWith("/account/sign-in")) return null;
  return raw;
}

/** The referrer, reduced to a path, and only when it is one of ours. */
function pathFromReferrer(): string | null {
  if (typeof document === "undefined" || !document.referrer) return null;

  try {
    const url = new URL(document.referrer);
    if (url.origin !== window.location.origin) return null;
    return safeNext(`${url.pathname}${url.search}`);
  } catch {
    return null;
  }
}

export function SignInView() {
  const locale = useLocale();
  const router = useRouter();
  const t = (ar: string, en: string) => (locale === "ar" ? ar : en);

  const emailId = useId();
  const passwordId = useId();
  const errorId = useId();
  const phoneId = useId();

  const { data: methods = EMAIL_ONLY } = useQuery({
    queryKey: authMethodsKey,
    queryFn: fetchAuthMethods,
    staleTime: 5 * 60 * 1000,
  });

  const [prefersEmail, setPrefersEmail] = useState(false);
  const [step, setStep] = useState<Step>("number");
  const [digits, setDigits] = useState("");
  const [code, setCode] = useState<string[]>(() => Array<string>(CODE_LENGTH).fill(""));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [left, setLeft] = useState(0);

  const boxes = useRef<(HTMLInputElement | null)[]>([]);
  const phoneNumber = `+20${digits}`;

  /**
   * Where to land afterwards.
   *
   * `?next=` is the one the links carry, and it is all the RENDER may use: the
   * referrer exists only in the browser, so reading it here would give the
   * server one href and the client another, which is a hydration mismatch on a
   * link the shopper can see. The referrer is consulted at the moment of the
   * redirect instead, where there is no markup to disagree about — that covers
   * every link that arrives here without a `next`.
   */
  const params = useSearchParams();
  const back = safeNext(params.get("next")) ?? "/account";

  /**
   * DERIVED, never stored. The first render answers EMAIL_ONLY — the query has
   * not come back yet — and a mode held in state would latch that fallback and
   * stay on email even after the API says the phone route exists. Only the
   * shopper's own toggle is state.
   */
  const mode: Mode = methods.phoneOtp && !prefersEmail ? "phone" : "email";

  useEffect(() => {
    if (left <= 0) return;
    const timer = window.setInterval(() => setLeft((n) => n - 1), 1000);
    return () => window.clearInterval(timer);
  }, [left]);

  /**
   * `refresh` before `replace`, so the server components that read the session
   * re-render with it. Without the refresh the shopper lands on an account
   * screen still rendering its guest state.
   *
   * `replace`, not `push`: back out of the account screen should reach wherever
   * they were shopping, not the form they just cleared.
   */
  const land = () => {
    router.refresh();
    router.replace(safeNext(params.get("next")) ?? pathFromReferrer() ?? "/account");
  };

  const unreachable = () =>
    t(
      "مش قادرين نوصل للسيرفر دلوقتي. حاول تاني بعد شوية.",
      "We cannot reach the server right now. Try again in a moment."
    );

  const sendCode = async () => {
    if (pending || digits.length < DIGITS) return;
    setError(null);
    setPending(true);

    try {
      const result = await authClient.phoneNumber.sendOtp({ phoneNumber });

      if (result.error) {
        setError(
          result.error.message ??
            t("مش قادرين نبعت الكود للرقم ده.", "We cannot send a code to that number.")
        );
        setPending(false);
        return;
      }

      setCode(Array<string>(CODE_LENGTH).fill(""));
      setStep("code");
      setLeft(RESEND_SECONDS);
      setPending(false);
      window.setTimeout(() => boxes.current[0]?.focus(), 60);
    } catch {
      setError(unreachable());
      setPending(false);
    }
  };

  /**
   * Verifying is not a button. Six digits typed or pasted IS the submit — a
   * confirm button under a full code is a step that exists only to be pressed.
   */
  const verify = async (full: string) => {
    if (pending) return;
    setError(null);
    setPending(true);

    try {
      const result = await authClient.phoneNumber.verify({
        phoneNumber,
        code: full,
      });

      if (result.error) {
        setError(
          result.error.message ??
            t("الكود مش مظبوط. جرّب تاني.", "That code is not right. Try again.")
        );
        setCode(Array<string>(CODE_LENGTH).fill(""));
        setPending(false);
        boxes.current[0]?.focus();
        return;
      }

      land();
    } catch {
      setError(unreachable());
      setPending(false);
    }
  };

  const submitEmail = async (event: React.FormEvent) => {
    event.preventDefault();
    if (pending) return;

    setError(null);
    setPending(true);

    /**
     * The server's own message, not a generic one.
     *
     * Better Auth answers `{ error }` rather than throwing, so a wrong password
     * and an unreachable API arrive by different paths and must not collapse
     * into one sentence — "check your details" sends somebody hunting for a
     * typo during an outage. The catch below is the transport failure; the
     * `result.error` branch is the credential failure.
     */
    try {
      const result = await signIn.email({ email: email.trim(), password });

      if (result.error) {
        setError(
          result.error.message ??
            t("الإيميل أو الباسورد غلط.", "That email or password is not right.")
        );
        setPending(false);
        return;
      }

      land();
    } catch {
      setError(unreachable());
      setPending(false);
    }
  };

  const withGoogle = async () => {
    setError(null);
    try {
      await signIn.social({ provider: "google", callbackURL: back });
    } catch {
      setError(unreachable());
    }
  };

  /** One box: type forward, backspace back, and a pasted code fills all six. */
  const onCodeChange = (index: number, raw: string) => {
    const digit = raw.replace(/\D/g, "");
    if (digit.length > 1) {
      const spread = digit.slice(0, CODE_LENGTH).split("");
      const next = Array<string>(CODE_LENGTH).fill("");
      spread.forEach((value, at) => (next[at] = value));
      setCode(next);
      boxes.current[Math.min(spread.length, CODE_LENGTH - 1)]?.focus();
      if (spread.length === CODE_LENGTH) void verify(next.join(""));
      return;
    }

    const next = [...code];
    next[index] = digit;
    setCode(next);
    if (digit && index < CODE_LENGTH - 1) boxes.current[index + 1]?.focus();

    const full = next.join("");
    if (full.length === CODE_LENGTH && !full.includes("")) void verify(full);
  };

  const error_ = error ? (
    /* Inserted rather than hidden-then-shown: role="alert" on a node that
       ARRIVES is announced; a hidden alert is dropped from the tree between. */
    <p id={errorId} className="lq-hint lq-hint--error" role="alert">
      {error}
    </p>
  ) : null;

  return (
    /* Its own container, because `.lq-shell` is not here to be one and every
       width rule on this page is a container query. */
    <main className="lq-gate">
      <div className="lq-gate__bar">
        <Link className="lq-gate__mark" href="/">
          <Wordmark />
        </Link>
        <div className="lq-gate__tools">
          <LocaleSwitch />
          <Link className="lq-gate__back" href={back}>
            <span className="lq-icon" data-icon="arrow-left" aria-hidden="true" />
            {t("رجوع للمحلات", "Back to the shop")}
          </Link>
        </div>
      </div>

      <div className="lq-gate__body">
        <section className="lq-signin lq-rv">
          <div className="lq-signin__form">
            {step === "number" ? (
              <>
                <h1 className="lq-signin__title">{t("ادخل على حسابك", "Sign in")}</h1>
                <p className="lq-signin__lede">
                  {methods.phoneOtp && mode === "phone"
                    ? t(
                        "رقمك، وبعدين كود من ٦ أرقام. من غير باسورد تنساه.",
                        "Your number, then a six-digit code. No password to forget."
                      )
                    : t(
                        "الحساب بيخلّي عناوينك وأوردراتك محفوظة.",
                        "An account keeps your addresses and your orders in one place."
                      )}
                </p>

                {methods.phoneOtp && mode === "phone" ? (
                  <div className="lq-signin__block">
                    <label className="lq-label" htmlFor={phoneId}>
                      {t("رقم الموبايل", "Mobile number")}
                    </label>
                    {/* The country code is not editable: this product delivers
                        to Cairo and Giza, and the API refuses anything that is
                        not an Egyptian mobile. A free country field would be a
                        way to fail. */}
                    <div className="lq-phone">
                      {/* LTR always: under RTL the browser reorders "+20" to
                          "20+", which is a different thing to read. */}
                      <span className="lq-phone__cc" dir="ltr">
                        +20
                      </span>
                      <input
                        id={phoneId}
                        className="lq-phone__input"
                        inputMode="numeric"
                        autoComplete="tel-national"
                        dir="ltr"
                        placeholder="10 0000 0000"
                        value={groupDigits(digits)}
                        onChange={(event) => {
                          setDigits(event.target.value.replace(/\D/g, "").slice(0, DIGITS));
                          if (error) setError(null);
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") void sendCode();
                        }}
                        aria-invalid={error !== null}
                        aria-describedby={error ? errorId : undefined}
                      />
                    </div>
                    <p className="lq-hint">
                      {t(
                        "بنبعت الكود على واتساب، ولو مَوصلش بنبعته SMS.",
                        "We send the code on WhatsApp, and by SMS if WhatsApp does not reach you."
                      )}
                    </p>

                    {error_}

                    <button
                      type="button"
                      className="lq-btn lq-btn--primary lq-btn--lg lq-btn--block"
                      onClick={() => void sendCode()}
                      disabled={digits.length < DIGITS || pending}
                    >
                      {pending
                        ? t("بنبعت الكود", "Sending the code")
                        : t("ابعت الكود", "Send the code")}
                    </button>
                  </div>
                ) : (
                  <form method="post" onSubmit={submitEmail} className="lq-signin__block" noValidate>
                    <div className="lq-field">
                      <label className="lq-label" htmlFor={emailId}>
                        {t("الإيميل", "Email")}
                      </label>
                      <input
                        id={emailId}
                        className="lq-input"
                        type="email"
                        autoComplete="email"
                        inputMode="email"
                        dir="ltr"
                        value={email}
                        onChange={(event) => {
                          setEmail(event.target.value);
                          if (error) setError(null);
                        }}
                        aria-invalid={error !== null}
                        aria-describedby={error ? errorId : undefined}
                      />
                    </div>

                    <div className="lq-field">
                      <label className="lq-label" htmlFor={passwordId}>
                        {t("الباسورد", "Password")}
                      </label>
                      <input
                        id={passwordId}
                        className="lq-input"
                        type="password"
                        autoComplete="current-password"
                        dir="ltr"
                        value={password}
                        onChange={(event) => {
                          setPassword(event.target.value);
                          if (error) setError(null);
                        }}
                        aria-invalid={error !== null}
                        aria-describedby={error ? errorId : undefined}
                      />
                    </div>

                    {error_}

                    <button
                      type="submit"
                      className="lq-btn lq-btn--primary lq-btn--lg lq-btn--block"
                      aria-disabled={pending}
                    >
                      {pending ? t("بندخّلك", "Signing you in") : t("ادخل", "Sign in")}
                    </button>
                  </form>
                )}

                {methods.google || methods.phoneOtp ? (
                  <div className="lq-or">
                    <span>{t("أو", "or")}</span>
                  </div>
                ) : null}

                {methods.google ? (
                  <button
                    type="button"
                    className="lq-btn lq-btn--secondary lq-btn--lg lq-btn--block"
                    onClick={() => void withGoogle()}
                  >
                    {/* Google's own mark, drawn rather than fetched: the CSP
                        allows no third-party images and a coloured G is what
                        makes the button recognisable at a glance. */}
                    <svg className="lq-signin__g" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        fill="#4285F4"
                        d="M21.6 12.2c0-.7-.06-1.4-.18-2.05H12v3.88h5.4a4.6 4.6 0 0 1-2 3.03v2.5h3.23c1.89-1.74 2.97-4.3 2.97-7.36Z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 22c2.7 0 4.96-.9 6.62-2.44l-3.23-2.5c-.9.6-2.05.96-3.39.96-2.6 0-4.8-1.76-5.59-4.12H3.07v2.58A10 10 0 0 0 12 22Z"
                      />
                      <path fill="#FBBC05" d="M6.41 13.9a6 6 0 0 1 0-3.8V7.52H3.07a10 10 0 0 0 0 8.96l3.34-2.58Z" />
                      <path
                        fill="#EA4335"
                        d="M12 5.98c1.47 0 2.79.5 3.83 1.5l2.86-2.86C16.95 2.99 14.7 2 12 2A10 10 0 0 0 3.07 7.52l3.34 2.58C7.2 7.74 9.4 5.98 12 5.98Z"
                      />
                    </svg>
                    {t("كمّل بجوجل", "Continue with Google")}
                  </button>
                ) : null}

                {methods.phoneOtp ? (
                  <button
                    type="button"
                    className="lq-btn lq-btn--secondary lq-btn--lg lq-btn--block"
                    onClick={() => {
                      setPrefersEmail((current) => !current);
                      setError(null);
                    }}
                  >
                    {mode === "phone"
                      ? t("بالإيميل والباسورد", "Use email and password")
                      : t("برقم الموبايل", "Use a mobile number")}
                  </button>
                ) : null}

                {/* Buying never required an account, and saying so is better
                    than letting somebody build one to find that out. A rule
                    across the column used to separate this; on a card that
                    already has a border and a seam down its middle, one more
                    line was one too many. */}
                <p className="lq-signin__aside">
                  {t(
                    "مش لازم حساب عشان تطلب. تقدر تشتري كضيف وتتابع الأوردر برقمه ورقم موبايلك.",
                    "You do not need an account to order. You can buy as a guest and follow the order by its number and your phone."
                  )}
                </p>
                {/* Back where they were, not to the home page: a shopper who
                    declines the account should return to the basket or the
                    product they were reading. */}
                <Link className="lq-btn lq-btn--secondary lq-btn--block" href={back}>
                  {t("كمّل كضيف", "Continue as a guest")}
                </Link>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="lq-signin__back"
                  onClick={() => {
                    setStep("number");
                    setError(null);
                  }}
                >
                  <span className="lq-icon" data-icon="arrow-left" aria-hidden="true" />
                  {t("غيّر الرقم", "Change the number")}
                </button>

                <h1 className="lq-signin__title">{t("اكتب الكود", "Enter the code")}</h1>
                <p className="lq-signin__lede">
                  {t("اتبعت لـ", "Sent to")}{" "}
                  <b className="lq-signin__num" dir="ltr">
                    +20 {groupDigits(digits)}
                  </b>
                </p>

                {/* One field per digit, LTR always: a six-digit code is a
                    number, and mirroring it in Arabic would reverse it. */}
                <div className="lq-code" dir="ltr">
                  {code.map((value, index) => (
                    <input
                      key={index}
                      ref={(node) => {
                        boxes.current[index] = node;
                      }}
                      className="lq-code__box"
                      inputMode="numeric"
                      autoComplete={index === 0 ? "one-time-code" : "off"}
                      maxLength={CODE_LENGTH}
                      value={value}
                      data-filled={value ? "true" : undefined}
                      disabled={pending}
                      aria-label={`${index + 1}`}
                      onChange={(event) => onCodeChange(index, event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Backspace" && !value && index > 0) {
                          boxes.current[index - 1]?.focus();
                        }
                      }}
                    />
                  ))}
                </div>

                {error_}

                {pending ? (
                  <p className="lq-hint" role="status">
                    {t("بنتأكد…", "Checking…")}
                  </p>
                ) : null}

                <button
                  type="button"
                  className="lq-btn lq-btn--secondary lq-btn--block"
                  onClick={() => void sendCode()}
                  disabled={left > 0 || pending}
                >
                  {left > 0
                    ? t(`ابعته تاني بعد ${left} ثانية`, `Send it again in ${left}s`)
                    : t("ابعت الكود تاني", "Send the code again")}
                </button>
              </>
            )}
          </div>

          <aside className="lq-signin__art" aria-hidden="true">
            {/* The mark's own letter, drifting the long way round the panel.
                One glyph rather than the two rings that were here: the rings
                were decoration that meant nothing, and this is the shape the
                wordmark is built from. */}
            <span className="lq-signin__glyph">a</span>
            <div>
              <span className="lq-eyebrow lq-signin__brand">loqaaal</span>
              <p className="lq-signin__pitch">
                {t("محلات منطقتك، في شنطة واحدة.", "Your neighbourhood shops, in one basket.")}
              </p>
            </div>
            <ul className="lq-signin__points">
              <li>
                <span className="lq-icon" data-icon="truck" />
                {t(
                  "توصيل في نفس اليوم في القاهرة والجيزة — المحل بيحجز المندوب بنفسه.",
                  "Same-day delivery in Cairo and Giza — the shop books its own rider."
                )}
              </li>
              <li>
                <span className="lq-icon" data-icon="map-pin" />
                {t(
                  "العناوين محفوظة، فالأوردر الجاي بضغطتين.",
                  "Addresses kept, so the next order is two taps."
                )}
              </li>
              <li>
                <span className="lq-icon" data-icon="package" />
                {t(
                  "كل الأوردرات في مكان واحد، من أي محل.",
                  "Every order in one place, whichever shop it came from."
                )}
              </li>
            </ul>
            <span className="lq-signin__pay">
              {t(
                "كاش عند الاستلام · بطاقة · فاليو · إنستاباي",
                "Cash on delivery · card · Valu · InstaPay"
              )}
            </span>
          </aside>
        </section>

        <p className="lq-gate__foot">
          {t(
            "بتسجّل دخولك على loqaaal — القاهرة والجيزة.",
            "Signing in to loqaaal — Cairo and Giza."
          )}{" "}
          <a href="https://wa.me/201559959890" target="_blank" rel="noopener noreferrer">
            {t("محتاج مساعدة؟", "Need help?")}
          </a>
        </p>
      </div>
    </main>
  );
}
