"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";

import type { CartBrand, CartSummary } from "@loqal/contracts/cart.contract";
import type { DeliveryMethod, PaymentMethod } from "@loqal/contracts/enums";
import {
  createOrderBodySchema,
  type CreateOrderBody,
  type CreateOrderResult,
} from "@loqal/contracts/storefront.contract";
import { ApiError } from "@/lib/api";
import { useCart } from "@/lib/cart";
import { useCheckoutKey, useCreateOrder, usePaymentLink } from "@/lib/orders";
import { useSession } from "@/lib/auth-client";
import { formatPrice, type Locale } from "@/lib/locale";
import { useLocale } from "@/lib/locale-context";
import { Shell } from "@/components/shell";
import { Money } from "@/components/money";
import { DeliveryPicker, deliveryLabel } from "@/components/delivery-picker";

/**
 * Checkout.
 *
 * THE SCREEN COLLECTS THREE THINGS AND SENDS NO MONEY. `POST /v1/orders` takes
 * a payment method, an address and — for a guest — a name, an email and a
 * phone. It takes no prices, no cart id, no line items and no delivery method:
 * the server reads the bag off the session, reprices every figure from the
 * primary database, and uses the method the bag already wrote with
 * `PUT /v1/cart/delivery-method`. Every figure on this page is therefore an
 * ESTIMATE the shopper is shown so they are not surprised, and the copy says
 * so rather than implying the total is a contract.
 *
 * THE THREE FAILURES THIS SCREEN IS BUILT AROUND, all of them real:
 *
 *   1. A 400 from a strict DTO. The order was not created and the field that
 *      is wrong is named, in a sentence, beside the field.
 *   2. A null `checkoutUrl` on a CARD or VALU order. THE ORDER EXISTS and its
 *      payment session does not. The shopper is not told it failed, because it
 *      did not; the screen asks for a fresh link, and if that fails too it
 *      lands them on the order screen, which carries the same recovery.
 *   3. A request that never came back. The order MAY EXIST. This is the one
 *      that makes double orders, and the whole answer is
 *      `Idempotency-Key`: one key per checkout, kept across every retry, so
 *      pressing the button again either creates the order for the first time
 *      or replays the one that is already there. The copy under the retry says
 *      exactly that, because a shopper who is afraid of being charged twice
 *      will otherwise open the app again and start over.
 */

/** The two routes that go through a payment page. See `createOrderResultSchema`. */
const HAS_PAYMENT_PAGE: ReadonlySet<PaymentMethod> = new Set<PaymentMethod>(["CARD", "VALU"]);

type Stage = 0 | 1 | 2;

const STAGES: ReadonlyArray<{ ar: string; en: string }> = [
  { ar: "التوصيل لفين", en: "Where it goes" },
  { ar: "المحلات", en: "The shops" },
  { ar: "الدفع", en: "Payment" },
];

/* Mirrors COLLECTED_ON_DELIVERY in order-pricing.service.ts, which refuses
   these three on RIDER_PER_BRAND — nobody is at the door to collect. */
const COLLECTED_ON_DELIVERY: ReadonlySet<PaymentMethod> = new Set<PaymentMethod>([
  "CASH",
  "WALLET",
  "INSTAPAY",
]);

const paymentOffered = (method: PaymentMethod, delivery: DeliveryMethod | null) =>
  delivery !== "RIDER_PER_BRAND" || !COLLECTED_ON_DELIVERY.has(method);

/**
 * The five methods, in the order the board draws them: cash first, because it
 * is what most of these orders actually are.
 *
 * Each note says WHAT HAPPENS NEXT, which is the one thing the enum name does
 * not carry and the thing a shopper is deciding on. Nothing here describes a
 * flow the API does not have: cash is collected by the rider
 * (`codCollectedAmount` is a real per-shop field), card and ValU return a
 * `checkoutUrl`, and wallet and InstaPay return none — so their note says the
 * order is placed and the payment is settled with the shop, and does not
 * invent a transfer screen that does not exist.
 */
const PAYMENTS: ReadonlyArray<{
  method: PaymentMethod;
  ar: string;
  en: string;
  arNote: string;
  enNote: string;
}> = [
  {
    method: "CASH",
    ar: "كاش عند الاستلام",
    en: "Cash on delivery",
    arNote: "بتدفع للمندوب وهو بيسلّمك. كل محل بياخد فلوس نصّه لوحده.",
    enNote: "You pay the rider on handover. Each shop collects for its own half.",
  },
  {
    method: "CARD",
    ar: "كارت",
    en: "Card",
    arNote: "هتتحوّل لصفحة الدفع، وترجع على الأوردر بعد ما تخلّص.",
    enNote: "You are sent to the payment page and come back to the order.",
  },
  {
    method: "WALLET",
    ar: "محفظة موبايل",
    en: "Mobile wallet",
    arNote: "الطريقة دي مفيش لها صفحة دفع هنا. الأوردر بيتسجّل، والتحويل بيتظبط مع المحل.",
    enNote: "There is no payment page for this one. The order is placed and the transfer is settled with the shop.",
  },
  {
    method: "INSTAPAY",
    ar: "إنستاباي",
    en: "InstaPay",
    arNote: "الطريقة دي مفيش لها صفحة دفع هنا. الأوردر بيتسجّل، والتحويل بيتظبط مع المحل.",
    enNote: "There is no payment page for this one. The order is placed and the transfer is settled with the shop.",
  },
  {
    method: "VALU",
    ar: "فاليو — تقسيط",
    en: "ValU — instalments",
    arNote: "هتتحوّل لفاليو عشان تظبط التقسيط، وترجع على الأوردر.",
    enNote: "You are sent to ValU to set up the instalments and come back to the order.",
  },
];

/**
 * The governorates, as a fact rather than as a delivery promise.
 *
 * This list is Egypt's twenty-seven governorates and nothing more. It does NOT
 * claim Loqal delivers to all of them — the shop books its own rider and only
 * covers its own area, which is why nothing here is filtered by coverage the
 * API does not publish. A shopper outside a shop's range finds that out from
 * the shop, and the alternative is a list that silently invents a service map.
 */
