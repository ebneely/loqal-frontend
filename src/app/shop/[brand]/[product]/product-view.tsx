"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import type {
  PublicProductDetail,
  PublicVariant,
} from "@loqal/contracts/storefront.contract";
import { attributeName } from "@/lib/attribute-names";
import { useAddToBag } from "@/lib/cart";
import type { Locale } from "@/lib/locale";
import { Money, MoneyWas } from "@/components/money";
import { Garment, garmentFor } from "@/components/garment";
import { ProductPhoto } from "@/components/product-photo";
import { FavButton } from "@/components/fav-button";
import { track } from "@/lib/analytics";

/**
 * The product screen.
 *
 * SHAPE: a gallery (one large 4:5 well and a row of thumbnails) beside a STICKY
 * info column, collapsing to one column with the gallery full-bleed and the buy
 * bar pinned under the fold. The layout lives in pages-product.css, behind a
 * container query on `.lq-shell`.
 *
 * Only this half is client code. The page around it is a server component that
 * owns the metadata and the JSON-LD; shipping the description through a
 * hydration boundary would buy nothing.
 *
 * NOT HERE: "المتبقي 2 فقط" from the approved sample. `publicVariantSchema`
 * carries `inStock` and no count — the API strips `stockOnHand` on purpose —
 * so the size row can say a size is gone, never how many are left. And the
 * sample's "من {shop} أيضًا" grid: this route does not load the shop's other
 * pieces, so the link to the whole shop stands in for it.
 */

/** The synthetic group used when the variants carry no attributes at all. */
const SKU_KEY = "__sku";

/**
 * `<details>`, hairline-ruled — `.lq-disc` in pages-product.css. The rule, the
 * summary row and the + that turns into an × all live there.
 */
