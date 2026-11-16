/*
 * DRAFT FOR LEGAL REVIEW (2026-11-16). Written from what the product does
 * today; a lawyer has not read it yet. The governing-law line and the
 * liability wording in particular need their sign-off.
 */
import type { Metadata } from "next";

import { getLocale } from "@/lib/locale-server";
import { LegalPage, type LegalSection } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "شروط الاستخدام",
  alternates: { canonical: "/terms", languages: { ar: "/terms", en: "/terms?lang=en" } },
};

const AR: LegalSection[] = [
  {
    title: "من نحن، ومن يبيعك",
    body: [
      "loqaaal سوق إلكتروني لمتاجر الملابس في الأحياء. نعرض قطع المتاجر ونستقبل طلبك ونوصله إلى المتجر. البائع هو المتجر نفسه: هو من يملك القطعة ويجهّزها ويرسلها.",
    ],
  },
  {
    title: "المتوفر والأسعار",
    body: [
      "ما تراه من توفّر هو آخر ما أبلغنا به المتجر. يراجع المتجر رفّه قبل تأكيد الطلب، فإن لم تكن القطعة موجودة أُلغي ذلك الجزء من الطلب دون أن تدفع ثمنه.",
      "الأسعار بالجنيه المصري. السعر المشطوب هو السعر الذي حدّده المتجر قبل التخفيض.",
    ],
  },
  {
    title: "التوصيل",
    body: [
      "يرسل كل متجر جزءه من الطلب بنفسه، برسوم توصيل خاصة به وحالة خاصة به. إذا اشتريت من أكثر من متجر فقد تصل القطع في أوقات مختلفة. مدة التوصيل المعروضة لكل متجر تقدير يعطيه المتجر، لا موعد مضمون.",
    ],
  },
  {
    title: "الدفع",
    body: [
      "تدفع نقدًا عند الاستلام، أو بالبطاقة أو عبر فاليو في صفحة Paymob، أو بالمحفظة أو إنستاباي. يُطلب منك تأكيد طلب الدفع عند الاستلام برمز يصل إلى هاتفك.",
    ],
  },
  {
    title: "الاستبدال والاسترجاع",
    body: [
      "يتم الاستبدال والاسترجاع مع المتجر الذي باعك القطعة، خلال المدة التي يعلنها المتجر في صفحته، وعلى أن تكون القطعة بالحالة التي وصلت بها. تطلب الاسترجاع من صفحة الطلب.",
    ],
  },
  {
    title: "الحساب",
    body: [
      "يمكنك الطلب دون حساب. إذا أنشأت حسابًا تدخل إليه برمز يصل إلى هاتفك أو بريدك، وأنت مسؤول عن الهاتف والبريد اللذين تدخل بهما.",
    ],
  },
  {
    title: "التقييمات",
    body: [
      "يمكنك تقييم كل جزء من طلبك مرة واحدة بعد استلامه. يُنشر التقييم في صفحة المتجر، ويستطيع المتجر الرد عليه. قد نخفي تقييمًا فيه إساءة أو بيانات شخصية أو كلام لا علاقة له بالطلب، ونحتفظ بسبب الإخفاء.",
    ],
  },
  {
    title: "حدود مسؤوليتنا",
    body: [
      "المتجر مسؤول عن القطعة ووصفها وجودتها وتوصيلها. نحن مسؤولون عن عمل الموقع وعن إيصال طلبك إلى المتجر كما كتبته. إن حدثت مشكلة في طلب فراسلنا، ونتواصل نحن مع المتجر.",
    ],
  },
  {
    title: "القانون والتواصل",
    body: [
      "تخضع هذه الشروط لقوانين جمهورية مصر العربية. للتواصل معنا: واتساب +20 155 995 9890.",
    ],
  },
];

const EN: LegalSection[] = [
  {
    title: "Who we are, and who sells to you",
    body: [
      "loqaaal is an online marketplace for neighbourhood clothing shops. We show the shops' pieces, take your order and pass it to the shop. The seller is the shop itself: it owns the piece, packs it and sends it.",
    ],
  },
  {
    title: "What is in stock, and prices",
    body: [
      "Availability is the last thing the shop told us. The shop checks its shelf before confirming the order; if the piece is not there, that part of the order is cancelled and you do not pay for it.",
      "Prices are in Egyptian pounds. A struck-through price is the shop's own price before the reduction.",
    ],
  },
  {
    title: "Delivery",
    body: [
      "Each shop sends its own part of the order, with its own delivery fee and its own status. If you bought from more than one shop, pieces may arrive at different times. The delivery time shown for a shop is the shop's own estimate, not a guaranteed time.",
    ],
  },
  {
    title: "Payment",
    body: [
      "You pay cash on delivery, by card or Valu on Paymob's page, or by wallet or InstaPay. A cash-on-delivery order is confirmed with a code sent to your phone.",
    ],
  },
  {
    title: "Exchanges and returns",
    body: [
      "Exchanges and returns go through the shop that sold you the piece, within the period the shop states on its page, with the piece in the state it arrived in. You request a return from the order page.",
    ],
  },
  {
    title: "Your account",
    body: [
      "You can order without an account. If you create one, you sign in with a code sent to your phone or email, and you are responsible for the phone and email you sign in with.",
    ],
  },
  {
    title: "Ratings",
    body: [
      "You can rate each part of your order once, after it arrives. The rating appears on the shop's page and the shop can reply. We may hide a rating that is abusive, carries personal details, or is not about the order, and we keep the reason.",
    ],
  },
  {
    title: "What we are responsible for",
    body: [
      "The shop is responsible for the piece, its description, its quality and its delivery. We are responsible for the site working and for passing your order to the shop as you wrote it. If something goes wrong with an order, message us and we take it up with the shop.",
    ],
  },
  {
    title: "Law and contact",
    body: [
      "These terms are governed by the laws of the Arab Republic of Egypt. To reach us: WhatsApp +20 155 995 9890.",
    ],
  },
];

export default async function TermsPage() {
  const locale = await getLocale();
  const ar = locale === "ar";
  return (
    <LegalPage
      title={ar ? "شروط الاستخدام" : "Terms of use"}
      lede={
        ar
          ? "كيف يعمل الشراء من متاجر loqaaal، ومن المسؤول عن ماذا."
          : "How buying from loqaaal's shops works, and who is responsible for what."
      }
      updated={ar ? "آخر تحديث: 16 نوفمبر 2026" : "Last updated: 16 November 2026"}
      sections={ar ? AR : EN}
    />
  );
}
