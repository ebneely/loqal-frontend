"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { authClient, useSession } from "@/lib/auth-client";
import { EMAIL_ONLY, authMethodsKey, fetchAuthMethods } from "@/lib/auth-methods";
import { useLocale } from "@/lib/locale-context";
import { CodeBoxes } from "@/components/code-boxes";

/**
 * "Keep this number — next time is two taps."
 *
 * WHERE AN ACCOUNT IS WORTH ASKING FOR. Not at checkout: gating a purchase on a
 * sign-up is the surest way to lose the purchase, and this product's whole
 * shape is that a guest can buy. After the order is placed, the shopper has
 * already given the phone and already had a code sent to it — so the ask is not
 * "invent an identity", it is "keep the one you just used". One tap, one code,
 * no password, and the order screen they were reading stays where it is.
 *
 * IT DISAPPEARS THE MOMENT IT IS NOT TRUE. Signed in already, or a deployment
 * that cannot deliver a code, or a phone this API would refuse — nothing is
 * drawn. An offer that cannot be completed is worse than no offer.
 */

/** Egyptian mobiles, in the E.164 the API insists on: +20 then ten digits. */
export function toE164(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");

  const local =
    digits.length === 12 && digits.startsWith("20")
      ? digits.slice(2)
      : digits.length === 11 && digits.startsWith("0")
        ? digits.slice(1)
        : digits.length === 10 && digits.startsWith("1")
          ? digits
          : null;

  if (!local || !/^1[0125]\d{8}$/.test(local)) return null;
  return `+20${local}`;
}

export function KeepNumber({ phone }: { phone: string }) {
  const locale = useLocale();
  const router = useRouter();
  const t = (ar: string, en: string) => (locale === "ar" ? ar : en);

  const { data: session, isPending: sessionPending } = useSession();
  const { data: methods = EMAIL_ONLY } = useQuery({
    queryKey: authMethodsKey,
    queryFn: fetchAuthMethods,
    staleTime: 5 * 60 * 1000,
  });

  const [step, setStep] = useState<"offer" | "code" | "kept">("offer");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const phoneNumber = toE164(phone);

  // Nothing to offer: already signed in, no code can be delivered, or the
  // number on this order is not one the API would accept.
  if (sessionPending || session?.user || !methods.phoneOtp || !phoneNumber) {
    return null;
  }

  const masked = `+20 ${phoneNumber.slice(3, 5)} •••• ${phoneNumber.slice(-4)}`;

  const send = async () => {
    if (pending) return;
    setError(null);
    setPending(true);

    try {
      const result = await authClient.phoneNumber.sendOtp({ phoneNumber });

      if (result.error) {
        setError(
          result.error.message ??
            t("مش قادرين نبعت الكود دلوقتي.", "We cannot send a code right now.")
        );
        setPending(false);
        return;
      }

      setStep("code");
      setAttempt((n) => n + 1);
      setPending(false);
    } catch {
      setError(
        t(
          "مش قادرين نوصل للسيرفر دلوقتي.",
          "We cannot reach the server right now."
        )
      );
      setPending(false);
    }
  };

  const verify = async (code: string) => {
    if (pending) return;
    setError(null);
    setPending(true);

    try {
      const result = await authClient.phoneNumber.verify({ phoneNumber, code });

      if (result.error) {
        setError(
          result.error.message ??
            t("الكود مش مظبوط. جرّب تاني.", "That code is not right. Try again.")
        );
        setAttempt((n) => n + 1);
        setPending(false);
        return;
      }

      setStep("kept");
      setPending(false);
      /* The order screen stays where it is — the shopper was reading it. Only
         the server components that render a session are asked to catch up. */
      router.refresh();
    } catch {
      setError(
        t(
          "مش قادرين نوصل للسيرفر دلوقتي.",
          "We cannot reach the server right now."
        )
      );
      setPending(false);
    }
  };

  if (step === "kept") {
    return (
      <div className="lq-keep" data-done="true">
        <span className="lq-icon lq-keep__tick" data-icon="circle-check" aria-hidden="true" />
        <div className="lq-keep__body">
          <span className="lq-keep__title">
            {t("اتحفظ. أهلاً بيك في loqaaal.", "Kept. Welcome to loqaaal.")}
          </span>
          <p className="lq-keep__lede">
            {t(
              "المرة الجاية ادخل برقمك وكود، وهتلاقي أوردراتك وعناوينك مستنياك.",
              "Next time it is your number and a code, with your orders and addresses waiting."
            )}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="lq-keep">
      <div className="lq-keep__body">
        <span className="lq-keep__title">
          {t("احفظ رقمك للمرة الجاية", "Keep this number for next time")}
        </span>
        <p className="lq-keep__lede">
          {step === "offer"
            ? t(
                `المرة الجاية بضغطتين: رقمك وكود، من غير باسورد. العنوان والأوردرات بيفضلوا محفوظين على ${masked}.`,
                `Next time is two taps: your number and a code, no password. Your address and your orders stay on ${masked}.`
              )
            : t(
                `بعتنا كود على ${masked}. اكتبه وخلاص.`,
                `We sent a code to ${masked}. Type it and you are done.`
              )}
        </p>

        {step === "code" ? (
          <>
            <CodeBoxes onComplete={verify} pending={pending} autoFocus resetKey={attempt} />
            {pending ? (
              <p className="lq-hint" role="status">
                {t("بنتأكد…", "Checking…")}
              </p>
            ) : null}
          </>
        ) : null}

        {error ? (
          <p className="lq-hint lq-hint--error" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      {step === "offer" ? (
        <button
          type="button"
          className="lq-btn lq-btn--primary lq-keep__go"
          onClick={() => void send()}
          disabled={pending}
        >
          {pending ? t("بنبعت الكود", "Sending the code") : t("ابعت الكود", "Send the code")}
        </button>
      ) : (
        <button
          type="button"
          className="lq-btn lq-btn--secondary lq-keep__go"
          onClick={() => void send()}
          disabled={pending}
        >
          {t("ابعت تاني", "Send again")}
        </button>
      )}
    </div>
  );
}
