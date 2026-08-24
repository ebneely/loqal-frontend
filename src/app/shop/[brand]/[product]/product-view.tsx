"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import type {
  PublicProductDetail,
  PublicVariant,
} from "@loqal/contracts/storefront.contract";
import { useAddToBag } from "@/lib/cart";
import type { Locale } from "@/lib/locale";
import { Money, MoneyWas } from "@/components/money";
import { Garment, garmentFor } from "@/components/garment";

/**
 * The product screen.
 *
 * SHAPE: a scrolling gallery on one side and a STICKY info column on the other,
 * collapsing to one column with the buy bar pinned under the fold. The two
 * columns are a hairline pair — a 1px gap over a `--line` ground — so the
 * divider is vertical when they sit side by side and horizontal when they
 * stack, with no mirrored rule and no second markup path.
 *
 * The breakpoint is `auto-fit` + `minmax`, not a media query, because this is a
 * page file and the container-query steps live in components.css. Two 26rem
 * tracks plus the hairline need ~833px, so the columns split at roughly the
 * mockup's 900px and stack below it.
 *
 * Only this half is client code. The page around it is a server component that
 * owns the ISR cache, the metadata and the JSON-LD; shipping the description
 * through a hydration boundary would buy nothing.
 */

/** The synthetic group used when the variants carry no attributes at all. */
const SKU_KEY = "__sku";

const PDP: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 26rem), 1fr))",
  gap: "1px",
  background: "var(--line)",
  borderBlock: "var(--border-width) solid var(--line)",
};

const GALLERY: React.CSSProperties = {
  background: "var(--paper)",
  padding: "var(--space-4)",
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-3)",
};

/**
 * The cell STRETCHES and the column inside it sticks.
 *
 * Not `align-self:start` on the cell itself: the divider between the two
 * columns is the grid's `--line` ground showing through a 1px gap, so a cell
 * that stops short of the row leaves that ground painted as a slab rather than
 * as a hairline. The cell fills the row; the sticky travel happens one level in.
 */
const INFO_CELL: React.CSSProperties = {
  background: "var(--paper)",
  padding: "var(--space-6) var(--space-4)",
};

const INFO: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-4)",
  /* Sticky only has room to travel once the columns split; in the stacked
     layout the cell is exactly this element's height, so it is a no-op. */
  position: "sticky",
  insetBlockStart: "calc(var(--bar-height) + var(--space-4))",
};

const CRUMB: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: "var(--space-2)",
  paddingBlock: "var(--space-3)",
};

/* `.lq-actionbar` sets its own `--gutter-phone` inset. Bled to the column edge
   so the button lines up with the picker above it and the bar spans the whole
   column once it pins itself to the bottom of the screen. */
const BAR: React.CSSProperties = {
  marginInline: "calc(-1 * var(--space-4))",
  marginBlockStart: "var(--space-2)",
  flexDirection: "column",
  alignItems: "stretch",
  gap: "var(--space-2)",
};

/**
 * `<details>`, hairline-ruled — `.lq-disc` in the component layer. The rule, the
 * 44px summary row and the `+` that becomes a `−` all live there, so this
 * screen sets nothing but the reveal delay.
 */
function Disclosure({
  title,
  children,
  open = false,
  delayMs = 0,
}: {
  title: string;
  children: React.ReactNode;
  open?: boolean;
  delayMs?: number;
}) {
  return (
    <details
      className="lq-disc lq-rv"
      open={open}
      style={{ "--lq-d": `${delayMs}ms` } as React.CSSProperties}
    >
      <summary>{title}</summary>
      <div className="lq-disc__body">{children}</div>
    </details>
  );
}

const variantValue = (variant: PublicVariant, key: string): string | undefined =>
  key === SKU_KEY ? variant.sku : variant.attributes[key];

/**
 * The struck-through "was" price is only ever printed beside a live price it is
 * genuinely higher than — the API refuses the opposite with a 409 — so this
 * only has to guard against a value that cannot be read as a number.
 */
function discountPercent(price: string, compareAt: string | null): number | null {
  if (compareAt == null) return null;
  const now = Number(price);
  const was = Number(compareAt);
  if (!Number.isFinite(now) || !Number.isFinite(was) || was <= now) return null;
  return Math.round((1 - now / was) * 100);
}

