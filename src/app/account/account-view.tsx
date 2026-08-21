"use client";

import { useSession, signOut } from "@/lib/auth-client";
import { setLocaleCookie } from "@/lib/locale-context";
import { useLocale } from "@/lib/locale-context";
import { Shell } from "@/components/shell";

/**
 * Account.
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
export function AccountView() {
  const locale = useLocale();
  const { data: session, isPending } = useSession();

  const t = {
    title: locale === "ar" ? "حسابي" : "Account",
    guest: locale === "ar" ? "إنت بتتصفح كضيف" : "You are browsing as a guest",
    guestBody:
      locale === "ar"
        ? "تقدر تشتري من غير حساب. الأوردر بيتفتح برقمه ورقم الموبايل."
        : "You can buy without an account. An order is opened by its number and phone.",
    signedIn: locale === "ar" ? "داخل باسم" : "Signed in as",
    signOut: locale === "ar" ? "تسجيل الخروج" : "Sign out",
    language: locale === "ar" ? "اللغة" : "Language",
    arabic: "العربية",
    english: "English",
    /* Named as what is missing, not as "coming soon". */
    noSignIn:
      locale === "ar"
        ? "الدخول برقم الموبايل لسه مش شغّال — السيرفر لسه مبيبعتش كود."
        : "Signing in by phone is not live yet — the server does not send a code.",
  };

  return (
    <Shell title={t.title}>
      <div className="lq-wrap lq-pad">
        <section className="lq-sec">
          {isPending ? (
            <div className="lq-skel" style={{ blockSize: 56 }} />
          ) : session?.user ? (
            <>
              <span className="lq-eyebrow">{t.signedIn}</span>
              <span className="lq-pcard__name" data-bidi>
                {session.user.email}
              </span>
              <button
                type="button"
                className="lq-btn lq-btn--secondary"
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
                {t.signOut}
              </button>
            </>
          ) : (
            <>
              <span className="lq-pcard__name">{t.guest}</span>
              <p className="lq-hint">{t.guestBody}</p>
              <p className="lq-hint">{t.noSignIn}</p>
            </>
          )}
        </section>

        <section className="lq-sec">
          <span className="lq-eyebrow">{t.language}</span>
          <div className="lq-vp__row">
            <button
              type="button"
              className="lq-chip"
              aria-pressed={locale === "ar"}
              onClick={() => setLocaleCookie("ar")}
            >
              {t.arabic}
            </button>
            <button
              type="button"
              className="lq-chip"
              aria-pressed={locale === "en"}
              onClick={() => setLocaleCookie("en")}
            >
              {t.english}
            </button>
          </div>
        </section>
      </div>
    </Shell>
  );
}
