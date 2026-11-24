"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { flushSync } from "react-dom";
import { useQuery } from "@tanstack/react-query";

import { authClient, signIn } from "@/lib/auth-client";
import { EMAIL_ONLY, authMethodsKey, fetchAuthMethods } from "@/lib/auth-methods";
import { useLocale } from "@/lib/locale-context";
import { CodeBoxes } from "@/components/code-boxes";
import { LocaleSwitch } from "@/components/locale-switch";
import { Wordmark } from "@/components/wordmark";
import { SignInArt } from "./sign-in-art";

/**
 * Signing in — a number, then six digits, on a page of its own.
 *
 * NO SITE CHROME. The header, the mega-menus and the footer belong to shopping;
 * on a credential screen they squeeze the one thing the page is for and offer a
 * dozen ways to wander off mid-sign-in. So this route does not mount `Shell`:
 * it is a shop's photograph on one side, and on the other the mark, a way back,
 * the language toggle and the form, filling the window.
 *
 * IT GOES BACK WHERE THE SHOPPER CAME FROM. `?next=` carries the path that sent
 * them here, and the browser's own referrer covers the links that forgot to;
 * both are refused unless they are a path on this site, because a `next` that
 * can point anywhere is an open redirect with a sign-in form in front of it.
 *
 * A phone is the credential an Egyptian shopper already has, and it is already
 * half of how this product works: a guest order is opened with its number and
 * the phone that placed it. So the phone route leads, Google sits under it, and
 * email and password — the route brand staff and admins use — is a line of
 * text rather than the front door.
 *
 * WHAT IS DRAWN IS WHAT THE DEPLOYMENT HAS. `/v1/auth/methods` answers which
 * doors exist: Google only where both halves of its credential are set, the
 * phone code only where a WhatsApp gateway credential exists (or in
 * development, where the code goes to the API's log). This screen renders what
 * that says and nothing else — a button that cannot work is worse than a button
 * that is not there. If the call itself fails, it falls back to email and
 * password, which is the one route always mounted.
 *
 * THE PANEL IS THREE SLOW PLANES (`sign-in-art.tsx`). Its front frames hold
 * real shop photos `page.tsx` found, never a stock picture; with none they hold
 * the storefront's garment line art. On a phone it shrinks to a short band
 * above the form.
 *
 * ONE COLUMN. The bar and every control share one measure and one pair of
 * edges. Motion is one system (tokens and timeline in pages-account.css): a
 * first-paint sequence, step changes as view transitions, and a panel that
 * answers the form — it leans toward a focused field, turns a page with the
 * step, and converges on success.
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

export function SignInView({ photos = [] }: { photos?: string[] }) {
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
  /* Motion state. `arrive` holds the first-paint sequence (CSS, keyed on
     data-arrive) until it has played; the other two steer the panel. */
  const [arrive, setArrive] = useState(true);
  const [lean, setLean] = useState(false);
  const [converge, setConverge] = useState(false);

  const phoneNumber = `+20${digits}`;

  useEffect(() => {
    // Long enough for the sequence even behind the session's opening (+1.1s).
    const timer = window.setTimeout(() => setArrive(false), 3000);
    return () => window.clearTimeout(timer);
  }, []);

  /**
   * A step change, as a view transition where the browser has one: the old
   * step leaves toward the inline start, the new one arrives from the inline
   * end, and the column's height morphs between them (pages-account.css,
   * `lq-step`). `back` reverses the direction. Without the API, or under
   * reduced motion, the change is simply applied.
   */
  const swap = (change: () => void, back = false) => {
    setArrive(false);
    if (
      !document.startViewTransition ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      change();
      return;
    }
    document.documentElement.dataset.lqSwap = back ? "back" : "fwd";
    document.startViewTransition(() => flushSync(change));
  };

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
   *
   * The panel's planes converge first, and the move waits the ~half second
   * that takes; under reduced motion it does not wait.
   */
  const land = () => {
    router.refresh();
    setConverge(true);
    const to = safeNext(params.get("next")) ?? pathFromReferrer() ?? "/account";
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.setTimeout(() => router.replace(to), still ? 0 : 480);
  };

  const unreachable = () =>
    t(
      "تعذّر الوصول إلى الخادم الآن. حاول مرة أخرى بعد قليل.",
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
              ? t("تعذّر إرسال الرمز إلى هذا الرقم.", "We cannot send a code to that number.")
              : t(
                  "تعذّر إرسال الرمز إلى هذا البريد.",
                  "We cannot send a code to that address."
                ))
        );
        setPending(false);
        return;
      }

      const toCode = () => {
        setAttempt((n) => n + 1);
        setStep("code");
        setLeft(RESEND_SECONDS);
        setPending(false);
      };
      // A resend from the code step stays put; only the first send moves.
      if (step === "code") toCode();
      else swap(toCode);
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
            t("الرمز غير صحيح. حاول مرة أخرى.", "That code is not right. Try again.")
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
            t(
              "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
              "That email or password is not right."
            )
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

  const pick = (next: Door) =>
    swap(() => {
      setChosen(next);
      setError(null);
    });

  const error_ = error ? (
    /* Inserted rather than hidden-then-shown: role="alert" on a node that
       ARRIVES is announced; a hidden alert is dropped from the tree between. */
    <p id={errorId} className="lq-hint lq-hint--error" role="alert">
      {error}
    </p>
  ) : null;

  const sendLabel = pending ? t("جارٍ إرسال الرمز", "Sending the code") : t("أرسل الرمز", "Send the code");

  /* The other doors this deployment has, never the one already open. A button
     that reloads the screen you are on is noise. */
  const otherPhone = door !== "phone" && methods.phoneOtp;
  const otherEmail = door !== "email" && methods.emailOtp;

  return (
    /* Its own container, because `.lq-shell` is not here to be one and every
       width rule on this page is a container query. */
    <main className="lq-signin" data-arrive={arrive || undefined}>
      <div className="lq-signin__grid">
      <div className="lq-signin__bar">
        <Link className="lq-mark" href="/">
          <Wordmark />
        </Link>
        <div className="lq-signin__tools">
          <LocaleSwitch />
          <Link className="lq-signin__back" href={back}>
            {t("العودة إلى المتاجر", "Back to the shop")}
          </Link>
        </div>
      </div>

      <SignInArt
        photos={photos}
        page={step === "code" ? 1 : 0}
        lean={lean}
        converge={converge}
      >
        <div className="lq-signin__pitch">
          <p className="lq-signin__slogan">
            {t("متاجر منطقتك، في سلة واحدة", "Your neighbourhood shops, in one bag")}
          </p>
          <p className="lq-signin__line">
            {t(
              "توصيل في اليوم نفسه داخل القاهرة والجيزة، يحجز المتجر مندوبه بنفسه.",
              "Same-day delivery in Cairo and Giza. Each shop books its own rider."
            )}
          </p>
        </div>
      </SignInArt>

      {/* A focused field draws the panel's front planes toward the form. */}
      <div
        className="lq-signin__body"
        onFocus={(event) => setLean(event.target instanceof HTMLInputElement)}
        onBlur={() => setLean(false)}
      >
        {/* Keyed on the step and the door, so a swap remounts the column and
            its entrance stagger plays again. State lives above, so nothing
            typed is lost. */}
        <div className="lq-signin__step" key={step === "code" ? "code" : door}>
        {step === "number" ? (
          <>
            <h1 className="lq-signin__title">{t("أدخل إلى حسابك", "Sign in")}</h1>
            <p className="lq-signin__lede">
              {door === "phone"
                ? t(
                    "رقم هاتفك، ثم رمز من 6 أرقام. لا حاجة إلى كلمة مرور.",
                    "Your number, then a six-digit code. No password to forget."
                  )
                : door === "email"
                  ? t(
                      "بريدك الإلكتروني، ثم رمز من 6 أرقام. لا حاجة إلى كلمة مرور.",
                      "Your email, then a six-digit code. No password to forget."
                    )
                  : t(
                      "الدخول بكلمة المرور مخصص لأصحاب المتاجر وفريق loqaaal.",
                      "The password route is for shop owners and the loqaaal team."
                    )}
            </p>

            {door === "phone" ? (
              <div className="lq-signin__block">
                <div className="lq-field">
                  <label className="lq-label" htmlFor={phoneId}>
                    {t("رقم الهاتف", "Mobile number")}
                  </label>
                  {/* The country code is not editable: this product delivers to
                      Cairo and Giza, and the API refuses anything that is not
                      an Egyptian mobile. A free country field would be a way
                      to fail. LTR always: under RTL "+20" would read "20+". */}
                  <div className="lq-phone" dir="ltr">
                    <span className="lq-phone__cc">+20</span>
                    <input
                      id={phoneId}
                      className="lq-phone__input"
                      inputMode="numeric"
                      autoComplete="tel-national"
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
                </div>

                {error_}

                <button
                  type="button"
                  className="lq-btn lq-btn--primary lq-btn--lg lq-btn--block"
                  data-busy={pending || undefined}
                  onClick={() => void sendCode()}
                  disabled={!ready || pending}
                >
                  {sendLabel}
                </button>
                <p className="lq-signin__note">
                  {t(
                    "نرسل الرمز عبر واتساب، وإن لم يصل نرسله برسالة نصية.",
                    "We send the code on WhatsApp, and by SMS if WhatsApp does not reach you."
                  )}
                </p>
              </div>
            ) : door === "email" ? (
              /* The same two steps as the phone route, with an address in place
                 of a number — and no password field anywhere on it. */
              <div className="lq-signin__block">
                <div className="lq-field">
                  <label className="lq-label" htmlFor={emailId}>
                    {t("البريد الإلكتروني", "Email")}
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

                {error_}

                <button
                  type="button"
                  className="lq-btn lq-btn--primary lq-btn--lg lq-btn--block"
                  data-busy={pending || undefined}
                  onClick={() => void sendCode()}
                  disabled={!ready || pending}
                >
                  {sendLabel}
                </button>
                <p className="lq-signin__note">
                  {t(
                    "نرسل رمزًا إلى هذا البريد. وإن كانت لديك طلبات كضيف بالبريد نفسه، فستجدها في حسابك.",
                    "We email a code to that address. Guest orders placed with the same email gather in the account."
                  )}
                </p>
              </div>
            ) : (
              <form method="post" onSubmit={submitEmail} className="lq-signin__block" noValidate>
                <div className="lq-field">
                  <label className="lq-label" htmlFor={emailId}>
                    {t("البريد الإلكتروني", "Email")}
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
                    {t("كلمة المرور", "Password")}
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
                  data-busy={pending || undefined}
                  aria-disabled={pending}
                >
                  {pending ? t("جارٍ الدخول", "Signing you in") : t("دخول", "Sign in")}
                </button>
              </form>
            )}

            {methods.google || otherPhone || otherEmail ? (
              <div className="lq-signin__or">{t("أو", "or")}</div>
            ) : null}

            {methods.google || otherPhone || otherEmail ? (
              <div className="lq-signin__doors">
                {methods.google ? (
                  <button
                    type="button"
                    className="lq-btn lq-btn--secondary lq-btn--lg lq-btn--block"
                    onClick={() => void withGoogle()}
                  >
                    {/* Google's own mark, drawn rather than fetched: a coloured
                        G is what makes the button recognisable at a glance. */}
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
                    {t("المتابعة عبر Google", "Continue with Google")}
                  </button>
                ) : null}

                {otherPhone ? (
                  <button
                    type="button"
                    className="lq-btn lq-btn--secondary lq-btn--lg lq-btn--block"
                    onClick={() => pick("phone")}
                  >
                    {t("الدخول برقم الهاتف", "Use a mobile number")}
                  </button>
                ) : null}

                {otherEmail ? (
                  <button
                    type="button"
                    className="lq-btn lq-btn--secondary lq-btn--lg lq-btn--block"
                    onClick={() => pick("email")}
                  >
                    {t("الدخول برمز عبر البريد", "Use an email code")}
                  </button>
                ) : null}
              </div>
            ) : null}

            {/* Buying never required an account. "Continue as a guest" goes
                back where they were, not to the home page: a shopper who
                declines the account should return to the basket or the
                product they were reading. */}
            <div className="lq-signin__mini">
              <Link className="lq-textlink" href={back}>
                {t("المتابعة كضيف", "Continue as a guest")}
              </Link>
              <Link className="lq-textlink" href="/account#help">
                {t("تحتاج إلى مساعدة؟", "Need help?")}
              </Link>

              {/* THE PASSWORD ROUTE, DEMOTED TO A LINE OF TEXT. It is how
                  brand staff and admins sign in, and the way in if both code
                  routes are down. A shopper should not be offered it first: a
                  password is a second thing to invent at the moment they
                  wanted to buy a shirt. Last in the row, at its far edge. */}
              {door !== "password" && (methods.phoneOtp || methods.emailOtp) ? (
                <button
                  type="button"
                  className="lq-textlink lq-signin__staff"
                  onClick={() => pick("password")}
                >
                  {t("لديك كلمة مرور؟ ادخل بها", "Have a password? Sign in with it")}
                </button>
              ) : null}
            </div>
          </>
        ) : (
          <>
            <h1 className="lq-signin__title">{t("اكتب الرمز", "Enter the code")}</h1>
            <p className="lq-signin__lede">
              {t("أرسلنا الرمز إلى", "Sent to")}{" "}
              {/* The address as typed, the number regrouped — one is a string
                  the shopper wrote, the other is a figure. */}
              <b className="lq-signin__num" dir="ltr">
                {door === "phone" ? `+20 ${groupDigits(digits)}` : email.trim()}
              </b>
            </p>

            <div className="lq-signin__block">
              <CodeBoxes
                onComplete={(full) => void verify(full)}
                pending={pending}
                autoFocus
                resetKey={attempt}
              />

              {error_}

              {pending ? (
                <p className="lq-hint" role="status">
                  {t("جارٍ التحقق…", "Checking…")}
                </p>
              ) : null}

              <button
                type="button"
                className="lq-btn lq-btn--secondary lq-btn--lg lq-btn--block"
                onClick={() => void sendCode()}
                disabled={left > 0 || pending}
              >
                {left > 0
                  ? t(`يمكنك إعادة الإرسال بعد ${left} ثانية`, `Send it again in ${left}s`)
                  : t("أعد إرسال الرمز", "Send the code again")}
              </button>
            </div>

            <div className="lq-signin__mini">
              <button
                type="button"
                className="lq-textlink"
                onClick={() =>
                  swap(() => {
                    setStep("number");
                    setError(null);
                  }, true)
                }
              >
                {door === "phone"
                  ? t("تغيير الرقم", "Change the number")
                  : t("تغيير البريد", "Change the address")}
              </button>
              <Link className="lq-textlink" href="/account#help">
                {t("تحتاج إلى مساعدة؟", "Need help?")}
              </Link>
            </div>
          </>
        )}
        </div>
      </div>
      </div>
    </main>
  );
}
