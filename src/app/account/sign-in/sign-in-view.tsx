"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";

import { signIn } from "@/lib/auth-client";
import { useLocale } from "@/lib/locale-context";
import { Shell } from "@/components/shell";

/**
 * Signing in.
 *
 * NOTHING IN THE APP CALLED `signIn` BEFORE THIS. `auth-client.ts` exported it,
 * `account-view.tsx` rendered a guest state and a sign-out button, and there
 * was no route between the two — a shopper could sign OUT and never back IN.
 * That is the gap this closes, and it is the whole scope of the screen.
 *
 * ── Why email and password, and not the phone-and-code flow ─────────────────
 *
 * The reference board opens with a phone number and a six-digit code, which is
 * the right shape for this product: most Loqal shoppers check out as guests and
 * a phone is the credential they already use. It is NOT built here, because
 * `authClient` carries only `inferAdditionalFields` — there is no phone-number
 * or OTP plugin on the client, and adding one is a server change too (the
 * plugin has to be enabled on the Better Auth instance in the Nest backend,
 * which owns the user table for the whole platform). Building a code screen
 * against a plugin that is not installed would be a form that cannot submit.
 *
 * So this is Better Auth's email and password, which IS installed, and the
 * screen says plainly that the phone route is coming rather than pretending
 * the choice was a preference.
 *
 * ── The guest is not pushed through here ────────────────────────────────────
 *
 * Buying does not require an account: the bag, checkout and the order lookup
 * all work for a guest, and the design system's own note is that the order
 * number plus the phone IS the credential. So this screen offers to continue
 * as a guest, and does it as a real link out rather than as small print.
 */
export function SignInView() {
  const locale = useLocale();
  const router = useRouter();
  const emailId = useId();
  const passwordId = useId();
  const errorId = useId();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const t = (ar: string, en: string) => (locale === "ar" ? ar : en);

  const submit = async (event: React.FormEvent) => {
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

      /**
       * `refresh` before `replace`, so the server components that read the
       * session re-render with it. Without the refresh the shopper lands on an
       * account screen still rendering its guest state.
       *
       * `replace`, not `push`: back out of the account screen should reach
       * wherever they were shopping, not the form they just cleared.
       */
      router.refresh();
      router.replace("/account");
    } catch {
      setError(
        t(
          "مش قادرين نوصل للسيرفر دلوقتي. حاول تاني بعد شوية.",
          "We cannot reach the server right now. Try again in a moment."
        )
      );
      setPending(false);
    }
  };

  return (
    <Shell title={t("الدخول", "Sign in")}>
      <div className="lq-wrap lq-pad">
        <section className="lq-sec">
          <div className="lq-sec__head">
            <div>
              <h1 className="lq-phead__title">{t("ادخل على حسابك", "Sign in")}</h1>
              <p className="lq-eyebrow">
                {t(
                  "الحساب بيخلّي عناوينك وأوردراتك محفوظة.",
                  "An account keeps your addresses and your orders in one place."
                )}
              </p>
            </div>
          </div>

          <hr className="lq-rule" />

          <form onSubmit={submit} className="lq-sec" noValidate>
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

            {/* Inserted rather than hidden-then-shown: role="alert" on a node
                that ARRIVES is announced; a hidden alert is dropped from the
                accessibility tree in between. */}
            {error ? (
              <p id={errorId} className="lq-hint lq-hint--error" role="alert">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              className="lq-btn lq-btn--primary lq-btn--lg lq-btn--block"
              aria-disabled={pending}
            >
              {pending ? t("بندخّلك", "Signing you in") : t("ادخل", "Sign in")}
            </button>
          </form>

          <hr className="lq-rule" />

          {/* Buying never required an account, and saying so is better than
              letting somebody build one to find that out. */}
          <p className="lq-prose">
            {t(
              "مش لازم حساب عشان تطلب. تقدر تشتري كضيف وتتابع الأوردر برقمه ورقم موبايلك.",
              "You do not need an account to order. You can buy as a guest and follow the order by its number and your phone."
            )}
          </p>
          <Link className="lq-btn lq-btn--secondary lq-btn--block" href="/">
            {t("كمّل كضيف", "Continue as a guest")}
          </Link>

          {/*
            BACKEND GAP, stated rather than left as a missing button.

            The phone-and-code flow is what this product wants — a phone is the
            credential an Egyptian shopper already has, and it is what the
            reference board opens with. It needs Better Auth's phone-number/OTP
            plugin enabled on the Nest instance that owns the user table, and
            then declared on `authClient`. Neither is done, so the screen does
            not draw a code field it cannot submit.
          */}
          <p className="lq-hint">
            {t(
              "الدخول برقم الموبايل وكود لسه مش شغال.",
              "Signing in with a phone number and a code is not live yet."
            )}
          </p>
        </section>
      </div>
    </Shell>
  );
}