function Disclosure({
  title,
  children,
  open = false,
}: {
  title: string;
  children: React.ReactNode;
  open?: boolean;
}) {
  return (
    <details className="lq-disc" open={open}>
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
  brandName,
  locale,
}: {
  product: PublicProductDetail;
  /** The shop's address, for links only. */
  brandSlug: string;
  /** The shop's name, for everything a shopper reads. */
  brandName: string;
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

  /** Which photo the large well shows. */
  const [photo, setPhoto] = useState(0);

  useEffect(() => {
    track({ type: "PRODUCT_VIEW", productId: product.id });
  }, [product.id]);

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
  /**
   * The heading over a group and the button while it is unchosen. A real key
   * goes through `attributeName`, which translates the known ones and
   * title-cases the rest. The synthetic SKU group has no key a shop wrote, so
   * it is named here.
   */
  const groupName = (key: string) =>
    key === SKU_KEY
      ? ar
        ? { label: "الخيار", choose: "اختر الخيار" }
        : { label: "Option", choose: "Choose an option" }
      : attributeName(key, locale);

  const t = {
    home: ar ? "الرئيسية" : "Home",
    shops: ar ? "المتاجر" : "Shops",
    allOfShop: ar ? "كل قطع المتجر" : "Everything from this shop",
    from: ar ? "يبدأ من" : "from",
    add: ar ? "أضف إلى السلة" : "Add to bag",
    adding: ar ? "جارٍ الإضافة…" : "Adding…",
    added: ar ? "أُضيفت القطعة إلى السلة." : "Added to your bag.",
    soldOut: ar ? "نفد من المتجر" : "Gone from the shelf",
    strike: ar ? "المشطوب نفد من المتجر" : "Struck through means the shop is out of it",
    noVariants: ar
      ? "لم يُضف المتجر مقاسات لهذه القطعة بعد. حين يضيفها، يمكنك طلبها من هنا."
      : "The shop has not listed sizes for this piece yet. When it does, you can order it here.",
    /* Says the consequence, not the caution. */
    failed: ar
      ? "لم تُضف القطعة. ربما نفدت من المتجر للتو، فحاول مرة أخرى."
      : "It did not go in. The shop may have just run out — try again.",
    /**
     * NEVER a stock COUNT. `publicVariantSchema` carries `inStock` and nothing
     * else on purpose; the API strips `stockOnHand` before it leaves the
     * server. The shelf note is words.
     */
    shelf: ar
      ? "ما تراه هنا هو آخر ما أبلغنا به المتجر. يراجع المتجر الرف قبل تأكيد الطلب، وإذا لم تتوفر القطعة يُلغى الطلب دون أي خصم."
      : "What you see here is the last thing the shop told us. The shop checks the shelf before it confirms the order, and if the piece is not there the order is cancelled and you are not charged.",
    noPhotos: ar
      ? "لا توجد صور لهذه القطعة بعد. يحفظ هذا الرسم مكانها حتى يصوّرها المتجر على الرف."
      : "There are no photos of this piece yet. The drawing holds its place until the shop photographs it on the shelf.",
    photoN: (n: number) => (ar ? `الصورة ${n}` : `Photo ${n}`),
    about: ar ? "عن القطعة" : "About this piece",
    noAbout: ar
      ? "لم يكتب المتجر وصفًا لهذه القطعة بعد. إن احتجت إلى معرفة شيء، فاسأل المتجر قبل الطلب."
      : "The shop has not written a description for this piece yet. If you need to know something, ask the shop before you order.",
    material: ar ? "الخامة والعناية" : "Material and care",
    noMaterial: ar
      ? "لم يرسل المتجر تفاصيل الخامة أو الغسيل لهذه القطعة، ولا نكتب شيئًا لم يقله المتجر."
      : "The shop has not sent the fabric or the washing details for this piece. We do not write anything the shop did not say.",
    delivery: ar ? "التوصيل" : "Delivery",
    deliveryBody: ar
      ? "يأتي التوصيل من المتجر نفسه لا من مستودع. داخل القاهرة والجيزة يصل الطلب في اليوم نفسه، ويمكنك الدفع نقدًا عند الاستلام."
      : "Delivery comes from the shop itself, not from a warehouse. Inside Cairo and Giza it arrives the same day, and you can pay cash when it reaches you.",
    returns: ar ? "الاستبدال والاسترجاع" : "Exchanges and returns",
    returnsBody: ar
      ? "استبدال أو استرجاع خلال 14 يومًا، مع المتجر نفسه الذي أرسل إليك القطعة."
      : "Exchange or return within 14 days, through the same shop that sent it.",
  };

  const buyLabel = addToBag.isPending
    ? t.adding
    : missing
      ? groupName(missing.key).choose
      : selected && !selected.inStock
        ? t.soldOut
        : t.add;

  const photos = product.mediaUrls;
  const shown = photos[photo] ?? photos[0];

  return (
    <div className="lq-wrap">
      <nav className="lq-pcrumb" aria-label={ar ? "مسار التصفح" : "Breadcrumb"}>
        <Link href="/">{t.home}</Link>
        <span>
          <Link href="/shops">{t.shops}</Link>
        </span>
        <span>
          <Link href={`/shop/${brandSlug}`} data-bidi>
            {brandName}
          </Link>
        </span>
      </nav>

      <section className="lq-pdp">
        {/* ── The gallery ─────────────────────────────────────────────────
            With no photography the well carries the garment line art, drawn
            large in the raised well — the register's answer rather than a
            picture of a missing picture. */}
        <div className="lq-pdp__gallery">
          <div className="lq-pdp__main">
            {shown ? (
              /* `ProductPhoto`, not a bare `next/image`: with no configured
                 media host or a file that fails to load it degrades to the
                 garment drawing, instead of throwing the page down. Keyed so a
                 failed photo does not keep the next one on the fallback. */
              <ProductPhoto
                key={shown}
                src={shown}
                alt={name}
                productId={product.id}
                sizes="(min-width: 900px) 55vw, 100vw"
                // The large photo is the LCP on this screen.
                priority
              />
            ) : (
              <Garment className="lq-garment" kind={garmentFor(product.id)} />
            )}
          </div>

          {photos.length > 1 ? (
            <div className="lq-pdp__thumbs">
              {photos.map((url, index) => (
                <button
                  key={url}
                  type="button"
                  aria-pressed={index === photo}
                  aria-label={t.photoN(index + 1)}
                  onClick={() => setPhoto(index)}
                >
                  <ProductPhoto src={url} alt="" productId={product.id} sizes="84px" />
                </button>
              ))}
            </div>
          ) : null}

          {/* Say what is absent and why. A missing thing explained is a
              feature; a blank frame is a bug report. */}
          {photos.length === 0 ? <p className="lq-pdp__nophoto">{t.noPhotos}</p> : null}
        </div>

        {/* ── The info column ─────────────────────────────────────────── */}
        <div className="lq-pdp__info">
          {/* The shop is a link, not a label: a shopper who likes the garment
              wants the rest of the rail. */}
          <Link className="lq-pdp__shop" href={`/shop/${brandSlug}`} data-bidi>
            {brandName}
          </Link>

          <div className="lq-pdp__titlerow">
            <h1 className="lq-pdp__name" data-bidi>
              {name}
            </h1>
            <FavButton
              label={name}
              target={{
                kind: "product",
                item: { id: product.id, slug: product.slug, brandSlug, brandName, name: product.name },
              }}
            />
          </div>

          <p className="lq-pdp__price">
            {priceIsFrom ? <span className="lq-pdp__from">{t.from}</span> : null}
            {/* The struck "was" figure first, then the live one — red only when
                the price genuinely dropped, one of the two things red means.
                The badge carries the same drop in words, so neither colour nor
                the strike is the only carrier. */}
            <MoneyWas amount={compareAt} locale={locale} />
            <Money
              className={off != null ? "lq-money lq-money--drop" : "lq-money"}
              amount={price}
              locale={locale}
            />
            {off != null ? (
              <span className="lq-badge lq-badge--drop" data-bidi>
                {ar ? `خصم ${off}%` : `${off}% off`}
              </span>
            ) : null}
          </p>

          {/* ── The picker ─────────────────────────────────────────────────
              One group per attribute key the data actually carries. */}
          {product.variants.length === 0 ? (
            <p className="lq-pdp__note">{t.noVariants}</p>
          ) : (
            groups.map((group) => (
              <div key={group.key} className="lq-vp">
                <div className="lq-vp__head">
                  <span className="lq-vp__label" data-bidi>
                    {groupName(group.key).label}
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

          {/* ── The one action of the screen ────────────────────────────────
              `.lq-actionbar` is sticky to the block end on a phone, so it pins
              itself above the tab bar while the column is still running and
              sits in flow once the column ends. In flow beside the gallery. */}
          <div className="lq-actionbar lq-pdp__buy">
            <button
              type="button"
              className="lq-btn lq-btn--primary lq-btn--lg lq-btn--block"
              disabled={!selected || !selected.inStock || addToBag.isPending}
              onClick={() => {
                if (!selected) return;
                addToBag.mutate(
                  { variantId: selected.id, quantity: 1 },
                  {
                    onSuccess: () =>
                      track({ type: "CART_ADD", productId: product.id, variantId: selected.id }),
                  },
                );
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
                {t.added}{" "}
                <Link className="lq-textlink" href="/bag">
                  {ar ? "عرض السلة" : "View bag"}
                </Link>
              </p>
            ) : null}
          </div>

          {/*
            NEVER CLAIM STOCK WE DO NOT OWN, and never print a count. Visible,
            not folded into a disclosure: this is the sentence that explains
            the wait between placing and confirming, and a shopper who reads it
            after the wait has read it too late.
          */}
          <p className="lq-pdp__note">{t.shelf}</p>

          <div className="lq-pdp__accs">
            <Disclosure title={t.about} open>
              <span data-bidi>{description ?? t.noAbout}</span>
            </Disclosure>

            {/* No fabric and no care instructions exist in `publicProductDetail`.
                Saying so is the register; inventing "70% merino" is the one
                thing PRODUCT.md rules out outright. */}
            <Disclosure title={t.material}>{t.noMaterial}</Disclosure>
            <Disclosure title={t.delivery}>{t.deliveryBody}</Disclosure>
            <Disclosure title={t.returns}>{t.returnsBody}</Disclosure>
          </div>

          <Link className="lq-textlink lq-pdp__all" href={`/shop/${brandSlug}`}>
            {t.allOfShop}
          </Link>
        </div>
      </section>
    </div>
  );
}