export function ProductView({
  product,
  brandSlug,
  locale,
}: {
  product: PublicProductDetail;
  brandSlug: string;
  locale: Locale;
}) {
  const ar = locale === "ar";

  /**
   * `attributes` is a free-form `Record<string, string>` — size, colour, or
   * whatever else a shop typed. NOT a fixed taxonomy, so the groups are derived
   * from the data in first-appearance order rather than looked up in a list of
   * keys this screen decided existed.
   */
  const groups = useMemo(() => {
    const keys: string[] = [];
    for (const variant of product.variants) {
      for (const key of Object.keys(variant.attributes)) {
        if (!keys.includes(key)) keys.push(key);
      }
    }

    if (keys.length === 0) {
      // Nothing to choose between when there is one variant and no attributes.
      if (product.variants.length < 2) return [];
      return [{ key: SKU_KEY, values: product.variants.map((v) => v.sku) }];
    }

    return keys.map((key) => {
      const values: string[] = [];
      for (const variant of product.variants) {
        const value = variant.attributes[key];
        if (value != null && !values.includes(value)) values.push(value);
      }
      return { key, values };
    });
  }, [product.variants]);

  /**
   * Nothing is preselected when there is a real choice to make. A group with
   * one value is not a choice — making somebody tap "One size" to enable a
   * button is a step that exists only because the data has a shape.
   */
  const [choice, setChoice] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const group of groups) {
      if (group.values.length === 1) initial[group.key] = group.values[0];
    }
    return initial;
  });

  const addToBag = useAddToBag();

  const selected: PublicVariant | null = useMemo(() => {
    if (groups.length === 0) return product.variants[0] ?? null;
    if (groups.some((group) => choice[group.key] == null)) return null;
    return (
      product.variants.find((variant) =>
        groups.every((group) => variantValue(variant, group.key) === choice[group.key]),
      ) ?? null
    );
  }, [groups, choice, product.variants]);

  /**
   * A value is available when SOME variant carrying it, and agreeing with every
   * other choice already made, is on the shelf. Unavailable values are struck
   * through and left in place — a shopper has to see that their size exists and
   * is gone, or they conclude the shop never carried it.
   */
  const available = (key: string, value: string) =>
    product.variants.some(
      (variant) =>
        variant.inStock &&
        variantValue(variant, key) === value &&
        Object.entries(choice).every(
          ([otherKey, otherValue]) =>
            otherKey === key || variantValue(variant, otherKey) === otherValue,
        ),
    );

  const name = product.name?.[locale] ?? product.name?.ar ?? product.name?.en ?? "";
  const description = product.description?.[locale] ?? product.description?.ar ?? null;

  const price = selected?.price ?? product.priceFrom;
  const compareAt = selected?.compareAtPrice ?? null;
  const off = price ? discountPercent(price, compareAt) : null;

  const prices = new Set(product.variants.map((v) => v.price));
  const priceIsFrom = selected == null && prices.size > 1;

  const missing = groups.find((group) => choice[group.key] == null);
  const groupLabel = (key: string) =>
    key === SKU_KEY ? (ar ? "الاختيار" : "the option") : key;

  const t = {
    home: ar ? "الرئيسية" : "Home",
    shops: ar ? "المحلات" : "Shops",
    allOfShop: ar ? "كل قطع المحل" : "Everything from this shop",
    from: ar ? "من" : "from",
    add: ar ? "ضيف للسلة" : "Add to bag",
    adding: ar ? "بيتضاف…" : "Adding…",
    added: ar ? "اتضاف للسلة" : "Added to your bag",
    soldOut: ar ? "خلص من المحل" : "Gone from the shelf",
    strike: ar
      ? "اللي عليه خط خلص من المحل."
      : "Struck through means the shop is out of it.",
    noVariants: ar
      ? "المحل لسه ماحطّش مقاسات للقطعة دي. لما يحطّها، هتقدر تطلبها من هنا."
      : "The shop has not listed sizes for this piece yet. When it does, you can order it here.",
    /* Says the consequence, not the caution. */
    failed: ar
      ? "مااتضافش. المحل ممكن يكون خلص القطعة دلوقتي — جرّب تاني."
      : "It did not go in. The shop may have just run out — try again.",
    /**
     * NEVER a stock COUNT. `publicVariantSchema` carries `inStock` and nothing
     * else on purpose; the API strips `stockOnHand` before it leaves the
     * server. The shelf note is words.
     */
    shelf: ar
      ? "اللي مكتوب هنا هو آخر حاجة المحل قالها لنا. المحل بيراجع الرف قبل ما يأكد الأوردر، ولو القطعة مش موجودة بيتلغي الأوردر ومش بيتخصم منك حاجة."
      : "What you see here is the last thing the shop told us. The shop checks the shelf before it confirms the order, and if the piece is not there the order is cancelled and you are not charged.",
    noPhotos: ar
      ? "لسه مفيش صور للقطعة دي. الرسمة دي ماسكة مكانها لحد ما المحل يصوّرها على الرف."
      : "There are no photos of this piece yet. The drawing holds its place until the shop photographs it on the shelf.",
    about: ar ? "عن القطعة" : "About this piece",
    noAbout: ar
      ? "المحل لسه مابعتش وصف للقطعة دي. لو محتاج تعرف حاجة، كلّم المحل قبل ما تطلب."
      : "The shop has not written a description for this piece yet. If you need to know something, ask the shop before you order.",
    material: ar ? "الخامة والعناية" : "Material and care",
    noMaterial: ar
      ? "المحل مابعتش تفاصيل الخامة ولا الغسيل للقطعة دي. مابنكتبش حاجة المحل ماقالهاش."
      : "The shop has not sent the fabric or the washing details for this piece. We do not write anything the shop did not say.",
    delivery: ar ? "التوصيل" : "Delivery",
    deliveryBody: ar
      ? "التوصيل من المحل نفسه، مش من مخزن. جوّه القاهرة والجيزة بيوصل في نفس اليوم، وتقدر تدفع كاش لما يوصلك."
      : "Delivery comes from the shop itself, not from a warehouse. Inside Cairo and Giza it arrives the same day, and you can pay cash when it reaches you.",
    returns: ar ? "الاستبدال والاسترجاع" : "Exchanges and returns",
    returnsBody: ar
      ? "استبدال أو استرجاع خلال 14 يوم، مع نفس المحل اللي بعتلك."
      : "Exchange or return within 14 days, through the same shop that sent it.",
  };

  const buyLabel = addToBag.isPending
    ? t.adding
    : missing
      ? ar
        ? `اختار ${groupLabel(missing.key)}`
        : `Choose ${groupLabel(missing.key)}`
      : selected && !selected.inStock
        ? t.soldOut
        : t.add;

  return (
    <div className="lq-wrap">
      <nav className="lq-pad" style={CRUMB} aria-label={ar ? "مسار" : "Breadcrumb"}>
        <Link className="lq-eyebrow" href="/">
          {t.home}
        </Link>
        <span className="lq-eyebrow" aria-hidden="true">
          /
        </span>
        <Link className="lq-eyebrow" href="/shops">
          {t.shops}
        </Link>
        <span className="lq-eyebrow" aria-hidden="true">
          /
        </span>
        <Link className="lq-eyebrow" href={`/shop/${brandSlug}`} data-bidi>
          {brandSlug}
        </Link>
        <span className="lq-eyebrow" aria-hidden="true">
          /
        </span>
        <span className="lq-eyebrow" data-bidi aria-current="page">
          {name}
        </span>
      </nav>

      <div style={PDP}>
        {/* ── The gallery ───────────────────────────────────────────────────
            Every well is 3:4 with no exceptions. There is no product
            photography yet and none has been invented: with nothing to show the
            well carries the garment line art, which is the register's answer
            rather than a picture of a missing picture. */}
        <div style={GALLERY}>
          {product.mediaUrls.length > 0 ? (
            product.mediaUrls.map((url, index) => (
              <div
                key={url}
                className="lq-pcard__well lq-rv"
                style={{ "--lq-d": `${index * 70}ms` } as React.CSSProperties}
              >
                <Image
                  src={url}
                  alt={name}
                  fill
                  sizes="(min-width: 900px) 45vw, 100vw"
                  // The first photo is the LCP on this screen.
                  priority={index === 0}
                />
              </div>
            ))
          ) : (
            <>
              <div className="lq-pcard__well lq-rv">
                <Garment className="lq-garment" kind={garmentFor(product.id)} />
              </div>
              {/* Say what is absent and why. A missing thing explained is a
                  feature; a blank frame is a bug report. */}
              <p className="lq-hint" style={{ maxInlineSize: "48ch" }}>
                {t.noPhotos}
              </p>
            </>
          )}
        </div>

        {/* ── The info column ───────────────────────────────────────────── */}
        <div style={INFO_CELL}>
          <div style={INFO}>
            {/* The shop is a link, not a label: a shopper who likes the garment
              wants the rest of the rail. */}
            <Link
              className="lq-eyebrow lq-rv"
              href={`/shop/${brandSlug}`}
              data-bidi
              style={{ "--lq-d": "0ms" } as React.CSSProperties}
            >
              {brandSlug}
            </Link>

            <h1
              className="lq-phead__title lq-rv"
              data-bidi
              style={{ "--lq-d": "70ms" } as React.CSSProperties}
            >
              {name}
            </h1>

            <div
              className="lq-rv"
              style={
                {
                  display: "flex",
                  alignItems: "baseline",
                  flexWrap: "wrap",
                  gap: "var(--space-3)",
                  fontSize: "var(--text-xl)",
                  "--lq-d": "140ms",
                } as React.CSSProperties
              }
            >
              {priceIsFrom ? <span className="lq-hint">{t.from}</span> : null}
              {/* A shelf price, so `reconciled` stays off and it carries no
                decimals. Latin numerals in both languages, and the currency
                mark trails the figure in Arabic — all of that lives in `Money`.

                The live figure takes `.lq-money--sale` when the price genuinely
                dropped — red means exactly two things in this system and a price
                that dropped is one of them. The strike and the badge carry the
                same drop in words, so colour is never the only carrier. */}
              <Money
                className={off != null ? "lq-money lq-money--sale" : "lq-money"}
                amount={price}
                locale={locale}
              />
              <MoneyWas amount={compareAt} locale={locale} />
              {/* Red means a price that dropped, and the badge carries the word —
                colour and a strike-through are never the only carriers. */}
              {off != null ? (
                <span className="lq-badge lq-badge--sale" data-bidi>
                  {ar ? `خصم ${off}%` : `${off}% off`}
                </span>
              ) : null}
            </div>

            <hr className="lq-rule" />

            {/* ── The picker ─────────────────────────────────────────────────
              One group per attribute key the data actually carries. */}
            {product.variants.length === 0 ? (
              <p className="lq-hint">{t.noVariants}</p>
            ) : (
              groups.map((group, index) => (
                <div
                  key={group.key}
                  className="lq-vp lq-rv"
                  style={{ "--lq-d": `${210 + index * 70}ms` } as React.CSSProperties}
                >
                  <div className="lq-vp__head">
                    <span className="lq-vp__label" data-bidi>
                      {groupLabel(group.key)}
                      {choice[group.key] ? ` — ${choice[group.key]}` : ""}
                    </span>
                    {group.values.some((value) => !available(group.key, value)) ? (
                      <span className="lq-vp__aside">{t.strike}</span>
                    ) : null}
                  </div>

                  <div className="lq-vp__row">
                    {group.values.map((value) => {
                      const inStock = available(group.key, value);
                      return (
                        <button
                          key={value}
                          type="button"
                          className="lq-chip"
                          data-bidi
                          /* Struck through by `.lq-chip[data-out]`, and STILL ON
                           THE SCREEN. Hiding it tells the shopper the shop never
                           carried their size. */
                          data-out={inStock ? undefined : "true"}
                          aria-pressed={choice[group.key] === value}
                          aria-disabled={inStock ? undefined : true}
                          aria-label={inStock ? undefined : `${value} — ${t.soldOut}`}
                          onClick={() => {
                            if (!inStock) return;
                            setChoice((current) => ({
                              ...current,
                              [group.key]: value,
                            }));
                          }}
                        >
                          {value}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )}

            {/* ── The one action of the screen ──────────────────────────────
              `.lq-actionbar` is sticky to the block end, so it pins itself
              above the fold while the info column is still running and sits in
              flow once the column ends. One element, both widths. */}
            <div className="lq-actionbar" style={BAR}>
              <button
                type="button"
                className="lq-btn lq-btn--primary lq-btn--lg lq-btn--block"
                disabled={!selected || !selected.inStock || addToBag.isPending}
                onClick={() => {
                  if (!selected) return;
                  addToBag.mutate({ variantId: selected.id, quantity: 1 });
                }}
              >
                {buyLabel}
              </button>

              {addToBag.isError ? (
                <p className="lq-hint lq-hint--error" role="alert">
                  {t.failed}
                </p>
              ) : addToBag.isSuccess ? (
                <p className="lq-hint" role="status">
                  {t.added}
                </p>
              ) : null}
            </div>

            {/*
            NEVER CLAIM STOCK WE DO NOT OWN, and never print a count.
            `publicVariantSchema` carries `inStock` and nothing else — the API
            strips `stockOnHand` before it leaves the server — so the shelf note
            is words. Visible, not folded into a disclosure: this is the sentence
            that explains the wait between placing and confirming, and a shopper
            who reads it after the wait has read it too late.
          */}
            <p className="lq-hint" style={{ maxInlineSize: "56ch" }}>
              {t.shelf}
            </p>

            <Disclosure title={t.about} open={Boolean(description)} delayMs={0}>
              <span data-bidi>{description ?? t.noAbout}</span>
            </Disclosure>

            {/* No fabric and no care instructions exist in `publicProductDetail`.
              Saying so is the register; inventing "70% merino" is the one thing
              PRODUCT.md rules out outright. */}
            <Disclosure title={t.material} delayMs={70}>
              {t.noMaterial}
            </Disclosure>

            <Disclosure title={t.delivery} delayMs={140}>
              {t.deliveryBody}
            </Disclosure>

            <Disclosure title={t.returns} delayMs={210}>
              {t.returnsBody}
            </Disclosure>

            <Link className="lq-eyebrow" href={`/shop/${brandSlug}`}>
              {t.allOfShop}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
