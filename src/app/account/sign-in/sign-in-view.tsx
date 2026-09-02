"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { authClient, signIn } from "@/lib/auth-client";
import { EMAIL_ONLY, authMethodsKey, fetchAuthMethods } from "@/lib/auth-methods";
import { useLocale } from "@/lib/locale-context";
import { CodeBoxes } from "@/components/code-boxes";
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
/** Long enough that resending is a decision, short enough not to strand anyone. */
const RESEND_SECONDS = 45;

type Step = "number" | "code";
/** The three ways in, in the order this product prefers them. */
type Door = "phone" | "email" | "password";

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

  const [chosen, setChosen] = useState<Door | null>(null);
  const [step, setStep] = useState<Step>("number");
  const [digits, setDigits] = useState("");
  /** Bumped to clear the six boxes — a code sent, or a code refused. */
  const [attempt, setAttempt] = useState(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [left, setLeft] = useState(0);

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
   * WHICH DOOR IS OPEN, derived rather than stored until the shopper picks one.
   *
   * The first render answers EMAIL_ONLY — the query has not come back yet — and
   * a door held in state from that moment would latch the fallback and stay on
   * the password form even after the API says the phone route exists. So the
   * default follows the answer, and only an explicit choice is state.
   *
   * The order is the ranking: a phone is the credential an Egyptian shopper
   * already has, an email code is the fallback, and the password form is for
   * brand staff and admins, who are issued credentials and know to look for it.
   */
  const door: Door =
    chosen ?? (methods.phoneOtp ? "phone" : methods.emailOtp ? "email" : "password");

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

  /** Whether the field the shopper is filling in is ready to be sent to. */
  const ready = door === "phone" ? digits.length === DIGITS : email.includes("@");

  /**
   * ONE SEND FOR BOTH CODES. The phone and the email route differ by one call
   * and one sentence; giving each its own handler is how the two drift into
   * different retry rules and different error copy.
   */
  const sendCode = async () => {
    if (pending || !ready) return;
    setError(null);
    setPending(true);

    try {
      const result =
        door === "phone"
          ? await authClient.phoneNumber.sendOtp({ phoneNumber })
          : await authClient.emailOtp.sendVerificationOtp({
              email: email.trim(),
              type: "sign-in",
            });

      if (result.error) {
        setError(
          result.error.message ??
            (door === "phone"
              ? t("مش قادرين نبعت الكود للرقم ده.", "We cannot send a code to that number.")
              : t(
                  "مش قادرين نبعت الكود للإيميل ده.",
                  "We cannot send a code to that address."
                ))
        );
        setPending(false);
        return;
      }

      setAttempt((n) => n + 1);
      setStep("code");
      setLeft(RESEND_SECONDS);
      setPending(false);
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
      const result =
        door === "phone"
          ? await authClient.phoneNumber.verify({ phoneNumber, code: full })
          : await signIn.emailOtp({ email: email.trim(), otp: full });

      if (result.error) {
        setError(
          result.error.message ??
            t("الكود مش مظبوط. جرّب تاني.", "That code is not right. Try again.")
        );
        setAttempt((n) => n + 1);
        setPending(false);
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
                  {door === "phone"
                    ? t(
                        "رقمك، وبعدين كود من ٦ أرقام. من غير باسورد تنساه.",
                        "Your number, then a six-digit code. No password to forget."
                      )
                    : door === "email"
                      ? t(
                          "إيميلك، وبعدين كود من ٦ أرقام. من غير باسورد تنساه.",
                          "Your email, then a six-digit code. No password to forget."
                        )
                      : t(
                          "الدخول بالباسورد لأصحاب المحلات وفريق loqaaal.",
                          "The password route is for shop owners and the loqaaal team."
                        )}
                </p>

                {door === "phone" ? (
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
                      disabled={!ready || pending}
                    >
                      {pending
                        ? t("بنبعت الكود", "Sending the code")
                        : t("ابعت الكود", "Send the code")}
                    </button>
                  </div>
                ) : door === "email" ? (
                  /* The same two steps as the phone route, with an address in
                     place of a number — and no password field anywhere on it. */
                  <div className="lq-signin__block">
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
                        onKeyDown={(event) => {
                          if (event.key === "Enter") void sendCode();
                        }}
                        aria-invalid={error !== null}
                        aria-describedby={error ? errorId : undefined}
                      />
                    </div>
                    <p className="lq-hint">
                      {t(
                        "هنبعتلك كود على الإيميل ده. لو عندك أوردرات كضيف بنفس الإيميل، هتلاقيها في حسابك.",
                        "We email a code to that address. Guest orders placed with the same email gather in the account."
                      )}
                    </p>

                    {error_}

                    <button
                      type="button"
                      className="lq-btn lq-btn--primary lq-btn--lg lq-btn--block"
                      onClick={() => void sendCode()}
                      disabled={!ready || pending}
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

                {methods.google || (door !== "phone" && methods.phoneOtp) ||
                (door !== "email" && methods.emailOtp) ? (
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

                {/* The other doors this deployment has, never the one already
                    open. A button that reloads the screen you are on is noise. */}
                {door !== "phone" && methods.phoneOtp ? (
                  <button
                    type="button"
                    className="lq-btn lq-btn--secondary lq-btn--lg lq-btn--block"
                    onClick={() => {
                      setChosen("phone");
                      setError(null);
                    }}
                  >
                    {t("برقم الموبايل", "Use a mobile number")}
                  </button>
                ) : null}

                {door !== "email" && methods.emailOtp ? (
                  <button
                    type="button"
                    className="lq-btn lq-btn--secondary lq-btn--lg lq-btn--block"
                    onClick={() => {
                      setChosen("email");
                      setError(null);
                    }}
                  >
                    {t("بكود على الإيميل", "Use an email code")}
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

                {/* THE PASSWORD ROUTE, DEMOTED TO A LINE OF TEXT.
                    It is how brand staff and admins sign in — they are issued
                    credentials and know to look for it — and it is the way in
                    if both code routes are down. It is not what a shopper
                    should be offered first: a password is a second thing to
                    invent at the moment they wanted to buy a shirt, and
                    resetting one needs email that works. */}
                {door !== "password" && (methods.phoneOtp || methods.emailOtp) ? (
                  <button
                    type="button"
                    className="lq-signin__staff"
                    onClick={() => {
                      setChosen("password");
                      setError(null);
                    }}
                  >
                    {t("عندك باسورد؟ ادخل بيه", "Have a password? Sign in with it")}
                  </button>
                ) : null}
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
                  {door === "phone"
                    ? t("غيّر الرقم", "Change the number")
                    : t("غيّر الإيميل", "Change the address")}
                </button>

                <h1 className="lq-signin__title">{t("اكتب الكود", "Enter the code")}</h1>
                <p className="lq-signin__lede">
                  {t("اتبعت لـ", "Sent to")}{" "}
                  {/* The address as typed, the number regrouped — one is a
                      string the shopper wrote, the other is a figure. */}
                  <b className="lq-signin__num" dir="ltr">
                    {door === "phone" ? `+20 ${groupDigits(digits)}` : email.trim()}
                  </b>
                </p>

                <CodeBoxes
                  onComplete={(full) => void verify(full)}
                  pending={pending}
                  autoFocus
                  resetKey={attempt}
                />

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
            {/* Three concentric rings in the panel's far corner, breathing
                once every four seconds. Straight from the motif mockup, and
                the only motion on the screen. */}
            <span className="lq-signin__rings">
              <i />
              <i />
              <i />
            </span>
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