const GOVERNORATES: ReadonlyArray<{ ar: string; en: string }> = [
  { ar: "القاهرة", en: "Cairo" },
  { ar: "الجيزة", en: "Giza" },
  { ar: "القليوبية", en: "Qalyubia" },
  { ar: "الإسكندرية", en: "Alexandria" },
  { ar: "البحيرة", en: "Beheira" },
  { ar: "الغربية", en: "Gharbia" },
  { ar: "المنوفية", en: "Monufia" },
  { ar: "الدقهلية", en: "Dakahlia" },
  { ar: "الشرقية", en: "Sharqia" },
  { ar: "كفر الشيخ", en: "Kafr El Sheikh" },
  { ar: "دمياط", en: "Damietta" },
  { ar: "بورسعيد", en: "Port Said" },
  { ar: "الإسماعيلية", en: "Ismailia" },
  { ar: "السويس", en: "Suez" },
  { ar: "شمال سيناء", en: "North Sinai" },
  { ar: "جنوب سيناء", en: "South Sinai" },
  { ar: "البحر الأحمر", en: "Red Sea" },
  { ar: "بني سويف", en: "Beni Suef" },
  { ar: "الفيوم", en: "Faiyum" },
  { ar: "المنيا", en: "Minya" },
  { ar: "أسيوط", en: "Asyut" },
  { ar: "سوهاج", en: "Sohag" },
  { ar: "قنا", en: "Qena" },
  { ar: "الأقصر", en: "Luxor" },
  { ar: "أسوان", en: "Aswan" },
  { ar: "مطروح", en: "Matrouh" },
  { ar: "الوادي الجديد", en: "New Valley" },
];

/** Every field that can be wrong, so a message lands on the field that owns it. */
type FieldKey =
  | "firstName"
  | "email"
  | "guestPhone"
  | "fullName"
  | "phone"
  | "governorate"
  | "city"
  | "street"
  | "delivery";

/** Which stage owns each failure. */
const STAGE_FIELDS: ReadonlyArray<ReadonlyArray<FieldKey>> = [
  ["firstName", "email", "guestPhone", "fullName", "phone", "governorate", "city", "street"],
  ["delivery"],
  [],
];

const stageOf = (key: FieldKey): Stage => {
  const at = STAGE_FIELDS.findIndex((keys) => keys.includes(key));
  return at === -1 ? 0 : (at as Stage);
};

