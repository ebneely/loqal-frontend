"use client";

import { useAddresses, useDeleteAddress, useMakeDefaultAddress } from "@/lib/account";
import { useLocale } from "@/lib/locale-context";

/**
 * The shopper's saved addresses.
 *
 * THEY ARE WRITTEN BY CHECKOUT, NOT BY A FORM HERE. Every signed-in order keeps
 * the address it went to, so the book fills itself; this screen chooses which
 * one checkout starts from and removes the ones that are no longer true. A
 * second address form — the governorate picker, the phone rule, the validation
 * — would be checkout's form copied, and two copies of a form are two sets of
 * rules that drift.
 *
 * The default is the one checkout prefills. There is always exactly one while
 * any address exists; the API guarantees it, including when the default is the
 * one being deleted.
 */
export function AddressBook() {
  const locale = useLocale();
  const t = (ar: string, en: string) => (locale === "ar" ? ar : en);

  const { data, isPending, isError } = useAddresses(true);
  const makeDefault = useMakeDefaultAddress();
  const remove = useDeleteAddress();
  const busy = makeDefault.isPending || remove.isPending;

  if (isPending) {
    return <div className="lq-skel" style={{ blockSize: 120 }} aria-hidden="true" />;
  }

  if (isError) {
    return (
      <p className="lq-hint lq-hint--error" role="alert">
        {t("مش قادرين نجيب عناوينك دلوقتي.", "We cannot load your addresses right now.")}
      </p>
    );
  }

  if (!data || data.length === 0) {
    return (
      <p className="lq-arail__sub">
        {t(
          "لسه مفيش عناوين. أول أوردر هيحفظ عنوانه لوحده، والمرة الجاية هيتكتب لك.",
          "No addresses yet. Your first order keeps its address, and the next checkout fills it in for you."
        )}
      </p>
    );
  }

  return (
    <>
      <p className="lq-arail__sub">
        {t(
          "العنوان الأساسي هو اللي بيتكتب لوحده في الشيك أوت.",
          "The default address is the one checkout fills in for you."
        )}
      </p>

      <div className="lq-rows">
        {data.map((address) => (
          <div key={address.id} className="lq-addr" data-default={address.isDefault ? "true" : undefined}>
            <div className="lq-addr__body">
              <span className="lq-addr__name" data-bidi>
                {address.label ?? address.fullName ?? t("عنوان", "Address")}
                {address.isDefault ? (
                  <span className="lq-badge lq-badge--tint lq-addr__badge">
                    {t("الأساسي", "Default")}
                  </span>
                ) : null}
              </span>
              <span className="lq-hint" data-bidi>
                {[address.street, address.building, address.city, address.governorate]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
              <span className="lq-hint" dir="ltr" data-num style={{ textAlign: "start" }}>
                {address.phone}
              </span>
            </div>

            <div className="lq-addr__acts">
              {address.isDefault ? null : (
                <button
                  type="button"
                  className="lq-btn lq-btn--secondary lq-btn--sm"
                  disabled={busy}
                  onClick={() => makeDefault.mutate(address.id)}
                >
                  {t("خليه الأساسي", "Make default")}
                </button>
              )}
              <button
                type="button"
                className="lq-addr__remove"
                disabled={busy}
                onClick={() => remove.mutate(address.id)}
              >
                {t("امسح", "Remove")}
              </button>
            </div>
          </div>
        ))}
      </div>

      {makeDefault.isError || remove.isError ? (
        <p className="lq-hint lq-hint--error" role="alert">
          {t("محصلش التغيير. حاول تاني.", "That did not go through. Try again.")}
        </p>
      ) : null}
    </>
  );
}
