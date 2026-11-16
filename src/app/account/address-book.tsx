"use client";

import { useAddresses, useDeleteAddress, useMakeDefaultAddress } from "@/lib/account";
import { useLocale } from "@/lib/locale-context";
import { EmptyState } from "@/components/state";

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
 * one being deleted. It is marked by a worded tag, never by colour alone.
 */
export function AddressBook() {
  const locale = useLocale();
  const t = (ar: string, en: string) => (locale === "ar" ? ar : en);

  const { data, isPending, isError, isFetching, refetch } = useAddresses(true);
  const makeDefault = useMakeDefaultAddress();
  const remove = useDeleteAddress();
  const busy = makeDefault.isPending || remove.isPending;

  if (isPending) {
    return <div className="lq-skel" style={{ blockSize: 120 }} aria-hidden="true" />;
  }

  if (isError) {
    return (
      <EmptyState
        art="crooked"
        tone="loud"
        role="alert"
        title={t("تعذّر تحميل عناوينك الآن", "We cannot load your addresses right now")}
        body={t(
          "عناوينك محفوظة كما هي، لكن الاتصال انقطع. أعد المحاولة بعد لحظة.",
          "Your addresses are safe; the connection dropped. Try again in a moment."
        )}
        actions={
          <button
            type="button"
            className="lq-btn lq-btn--primary"
            aria-busy={isFetching}
            onClick={() => void refetch()}
          >
            {t("أعد المحاولة", "Try again")}
          </button>
        }
      />
    );
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        art="shelf"
        title={t("لا عناوين بعد", "No addresses yet")}
        body={t(
          "يحفظ أول طلب عنوانه تلقائيًا، وفي المرة التالية يُكتب لك في صفحة الدفع.",
          "Your first order keeps its address, and the next checkout fills it in for you."
        )}
      />
    );
  }

  return (
    <>
      <p className="lq-acct__sub">
        {t(
          "العنوان الافتراضي هو الذي يُكتب تلقائيًا في صفحة الدفع.",
          "The default address is the one checkout fills in for you."
        )}
      </p>

      <div className="lq-acct__cards">
        {data.map((address) => (
          <div key={address.id} className="lq-acard">
            <div className="lq-acard__body">
              <b data-bidi>{address.label ?? address.fullName ?? t("عنوان", "Address")}</b>
              <p data-bidi>
                {[address.street, address.building, address.city, address.governorate]
                  .filter(Boolean)
                  .join("، ")}
              </p>
              <p>
                <span dir="ltr" data-num>
                  {address.phone}
                </span>
              </p>
              <div className="lq-acard__acts">
                {address.isDefault ? null : (
                  <button
                    type="button"
                    className="lq-textlink"
                    disabled={busy}
                    onClick={() => makeDefault.mutate(address.id)}
                  >
                    {t("اجعله الافتراضي", "Make default")}
                  </button>
                )}
                <button
                  type="button"
                  className="lq-textlink lq-acard__remove"
                  disabled={busy}
                  onClick={() => remove.mutate(address.id)}
                >
                  {t("احذف", "Remove")}
                </button>
              </div>
            </div>
            {address.isDefault ? (
              <span className="lq-pill" data-tone="good">
                {t("الافتراضي", "Default")}
              </span>
            ) : null}
          </div>
        ))}
      </div>

      {makeDefault.isError || remove.isError ? (
        <p className="lq-hint lq-hint--error" role="alert">
          {t("لم يتم التغيير. حاول مرة أخرى.", "That did not go through. Try again.")}
        </p>
      ) : null}
    </>
  );
}
