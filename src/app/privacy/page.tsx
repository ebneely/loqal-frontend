/*
 * DRAFT FOR LEGAL REVIEW (2026-11-16). Written from what the product does
 * today, not from a template; a lawyer has not read it yet. Do not add claims
 * here the code does not back (retention periods, processors not in use).
 */
import type { Metadata } from "next";

import { getLocale } from "@/lib/locale-server";
import { LegalPage, type LegalSection } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "سياسة الخصوصية",
  alternates: { canonical: "/privacy", languages: { ar: "/privacy", en: "/privacy?lang=en" } },
};

const AR: LegalSection[] = [
  {
    title: "ما الذي نجمعه عند الطلب",
    body: [
      "حين تطلب نأخذ ما يلزم لتوصيل الطلب فقط: اسمك، ورقم هاتفك، وبريدك الإلكتروني، وعنوان التوصيل، وما تطلبه من قطع.",
      "لا يلزمك حساب. الطلب دون حساب يُفتح برقمه ورقم الهاتف الذي طلبت به، وهذان معًا هما ما يثبت أن الطلب طلبك.",
    ],
  },
  {
    title: "من يرى بياناتك",
    body: [
      "المتجر الذي اشتريت منه يرى اسمك ورقم هاتفك وعنوانك وقطع طلبه، لأنه هو من يجهّز الطلب ويرسله إليك بنفسه. إذا اشتريت من أكثر من متجر، يرى كل متجر الجزء الخاص به فقط.",
      "لا نبيع بياناتك، ولا نعطيها لمتجر لم تشترِ منه.",
    ],
  },
  {
    title: "الدفع",
    body: [
      "الدفع بالبطاقة أو عبر فاليو يتم في صفحة Paymob، شركة الدفع التي نتعامل معها. تكتب بيانات بطاقتك هناك، ولا تصل إلينا ولا إلى المتجر.",
      "في الدفع نقدًا عند الاستلام أو بالمحفظة أو إنستاباي لا نجمع أي بيانات دفع.",
    ],
  },
  {
    title: "رسائل الهاتف والبريد",
    body: [
      "نرسل رموز التحقق على واتساب، ونرسل الرمز برسالة نصية إذا لم يصل واتساب. نستخدم الرمز لتأكيد طلبات الدفع عند الاستلام ولتسجيل الدخول.",
      "قد نرسل إليك على واتساب أو بالبريد رسائل عن حالة طلبك، مثل تأكيده أو توصيله أو إلغائه. لا نرسل إعلانات على رقمك.",
    ],
  },
  {
    title: "ملفات تعريف الارتباط وما يُحفظ في متصفحك",
    body: [
      "نستخدم ملفين من ملفات تعريف الارتباط: ملف الجلسة الذي يبقيك مسجّل الدخول، وملف اللغة الذي يتذكر اختيارك بين العربية والإنجليزية.",
      "ونحفظ في متصفحك معرّف ضيف عشوائيًا تُربط به سلتك قبل تسجيل الدخول. ويبقى في متصفحك وحده: مكان التوصيل الذي تختاره، وآخر عمليات البحث، والمفضلة قبل تسجيل الدخول. لا يُرسل مكان التوصيل إلى خوادمنا.",
    ],
  },
  {
    title: "إحصاءات الزيارات",
    body: [
      "نعدّ مشاهدات القطع والمتاجر وعمليات البحث والإضافة إلى السلة لنعرف ما يبحث عنه الناس. لا نستخدم لذلك ملفات تعريف ارتباط، ولا نحفظ عنوان IP: نحوّله إلى المحافظة ثم نتركه، ومعرّف الزائر رمز يتغيّر كل يوم ولا يمكن الرجوع منه إليك.",
      "إذا فعّلت في متصفحك خيار «عدم التتبّع» أو «التحكم العام في الخصوصية» فلا نرسل هذه الإحصاءات أصلًا.",
    ],
  },
  {
    title: "التقييمات",
    body: [
      "إذا قيّمت متجرًا بعد استلام طلبك، يُنشر التقييم والتعليق في صفحة المتجر دون اسمك أو رقمك.",
    ],
  },
  {
    title: "حقوقك والتواصل معنا",
    body: [
      "لتعرف ما نحتفظ به عنك، أو لتصحيحه، أو لطلب حذف حسابك، راسلنا على واتساب +20 155 995 9890. نحتفظ بسجلات الطلبات التي يلزمنا القانون بالاحتفاظ بها للمحاسبة.",
    ],
  },
];

const EN: LegalSection[] = [
  {
    title: "What we collect when you order",
    body: [
      "When you order we take only what delivery needs: your name, phone number, email, delivery address, and the pieces you ordered.",
      "You do not need an account. An order placed without one opens with its number and the phone you ordered with; together they prove the order is yours.",
    ],
  },
  {
    title: "Who sees your details",
    body: [
      "The shop you bought from sees your name, phone, address and the pieces in its part of the order, because the shop packs it and sends it to you itself. If you bought from more than one shop, each shop sees its own part only.",
      "We do not sell your details, and we do not give them to a shop you did not buy from.",
    ],
  },
  {
    title: "Payment",
    body: [
      "Card and Valu payments happen on the page of Paymob, our payment company. You type your card details there; they never reach us or the shop.",
      "Cash on delivery, wallet and InstaPay payments involve no payment details on our side.",
    ],
  },
  {
    title: "Messages to your phone and email",
    body: [
      "We send verification codes on WhatsApp, and by text message if WhatsApp does not reach you. A code confirms a cash-on-delivery order and signs you in.",
      "We may message you on WhatsApp or by email about your order's status, such as confirmed, delivered or cancelled. We do not send advertising to your number.",
    ],
  },
  {
    title: "Cookies and what your browser keeps",
    body: [
      "We use two cookies: the session cookie that keeps you signed in, and the language cookie that remembers Arabic or English.",
      "Your browser also keeps a random guest id that your bag is tied to before you sign in. These stay in your browser only: the delivery place you choose, your recent searches, and your saved items before you sign in. The delivery place is never sent to our servers.",
    ],
  },
  {
    title: "Visit statistics",
    body: [
      "We count views of pieces and shops, searches and additions to the bag, to learn what people look for. No cookie is used for this and your IP address is not stored: it is turned into a governorate and dropped, and the visitor id is a code that changes daily and cannot be traced back to you.",
      "If your browser has Do Not Track or Global Privacy Control turned on, these statistics are not sent at all.",
    ],
  },
  {
    title: "Ratings",
    body: [
      "If you rate a shop after your order arrives, the rating and comment appear on the shop's page without your name or number.",
    ],
  },
  {
    title: "Your rights, and contacting us",
    body: [
      "To find out what we hold about you, correct it, or ask for your account to be deleted, message us on WhatsApp at +20 155 995 9890. We keep the order records the law requires us to keep for accounting.",
    ],
  },
];

export default async function PrivacyPage() {
  const locale = await getLocale();
  const ar = locale === "ar";
  return (
    <LegalPage
      title={ar ? "سياسة الخصوصية" : "Privacy policy"}
      lede={
        ar
          ? "ما نعرفه عنك، ولماذا، ومن يراه. بكلام واضح، كما يعمل الموقع فعلًا."
          : "What we know about you, why, and who sees it. In plain words, as the site actually works."
      }
      updated={ar ? "آخر تحديث: 16 نوفمبر 2026" : "Last updated: 16 November 2026"}
      sections={ar ? AR : EN}
    />
  );
}