export function CheckoutView() {
  const locale = useLocale();
  const router = useRouter();
  const t = (ar: string, en: string) => (locale === "ar" ? ar : en);

  const { data: cart, isPending, isError, refetch } = useCart();
  const { data: session, isPending: sessionPending } = useSession();
  const anonymous = !session?.user;

  const create = useCreateOrder();
  const paymentLink = usePaymentLink();
  const checkoutKey = useCheckoutKey();

  const [paymentChoice, setPaymentChoice] = useState<PaymentMethod>("CASH");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [governorate, setGovernorate] = useState("");
  const [city, setCity] = useState("");
  const [street, setStreet] = useState("");
  const [building, setBuilding] = useState("");
  const [notes, setNotes] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldKey, true>>>({});
  const [stage, setStage] = useState<Stage>(0);

  /**
   * True from the moment an order comes back until the browser has actually
   * left. `create.isPending` goes false on success and the button would flick
   * back to "اطلب" for the beat before a full-page navigation to Paymob starts
   * — an enabled primary button on a screen that is leaving is an invitation
   * to press it twice.
   */
  const [leaving, setLeaving] = useState(false);
  const busy = create.isPending || paymentLink.isPending || leaving;

  const chosenDelivery = cart?.deliveryMethod ?? null;
  const paymentMethod = paymentOffered(paymentChoice, chosenDelivery)
    ? paymentChoice
    : "CARD";

  const formRef = useRef<HTMLFormElement>(null);
  const payRef = useRef<HTMLElement>(null);

  /* Declared before the refused-submit effect: a failed submit changes both,
     and the later scroll — to the bad field — is the one that survives. */
  const entered = useRef(false);
  useEffect(() => {
    if (!entered.current) {
      entered.current = true;
      return;
    }
    formRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [stage]);

  /**
   * Focus and scroll to the FIRST invalid field after a refused submit.
   *
   * The button sits under nine fields, so on a phone the field that refused
   * can be screens away and a press that silently does nothing reads as a
   * broken button. A counter rather than the errors object, so a second press
   * with the same mistakes still moves the viewport — that press is the
   * shopper asking "where?" again.
   *
   * An effect, because the `aria-invalid` marks only exist in the DOM after
   * the re-render `setFieldErrors` triggers. The selector's three arms are the
   * three shapes an error takes on this form: a marked input, the governorate
   * trigger (a button, which cannot carry `aria-invalid` — see
   * `GovernorateSelect`), and the delivery alert, which marks no control.
   */
  const [refusedAt, setRefusedAt] = useState(0);
  useEffect(() => {
    if (refusedAt === 0) return;
    const target = formRef.current?.querySelector<HTMLElement>(
      '[aria-invalid="true"], .lq-seltrigger[aria-describedby], .lq-hint--error'
    );
    if (!target) return;
    if (target instanceof HTMLInputElement || target instanceof HTMLButtonElement) {
      target.focus({ preventScroll: true });
    }
    target.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [refusedAt]);

  const title = t("إتمام الأوردر", "Checkout");

  if (isPending || sessionPending) {
    return (
      <Shell title={title}>
        <div className="lq-wrap lq-pad">
          <CheckoutSkeleton />
        </div>
      </Shell>
    );
  }

  if (isError) {
    return (
      <Shell title={title}>
        <div className="lq-wrap lq-pad lq-sec">
          <h1 className="lq-phead__title">{title}</h1>
          <p className="lq-hint lq-hint--error" role="alert">
            {t(
              "مش قادرين نجيب السلة دلوقتي. حاجاتك لسه مكانها — الاتصال هو اللي وقع.",
              "We cannot load your bag right now. Nothing was lost — the connection was."
            )}
          </p>
          <div>
            <button type="button" className="lq-btn lq-btn--secondary" onClick={() => refetch()}>
              <span className="lq-icon" data-icon="refresh-cw" aria-hidden="true" />
              {t("جرّب تاني", "Try again")}
            </button>
          </div>
        </div>
      </Shell>
    );
  }

  /* An empty bag on a checkout screen is not an error state and not an empty
     state: it is a shopper who has nothing to buy, so it describes the screen
     they should be on and links there. */
  if (!cart || cart.brands.length === 0) {
    return (
      <Shell title={title}>
        <div className="lq-wrap lq-pad lq-sec">
          <h1 className="lq-phead__title">{title}</h1>
          <p className="lq-prose">
            {t(
              "الأوردر بيتعمل من السلة. اختار حاجات من أي محل، وارجع هنا تكتب العنوان وتختار طريقة الدفع.",
              "An order is placed from the bag. Pick pieces from any shop and come back here for the address and the payment method."
            )}
          </p>
          <div>
            <Link href="/shops" className="lq-btn lq-btn--primary lq-btn--lg">
              <span className="lq-icon" data-icon="store" aria-hidden="true" />
              {t("اتفرّج على المحلات", "Browse shops")}
            </Link>
          </div>
        </div>
      </Shell>
    );
  }

  const blocked = cart.brands.filter((brand) => !brand.minimumOrderMet);

  /* Whitespace is not an answer. Trimmed once, here, and the trimmed values
     are what both the check and the body use — a field holding " " passing
     validation and then failing the API's own `.min(1)` is the same bug twice. */
  const values = {
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    email: email.trim(),
    guestPhone: guestPhone.trim(),
    fullName: fullName.trim(),
    phone: phone.trim(),
    governorate: governorate.trim(),
    city: city.trim(),
    street: street.trim(),
    building: building.trim(),
    notes: notes.trim(),
  };

  const validate = (): Partial<Record<FieldKey, true>> => {
    const errors: Partial<Record<FieldKey, true>> = {};

    if (anonymous) {
      if (!values.firstName) errors.firstName = true;
      /* The API's own shape, not a stricter one: one @ with something either
         side. A regex that rejects a real address is worse than one that lets
         a typo through, because the typo is the shopper's to see. */
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) errors.email = true;
      if (values.guestPhone.replace(/\D/g, "").length < 10) errors.guestPhone = true;
    }

    if (!values.fullName) errors.fullName = true;
    if (values.phone.replace(/\D/g, "").length < 10) errors.phone = true;
    if (!values.governorate) errors.governorate = true;
    if (!values.city) errors.city = true;
    if (!values.street) errors.street = true;
    /* Not a field on this form, and still this screen's problem: the method is
       one decision for the whole basket and the API reads it off the cart. */
    if (!cart.deliveryMethod) errors.delivery = true;

    return errors;
  };

  /* validate() narrowed to one stage's keys, never a second set of rules. */
  const validateStage = (at: Stage): Partial<Record<FieldKey, true>> => {
    const all = validate();
    const mine: Partial<Record<FieldKey, true>> = {};
    for (const key of STAGE_FIELDS[at]) if (all[key]) mine[key] = true;
    return mine;
  };

  /* A shop under its minimum blocks stage 2 with no field of its own — the
     notice on its card is the .lq-hint--error the focus effect finds. */
  const advance = () => {
    const errors = validateStage(stage);
    const stuck = stage === 1 && blocked.length > 0;
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0 || stuck) {
      setRefusedAt((tick) => tick + 1);
      return;
    }
    setStage((at) => Math.min(at + 1, 2) as Stage);
  };

  /**
   * Where a created order sends the shopper.
   *
   * `checkoutUrl` first, and `window.location.assign` rather than
   * `router.push` — Paymob is another origin and the Next router cannot leave
   * this app.
   *
   * A NULL URL ON A CARD OR VALU ORDER IS NOT THE END OF THE ROAD. The order
   * row exists; only the payment session is missing, so one fresh link is
   * asked for before giving up. If that fails too the shopper still goes to
   * their order — which is real, and which carries the same recovery button —
   * rather than being left on a checkout form for an order that has already
   * been placed.
   */
  const land = async (result: CreateOrderResult) => {
    setLeaving(true);

    if (result.checkoutUrl) {
      window.location.assign(result.checkoutUrl);
      return;
    }

    if (HAS_PAYMENT_PAGE.has(paymentMethod)) {
      try {
        const url = await paymentLink.mutateAsync({ orderId: result.order.id });
        if (url) {
          window.location.assign(url);
          return;
        }
      } catch {
        /* Swallowed on purpose: the order exists either way and the order
           screen is a better place to stand than this one. The failure is
           re-reachable there, with the same endpoint behind the same button. */
      }
    }

    /* The phone travels in the URL because the order screen reads the order
       with it — the number plus the phone IS the credential on the anonymous
       lookup, and a URL that carries both is one the shopper can reopen. Both
       pages are noindex for exactly that reason.

       WHICH phone is the API's decision, not a choice: checkout writes
       `guestPhone = guest.phone ?? shippingAddress.phone`
       (`order-checkout.service.ts`) and the lookup matches ONLY that column
       (`order.repository.ts`'s `findForGuest`). So a guest opens the order
       with their OWN number — the rider's number opens nothing for them — and
       a signed-in shopper, who sends no `guest` block, opens it with the
       delivery phone. Redirecting a guest with `values.phone` was a 404 on
       their own order the moment the two numbers differed. */
    router.push(
      `/orders/${encodeURIComponent(result.order.orderNumber)}?phone=${encodeURIComponent(anonymous ? values.guestPhone : values.phone)}`
    );
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;

    /* Enter inside a field submits the form at whatever stage it is on, so the
       one handler carries both meanings rather than leaving a keyboard press
       to run the final check against a form that is three quarters unmounted. */
    if (stage < 2) {
      advance();
      return;
    }

    /* THE WHOLE FORM, still — a stage check is a gate, not the answer. What is
       new is where a failure sends the shopper: the field is on a stage that
       may not be mounted, so the stage it belongs to opens first and the
       focus effect finds it there. */
    const errors = validate();
    const first = (Object.keys(errors) as FieldKey[])[0];
    setFieldErrors(errors);
    if (first) {
      setStage(stageOf(first));
      setRefusedAt((tick) => tick + 1);
      return;
    }
    if (blocked.length > 0) {
      setStage(1);
      setRefusedAt((tick) => tick + 1);
      return;
    }

    const body: CreateOrderBody = {
      paymentMethod,
      shippingAddress: {
        fullName: values.fullName,
        phone: values.phone,
        governorate: values.governorate,
        city: values.city,
        street: values.street,
        /* OMITTED, not sent empty. The API's DTO is `.strict()` with `.min(1)`
           on both, so `building: ""` is a 400 rather than "no building". */
        ...(values.building ? { building: values.building } : {}),
        ...(values.notes ? { notes: values.notes } : {}),
      },
      ...(anonymous
        ? {
            guest: {
              firstName: values.firstName,
              ...(values.lastName ? { lastName: values.lastName } : {}),
              email: values.email,
              phone: values.guestPhone,
            },
          }
        : {}),
    };

    /* Parsed against the same schema the API validates with, on the way out.
       A body that cannot pass here would come back as a 400 the shopper has
       to read, one round trip later, on mobile data. */
    const parsed = createOrderBodySchema.safeParse(body);
    if (!parsed.success) {
      setFieldErrors({ fullName: true });
      setStage(stageOf("fullName"));
      setRefusedAt((tick) => tick + 1);
      return;
    }

    create.mutate(
      /* ONE KEY FOR THE WHOLE CHECKOUT. `checkoutKey.current` mints on first
         read and returns the same string for every retry after that, which is
         what turns a second press after a timeout into a replay instead of a
         second order. */
      { body: parsed.data, idempotencyKey: checkoutKey.current, anonymous },
      { onSuccess: (result) => void land(result) }
    );
  };

  const invalid = (key: FieldKey) => fieldErrors[key] === true;
  const payment = PAYMENTS.find((option) => option.method === paymentMethod);

  return (
    <Shell title={title}>
      <form ref={formRef} method="post" className="lq-wrap lq-pad" onSubmit={submit} noValidate>
        <header className="lq-sec">
          <h1 className="lq-phead__title">{title}</h1>
          <p className="lq-prose">
            {t(
              "الأوردر ده رايح لأكتر من محل لو اخترت من أكتر من محل. كل محل بيراجع الرف، ويجهّز، ويبعت نصّه لوحده.",
              "This order goes to more than one shop if you picked from more than one. Each shop checks its shelf, packs and sends its own half."
            )}
          </p>
        </header>

        {/* ── Where you are ───────────────────────────────────────────────
            The order screen's rail, unchanged — three stages read the same as
            three fulfilment steps and a second stepper would be a second
            vocabulary for the same idea. */}
        <ol className="lq-steps" aria-label={t("مراحل الأوردر", "Checkout stages")}>
          {STAGES.map((entry, at) => (
            <li
              key={entry.en}
              className="lq-steps__step"
              data-state={at < stage ? "done" : at === stage ? "now" : "next"}
              aria-current={at === stage ? "step" : undefined}
            >
              <i className="lq-steps__dot" aria-hidden="true" />
              <span className="lq-steps__name">{t(entry.ar, entry.en)}</span>
            </li>
          ))}
        </ol>

        {/* ── 1 · Who is ordering, on the stage that asks where it goes ───
            Guests only. A signed-in shopper already has a name, an email and
            a user row, and the API refuses a `guest` block alongside a
            session — asking again would be a form field whose only effect is
            a 400. */}
        {stage === 0 && anonymous ? (
          <section className="lq-sec" aria-label={t("مين بيطلب", "Who is ordering")}>
            <hr className="lq-rule" />
            <h2 className="lq-sec__title">{t("مين بيطلب", "Who is ordering")}</h2>
            <p className="lq-hint">
              {t(
                "من غير حساب. بنستخدم الإيميل عشان نبعتلك رقم الأوردر، والموبايل عشان تفتحه بيه بعد كده.",
                "No account. The email carries your order number, and the phone is how you open the order later."
              )}
            </p>

            <div className="lq-vp">
              <Field
                label={t("الاسم", "First name")}
                value={firstName}
                onChange={setFirstName}
                invalid={invalid("firstName")}
                error={t("اكتب اسمك.", "Enter your first name.")}
                autoComplete="given-name"
              />
              <Field
                label={t("اسم العيلة", "Last name")}
                optional={t("اختياري", "optional")}
                value={lastName}
                onChange={setLastName}
                autoComplete="family-name"
              />
              <Field
                label={t("الإيميل", "Email")}
                value={email}
                onChange={setEmail}
                invalid={invalid("email")}
                error={t(
                  "اكتب إيميل صح — رقم الأوردر بيروح عليه.",
                  "Enter a working email — the order number is sent to it."
                )}
                type="email"
                inputMode="email"
                autoComplete="email"
                dir="ltr"
              />
              <Field
                label={t("رقم الموبايل", "Phone number")}
                value={guestPhone}
                onChange={setGuestPhone}
                invalid={invalid("guestPhone")}
                error={t("اكتب رقم موبايل — 11 رقم.", "Enter a mobile number — 11 digits.")}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                numeric
                placeholder="01000000000"
              />
            </div>
          </section>
        ) : null}

        {/* ── 1 · Where it goes ───────────────────────────────────────────── */}
        {stage === 0 ? (
          <section className="lq-sec" aria-label={t("التوصيل لفين", "Where it goes")}>
            <hr className="lq-rule" />
            <h2 className="lq-sec__title">{t("التوصيل لفين", "Where it goes")}</h2>
            <p className="lq-hint">
              {t(
                "المندوب بيقرا العنوان ده. الاسم والرقم ممكن يكونوا لحد تاني هو اللي هيستلم.",
                "The rider reads this. The name and number can belong to whoever is receiving."
              )}
            </p>

            <div className="lq-vp">
              <Field
                label={t("اسم اللي هيستلم", "Name of whoever receives it")}
                value={fullName}
                onChange={setFullName}
                invalid={invalid("fullName")}
                error={t("اكتب اسم اللي هيستلم.", "Enter the name of whoever receives it.")}
                autoComplete="name"
              />
              <Field
                label={t("رقم الموبايل للمندوب", "Phone for the rider")}
                value={phone}
                onChange={setPhone}
                invalid={invalid("phone")}
                error={t("اكتب رقم موبايل — 11 رقم.", "Enter a mobile number — 11 digits.")}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                numeric
                placeholder="01000000000"
                /* True only for a signed-in shopper. For a guest the API keys the
                   lookup to THEIR number (see `land`), and the guest section
                   above already says so — this claim would contradict it. */
                hint={
                  anonymous
                    ? undefined
                    : t(
                        "ده كمان الرقم اللي بتفتح بيه الأوردر بعد كده.",
                        "This is also the number that opens the order later."
                      )
                }
              />

              <GovernorateSelect
                value={governorate}
                locale={locale}
                invalid={invalid("governorate")}
                onChange={(next) => {
                  setGovernorate(next);
                  setFieldErrors((previous) => ({ ...previous, governorate: undefined }));
                }}
              />

              <Field
                label={t("المدينة أو المنطقة", "City or district")}
                value={city}
                onChange={setCity}
                invalid={invalid("city")}
                error={t("اكتب المنطقة.", "Enter the district.")}
                autoComplete="address-level2"
              />
              <Field
                label={t("الشارع والرقم", "Street and number")}
                value={street}
                onChange={setStreet}
                invalid={invalid("street")}
                error={t("اكتب الشارع والرقم.", "Enter the street and number.")}
                autoComplete="street-address"
              />
              <Field
                label={t("العمارة والدور", "Building and floor")}
                optional={t("اختياري", "optional")}
                value={building}
                onChange={setBuilding}
              />
              <Field
                label={t("ملاحظات للمندوب", "Notes for the rider")}
                optional={t("اختياري", "optional")}
                value={notes}
                onChange={setNotes}
                hint={t(
                  "علامة مميزة، أو ميعاد يعدّي فيه.",
                  "A landmark, or a time to come."
                )}
              />
            </div>
          </section>
        ) : null}

        {/* ── 2 · The shops ───────────────────────────────────────────────
            ONE DELIVERY DECISION, ABOVE THE CARDS AND NEVER INSIDE ONE.
            `cartSummarySchema.deliveryMethod` is a single field and
            `availableDeliveryMethods` is the intersection across every shop
            present, because the basket ships as one decision — a picker per
            card would be three controls writing to one column.

            It is written to the CART rather than to the order —
            `PUT /v1/cart/delivery-method`, the same call the bag makes with the
            same component. It is here as well as there because a shopper can
            reach this screen with none chosen, and the API reads it off the
            cart at create time. */}
        {stage === 1 ? (
          <section className="lq-sec" aria-label={t("المحلات", "The shops")}>
            <hr className="lq-rule" />
            <h2 className="lq-sec__title">{t("المحلات", "The shops")}</h2>
            <p className="lq-hint">
              {t(
                "إنت اللي بتحدّد مين يجيبه. loqaaal مش بتطلب المندوب عنك.",
                "You decide who brings it. Loqaaal does not book the rider for you."
              )}
            </p>

            <DeliveryPicker cart={cart} locale={locale} />

            <p className="lq-hint">
              {t(
                "الاختيار ده بيتطبق على كل محل في السلة. السلة بتمشي كقرار واحد.",
                "This one choice applies to every shop in the bag. The basket ships as one decision."
              )}
            </p>

            {invalid("delivery") ? (
              <p className="lq-hint lq-hint--error" role="alert">
                {t(
                  "اختار طريقة التوصيل الأول — مصاريف كل محل بتتحسب منها.",
                  "Pick a delivery method first — each shop's fee comes from it."
                )}
              </p>
            ) : null}

            {cart.brands.map((brand) => (
              <ShopCard
                key={brand.brandId}
                brand={brand}
                locale={locale}
                deliveryMethod={cart.deliveryMethod}
              />
            ))}
          </section>
        ) : null}

        {/* ── 3 · Payment ─────────────────────────────────────────────────── */}
        {stage === 2 ? (
          <section ref={payRef} className="lq-sec" aria-label={t("الدفع", "Payment")}>
            <hr className="lq-rule" />
            <h2 className="lq-sec__title">{t("الدفع", "Payment")}</h2>

            {cart.deliveryMethod === "RIDER_PER_BRAND" ? (
              <p className="lq-hint">
                {t(
                  "إنت طلبت المندوب بنفسك، فمفيش حد عند الباب يحصّل. اللي بيتدفع مقدّم بس هو المتاح.",
                  "You booked the rider yourself, so nobody is at the door to collect. Only the prepaid routes are open."
                )}
              </p>
            ) : null}

            <div
              role="radiogroup"
              aria-label={t("الدفع", "Payment")}
              style={{ display: "grid", gap: "var(--space-2)" }}
            >
              {PAYMENTS.map((option) => {
                const chosen = option.method === paymentMethod;
                const offered = paymentOffered(option.method, cart.deliveryMethod);
                return (
                  <button
                    key={option.method}
                    type="button"
                    role="radio"
                    aria-checked={chosen}
                    className="lq-pay"
                    disabled={busy || !offered}
                    onClick={() => setPaymentChoice(option.method)}
                  >
                    <span className="lq-pay__radio" aria-hidden="true" />
                    <span className="lq-pay__body">
                      <span className="lq-pay__title">{t(option.ar, option.en)}</span>
                      <span className="lq-pay__note">
                        {offered
                          ? t(option.arNote, option.enNote)
                          : t(
                              "مش متاحة مع مندوب إنت طلبته — مفيش حد عند الباب ياخد الفلوس.",
                              "Not available with a rider you booked — nobody is at the door to take the money."
                            )}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}

        {/* ── What the order says, in three lines ──────────────────────────
            Each one is a fact already collected, and each Edit reopens the
            stage that owns it rather than scrolling to a field. */}
        {stage === 2 ? (
          <section className="lq-sec" aria-label={t("المراجعة", "The review")}>
            <hr className="lq-rule" />
            <h2 className="lq-sec__title">{t("راجع قبل ما تطلب", "Check before you order")}</h2>

            <ReviewRow
              label={t("التوصيل لـ", "Delivering to")}
              edit={t("تعديل", "Edit")}
              onEdit={() => setStage(0)}
            >
              {values.fullName} · <span data-num>{values.phone}</span>
              <br />
              {[values.street, values.building, values.city, values.governorate]
                .filter(Boolean)
                .join(t("، ", ", "))}
            </ReviewRow>

            <ReviewRow
              label={t("طريقة التوصيل", "Delivery method")}
              edit={t("تعديل", "Edit")}
              onEdit={() => setStage(1)}
            >
              {cart.deliveryMethod ? deliveryLabel(cart.deliveryMethod, locale) : "—"}
            </ReviewRow>

            {/* Its stage is THIS stage, so its Edit moves the viewport rather
                than the stage. */}
            <ReviewRow
              label={t("الدفع", "Payment")}
              edit={t("تعديل", "Edit")}
              onEdit={() =>
                payRef.current?.scrollIntoView({ block: "start", behavior: "smooth" })
              }
            >
              {payment ? t(payment.ar, payment.en) : "—"}
            </ReviewRow>
          </section>
        ) : null}

        {/* ── The estimate, split the way the order will be ──────────────── */}
        {stage === 2 ? <Estimate cart={cart} locale={locale} blocked={blocked} /> : null}

        {/* ── What went wrong, if anything did ───────────────────────────── */}
        {stage === 2 && create.isError ? (
          <Failure error={create.error} locale={locale} />
        ) : null}

        <div className="lq-sec">
          {/* One summary beside the button, because the button is where the
              eyes are when a press does nothing — the field that refused can
              be screens above it on a phone. The per-field lines still carry
              the specifics; this only says that there ARE some. */}
          {Object.values(fieldErrors).some(Boolean) ? (
            <p className="lq-hint lq-hint--error" role="alert">
              {stage === 2
                ? t(
                    "الأوردر لسه ماتبعتش — راجع الحقول المعلّمة فوق.",
                    "The order was not sent — check the marked fields above."
                  )
                : t(
                    "راجع الحقول المعلّمة فوق عشان تكمّل.",
                    "Check the marked fields above to carry on."
                  )}
            </p>
          ) : null}

          <div className="lq-cknav">
            {stage > 0 ? (
              <button
                type="button"
                className="lq-btn lq-btn--ghost"
                onClick={() => setStage((at) => Math.max(at - 1, 0) as Stage)}
              >
                {t("رجوع", "Back")}
              </button>
            ) : null}

            {stage < 2 ? (
              <button type="submit" className="lq-btn lq-btn--primary lq-btn--lg lq-cknav__end">
                {t("كمّل", "Continue")}
              </button>
            ) : (
              /* Hidden below 720 by `.lq-cksubmit`, where the sticky bar below
                 carries the same submit against the same form. */
              <span className="lq-cksubmit lq-cknav__end">
                <button
                  type="submit"
                  className="lq-btn lq-btn--primary lq-btn--lg"
                  aria-disabled={busy || blocked.length > 0}
                >
                  {busy ? t("ثانية واحدة", "One moment") : t("اطلب", "Place the order")}
                </button>
              </span>
            )}
          </div>

          {stage === 2 ? (
            <p className="lq-prose">
              {t(
                "كل محل بيراجع الرف قبل ما يأكد نصّه. لو قطعة خلصت، بنلغيها ومش بتتحاسب عليها — وباقي الأوردر بيكمّل عادي.",
                "Each shop checks its shelf before it confirms its half. A piece that has sold out is dropped and not charged, and the rest of the order carries on."
              )}
            </p>
          ) : null}
        </div>

        {/* ── The one action, kept in reach ────────────────────────────────
            The button and the figure it commits to are three screens apart at
            390px, and a shopper should never have to scroll to find out what
            they are about to pay. Narrow containers only — above 720 the
            in-flow button is already on screen. */}
        {stage === 2 ? (
          <div className="lq-actionbar lq-ckbar">
            <div className="lq-actionbar__info">
              <span className="lq-actionbar__label">
                {t("الإجمالي التقريبي", "Estimated total")}
              </span>
              <Money
                className="lq-money"
                amount={cart.grandTotalEstimate}
                locale={locale}
                reconciled
              />
            </div>
            <button
              type="submit"
              className="lq-btn lq-btn--primary lq-btn--lg"
              aria-disabled={busy || blocked.length > 0}
            >
              {busy ? t("ثانية واحدة", "One moment") : t("اطلب", "Place the order")}
            </button>
          </div>
        ) : null}
      </form>
    </Shell>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   One shop, on the stage that is about the shops.

   EVERYTHING HERE IS ON THE WIRE. `cartBrandSchema` carries a name, lines, a
   subtotal, a minimum and this shop's fare under the chosen method — and
   nothing else. No neighbourhood, no opening hours and NO ETA: the reference
   mockup drew an ETA pill and there is no field behind it, so it is not drawn.
   ══════════════════════════════════════════════════════════════════════════ */

function ShopCard({
  brand,
  locale,
  deliveryMethod,
}: {
  brand: CartBrand;
  locale: Locale;
  deliveryMethod: DeliveryMethod | null;
}) {
  const t = (ar: string, en: string) => (locale === "ar" ? ar : en);
  const pieces = brand.items.reduce((sum, line) => sum + line.quantity, 0);

  return (
    <section className="lq-card lq-ckshop" aria-label={brand.brandName}>
      <div className="lq-ckshop__head">
        <span className="lq-sec__title" data-bidi>
          {brand.brandName}
        </span>
        <span className="lq-hint">
          <span data-num>{pieces}</span> {t("قطعة", "items")}
        </span>
      </div>

      <div className="lq-ckshop__body">
        <div className="lq-sum__row">
          <span className="lq-hint">{t("مجموع المحل", "Shop subtotal")}</span>
          <Money className="lq-money" amount={brand.subtotal} locale={locale} reconciled />
        </div>

        <div className="lq-sum__row">
          <span className="lq-hint">
            {t("توصيل المحل ده", "This shop's delivery")}
            {deliveryMethod ? ` · ${deliveryLabel(deliveryMethod, locale)}` : ""}
          </span>
          {/* Null until a method is chosen. `Money` draws the em dash; a zero
              would be a fee the shop never quoted. */}
          <Money className="lq-money" amount={brand.impliedFare} locale={locale} reconciled />
        </div>

        {!brand.minimumOrderMet ? (
          <p className="lq-hint lq-hint--error" role="alert">
            {brand.minimumOrderValue && brand.amountToMinimum
              ? t(
                  `الحد الأدنى للمحل ده ${formatPrice(brand.minimumOrderValue, locale, { decimals: true })}، وفاضل ${formatPrice(brand.amountToMinimum, locale, { decimals: true })}. ارجع للسلة عشان تزوّد أو تشيل.`,
                  `This shop's minimum is ${formatPrice(brand.minimumOrderValue, locale, { decimals: true })} and it is ${formatPrice(brand.amountToMinimum, locale, { decimals: true })} short. Go back to the bag to add or remove.`
                )
              : t(
                  "المحل ده لسه تحت الحد الأدنى، فالأوردر مش هيعدّي.",
                  "This shop is still under its minimum, so the order cannot go through."
                )}
          </p>
        ) : null}
      </div>
    </section>
  );
}


function ReviewRow({
  label,
  edit,
  onEdit,
  children,
}: {
  label: string;
  edit: string;
  onEdit: () => void;
  children: ReactNode;
}) {
  return (
    <div className="lq-ckrow">
      <span>
        <span className="lq-hint">{label}</span>
        <span className="lq-ckrow__val" data-bidi>
          {children}
        </span>
      </span>
      <button type="button" className="lq-btn lq-btn--ghost lq-btn--sm" onClick={onEdit}>
        {edit}
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   The estimate.

   PER SHOP, like the bag, and for the same reason: each shop charges its own
   delivery, so an order from two shops is charged twice and one summed
   "shipping" line would hide that until the money moved.
   ══════════════════════════════════════════════════════════════════════════ */

function Estimate({
  cart,
  locale,
  blocked,
}: {
  cart: CartSummary;
  locale: Locale;
  blocked: CartBrand[];
}) {
  const t = (ar: string, en: string) => (locale === "ar" ? ar : en);

  return (
    <section className="lq-sec" aria-label={t("الحساب", "The total")}>
      <hr className="lq-rule" />
      <h2 className="lq-sec__title">{t("الحساب", "The total")}</h2>

      <div className="lq-sum__row">
        <span className="lq-hint">
          {t("القطع", "Items")}
          {" ("}
          <span data-num>{cart.itemCount}</span>
          {")"}
        </span>
        <Money className="lq-money" amount={cart.subtotal} locale={locale} reconciled />
      </div>

      {/* One row per shop, named, so the two fees are two facts rather than
          one figure a shopper has to take apart. */}
      {cart.brands.map((brand) => (
        <div className="lq-sum__row" key={brand.brandId}>
          <span className="lq-hint" data-bidi>
            {t(`توصيل ${brand.brandName}`, `${brand.brandName} delivery`)}
          </span>
          {brand.impliedFare ? (
            <Money className="lq-money" amount={brand.impliedFare} locale={locale} reconciled />
          ) : (
            <span className="lq-hint">
              {t("بيتحدد لما تختار طريقة التوصيل", "Set when you pick a delivery method")}
            </span>
          )}
        </div>
      ))}

      <div className="lq-sum__row lq-sum__row--total">
        <span className="lq-sec__title">{t("الإجمالي التقريبي", "Estimated total")}</span>
        <Money className="lq-money" amount={cart.grandTotalEstimate} locale={locale} reconciled />
      </div>

      <p className="lq-hint">
        {t(
          "الحساب النهائي بيتعمل على السيرفر وقت ما تطلب، فالرقم ده تقديري.",
          "Everything is repriced on the server when you order, so this figure is an estimate."
        )}
      </p>

      {blocked.length > 0 ? (
        <p className="lq-hint lq-hint--error" role="alert">
          {t(
            `${blocked.map((brand) => brand.brandName).join(" و")} لسه تحت الحد الأدنى، فالأوردر مش هيكمّل. ارجع للسلة عشان تزوّد أو تشيل.`,
            `${blocked.map((brand) => brand.brandName).join(" and ")} ${blocked.length === 1 ? "is" : "are"} still under the minimum, so the order cannot go through. Go back to the bag to add or remove.`
          )}
        </p>
      ) : null}
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   Failure, written as four different things because they ARE four different
   things and only one of them is the shopper's to fix.
   ══════════════════════════════════════════════════════════════════════════ */

function Failure({ error, locale }: { error: Error; locale: Locale }) {
  const t = (ar: string, en: string) => (locale === "ar" ? ar : en);

  if (error instanceof ApiError) {
    if (error.isConflict) {
      return (
        <p className="lq-hint lq-hint--error" role="alert">
          {t(
            "حاجة في السلة اتغيّرت من ساعة ما فتحت الصفحة — قطعة خلصت أو محل قفل. افتح السلة، هتلاقي المتغيّر متعلّم.",
            "Something in your bag changed since you opened this page — a piece sold out or a shop closed. Open the bag; the change is marked there."
          )}{" "}
          <Link href="/bag" className="lq-sec__more">
            {t("افتح السلة", "Open the bag")}
          </Link>
        </p>
      );
    }

    if (error.isUnauthenticated) {
      return (
        <p className="lq-hint lq-hint--error" role="alert">
          {t(
            "الجلسة خلصت قبل ما الأوردر يتسجّل. ادخل تاني وحاجاتك هتلاقيها زي ما هي.",
            "The session ended before the order was placed. Sign in again; your bag is as you left it."
          )}
        </p>
      );
    }

    /* A 400 from a strict DTO names a field, in English, from Nest. It is
       printed as a SECOND line rather than as the message: the first line is
       ours and is readable, and the API's own words are still the fastest way
       for a shopper to tell somebody what happened. */
    return (
      <div className="lq-sec" role="alert">
        <p className="lq-hint lq-hint--error">
          {t(
            "الأوردر مامشيش. راجع البيانات فوق وجرّب تاني.",
            "The order did not go through. Check the details above and try again."
          )}
        </p>
        <p className="lq-hint" data-bidi>
          {error.message}
        </p>
      </div>
    );
  }

  /**
   * THE ONE THAT MATTERS. A transport failure means the request may have
   * reached the API and written an order whose response never came back — so
   * the shopper is told the truth, including that pressing again is safe, and
   * why. Without that sentence the rational move is to reload and order again,
   * which is the double order this whole flow is built to prevent.
   */
  return (
    <div className="lq-sec" role="alert">
      <p className="lq-hint lq-hint--error">
        {t(
          "مارجعش رد من السيرفر. يمكن الأوردر اتسجّل ويمكن لأ.",
          "The server did not answer. The order may or may not have been placed."
        )}
      </p>
      <p className="lq-prose">
        {t(
          "اضغط «اطلب» تاني. لو كان اتسجّل فعلاً، الضغطة دي هتفتحهولك — مش هتعمل أوردر تاني ومش هتتحاسب مرتين.",
          "Press Place the order again. If it was placed, that press opens it — it does not create a second order and you are not charged twice."
        )}
      </p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   Fields.
   ══════════════════════════════════════════════════════════════════════════ */

/**
 * One labelled input, with its own error line.
 *
 * The error is INSERTED rather than hidden and shown: `role="alert"` on a node
 * that arrives is announced, and a `hidden` alert is dropped from the
 * accessibility tree in between. It carries the specific failure, never a
 * generic "check your details".
 */
function Field({
  label,
  optional,
  value,
  onChange,
  invalid = false,
  error,
  hint,
  type = "text",
  inputMode,
  autoComplete,
  placeholder,
  numeric = false,
  dir,
}: {
  label: string;
  optional?: string;
  value: string;
  onChange: (next: string) => void;
  invalid?: boolean;
  error?: string;
  hint?: string;
  type?: string;
  inputMode?: "text" | "tel" | "email";
  autoComplete?: string;
  placeholder?: string;
  /** Source Code Pro and tabular — a phone number is read out, like a price. */
  numeric?: boolean;
  dir?: "ltr";
}) {
  const id = useId();
  const errorId = useId();
  const hintId = useId();

  return (
    <div className="lq-field">
      <label className="lq-label" htmlFor={id}>
        {label}
        {optional ? <span className="lq-vp__aside"> · {optional}</span> : null}
      </label>
      <input
        id={id}
        className="lq-input"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        placeholder={placeholder}
        dir={dir}
        {...(numeric ? { "data-num": true } : {})}
        aria-invalid={invalid}
        aria-describedby={invalid && error ? errorId : hint ? hintId : undefined}
      />
      {hint && !invalid ? (
        <p className="lq-hint" id={hintId}>
          {hint}
        </p>
      ) : null}
      {invalid && error ? (
        <p className="lq-hint lq-hint--error" id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/**
 * The governorate.
 *
 * NO NATIVE `<select>` ANYWHERE IN THIS SYSTEM: the OS wheel cannot be styled,
 * cannot carry a second line of Arabic, and looks like a different product on
 * every Android skin. This is the vocabulary's own trigger and listbox, the
 * same pair the search sort uses, which already carry the rotating chevron and
 * the tick.
 */
function GovernorateSelect({
  value,
  locale,
  invalid,
  onChange,
}: {
  value: string;
  locale: Locale;
  invalid: boolean;
  onChange: (next: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const t = (ar: string, en: string) => (locale === "ar" ? ar : en);
  const labelId = useId();
  const errorId = useId();

  return (
    <div className="lq-field">
      <span className="lq-label" id={labelId}>
        {t("المحافظة", "Governorate")}
      </span>

      <div className="lq-selwrap">
        <button
          type="button"
          className="lq-seltrigger"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-labelledby={labelId}
          /* NOT `aria-invalid`: the implicit `button` role does not support it,
             so a screen reader is told nothing and the linter is right to say
             so. The failure is carried by the alert below, pointed at from
             here, which is what actually gets announced. */
          aria-describedby={invalid ? errorId : undefined}
          data-placeholder={value === ""}
          onClick={() => setOpen((previous) => !previous)}
        >
          <span className="lq-seltrigger__val">
            {value === "" ? t("اختار المحافظة", "Choose a governorate") : value}
          </span>
          <span className="lq-icon lq-chev" data-icon="chevron-down" aria-hidden="true" />
        </button>

        {open ? (
          <>
            {/* Click-away. A fixed, transparent layer rather than a document
                listener, so closing cannot race the trigger's own toggle and
                reopen it on the same click. */}
            <span
              style={{ position: "fixed", inset: 0, zIndex: "var(--z-scrim)" } as CSSProperties}
              onClick={() => setOpen(false)}
              aria-hidden="true"
            />
            <div className="lq-selpanel" role="listbox" aria-labelledby={labelId}>
              {GOVERNORATES.map((entry) => {
                /* THE ARABIC NAME IS WHAT SHIPS, in both languages. It is the
                   string a rider reads off a printed address in Cairo, and the
                   API stores it verbatim — an order that says "Qalyubia" to
                   the courier is a translation nobody asked for. The English
                   sits beside it so an English reader can find the row. */
                const label = entry.ar;
                return (
                  <button
                    key={entry.en}
                    type="button"
                    role="option"
                    className="lq-selitem"
                    aria-selected={label === value}
                    onClick={() => {
                      onChange(label);
                      setOpen(false);
                    }}
                  >
                    <span data-bidi>
                      {locale === "ar" ? entry.ar : `${entry.en} · ${entry.ar}`}
                    </span>
                    <span className="lq-icon lq-selitem__tick" data-icon="check" aria-hidden="true" />
                  </button>
                );
              })}
            </div>
          </>
        ) : null}
      </div>

      {invalid ? (
        <p className="lq-hint lq-hint--error" id={errorId} role="alert">
          {t("اختار المحافظة.", "Choose a governorate.")}
        </p>
      ) : null}
    </div>
  );
}

/** The shape of the form while it arrives — never a spinner over content. */
function CheckoutSkeleton() {
  return (
    <div className="lq-sec" aria-hidden="true">
      <span className="lq-skel" style={{ blockSize: 30, inlineSize: "12rem" }} />
      {[0, 1, 2, 3, 4].map((row) => (
        <span key={row} className="lq-skel" style={{ blockSize: 44 }} />
      ))}
      <span className="lq-skel" style={{ blockSize: 52 }} />
    </div>
  );
}
