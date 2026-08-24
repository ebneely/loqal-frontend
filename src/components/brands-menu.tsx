"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import type { PublicBrand } from "@loqal/contracts/storefront.contract";
import { fetchBrands, queryKeys } from "@/lib/catalog";
import { useLocale } from "@/lib/locale-context";
import { Garment, garmentFor } from "@/components/garment";

/**
 * The brands mega-menu: an A–Z index of every shop, with a feature pane that
 * follows whichever shop the pointer or the keyboard is on.
 *
 * The feature pane is the one place this diverges upward from the reference
 * (suuupply.com), which parks a static product image beside its index. A
 * marketplace index is a list of *places*, and the pane is where the place gets
 * to be one. What it can say is currently thin — see the note on `Feature`.
 *
 * WHY THIS IS A SIBLING OF THE HEADER AND NOT A CHILD: the panel is
 * `position: fixed`, and the header sets `backdrop-filter`. A filter creates a
 * containing block for fixed descendants, so a fixed panel nested inside the
 * header would be positioned against the header rather than the viewport, and
 * would additionally be clipped by any `overflow` ancestor. It renders next to
 * the header and positions itself from a measured offset instead.
 */

/** Latin initial, or `#` for a shop whose name starts in Arabic or a digit. */
const initialOf = (name: string) => {
  const first = name.trim().charAt(0);
  return /[A-Za-z]/.test(first) ? first.toUpperCase() : "#";
};

function Feature({ brand }: { brand: PublicBrand }) {
  const locale = useLocale();

  /**
   * BACKEND GAP, and it is the one that matters most on this surface.
   *
   * `publicBrandSchema` carries id, slug, name, logoUrl, coverUrl and
   * description. It does NOT carry the neighbourhood, the street, the opening
   * hours or a piece count — the four things `design/`'s version of this pane
   * showed, and the four things PRODUCT.md calls the product's premise. That
   * mockup had them because `design/app.js` invented them in a hardcoded array.
   *
   * So the pane renders what the API can answer and says nothing where it
   * cannot. It does not print a placeholder neighbourhood: a location a shopper
   * cannot walk to is worse than no location, and this is the exact screen
   * where the difference is the product.
   */
  const description =
    brand.description?.[locale] ?? brand.description?.ar ?? brand.description?.en ?? null;

  return (
    <>
      <span className="lq-mega__pic">
        <Garment className="lq-garment" kind={garmentFor(brand.slug)} />
      </span>
      <span className="lq-mega__nm" data-bidi>
        {brand.name}
      </span>
      {description ? (
        <span className="lq-mega__hd" data-bidi>
          {description}
        </span>
      ) : null}
      <span className="lq-mega__rw">
        {locale === "ar" ? "افتح المحل" : "Open the shop"}
      </span>
    </>
  );
}

export function BrandsMenu() {
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [featured, setFeatured] = useState<PublicBrand | null>(null);
  const triggerRef = useRef<HTMLAnchorElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  /** Measured from the header, so the panel hangs off the real chrome height. */
  const [top, setTop] = useState(96);

  /**
   * The same query key and the same endpoint the home page uses, so opening the
   * menu on `/` costs nothing: TanStack serves it from cache.
   *
   * One page of shops, not all of them. `/v1/brands` is paged and the menu
   * shows page 1 — an A-Z index that silently omits page 2 would be wrong, so
   * when the shop count outgrows a page this needs a dedicated index endpoint
   * rather than a bigger `perPage`.
   */
  const { data } = useQuery({
    queryKey: queryKeys.brands(1),
    queryFn: () => fetchBrands(1, 24),
    staleTime: 5 * 60 * 1000,
  });

  const brands = useMemo(() => data?.items ?? [], [data]);

  /** Grouped once per list, not per render of a group. */
  const groups = useMemo(() => {
    const map = new Map<string, PublicBrand[]>();
    for (const brand of brands) {
      const key = initialOf(brand.name);
      const bucket = map.get(key);
      if (bucket) bucket.push(brand);
      else map.set(key, [brand]);
    }
    /** `#` sorts last: a Latin index that opens on a non-Latin bucket reads as
        broken, and Arabic-named shops are the exception here, not the rule. */
    return [...map.entries()].sort(([a], [b]) =>
      a === "#" ? 1 : b === "#" ? -1 : a.localeCompare(b)
    );
  }, [brands]);

  /** The pane is never empty while the panel is open. */
  const shown = featured ?? brands[0] ?? null;

  const setOpenLater = useCallback((next: boolean) => {
    clearTimeout(timer.current);
    /**
     * Asymmetric, and the close delay is the whole point: the trigger and the
     * panel do not touch, so a pointer travelling from one to the other leaves
     * both for a frame. Closing immediately shuts the menu under the cursor.
     * Opening is near-instant; closing waits long enough to cross the gap.
     */
    timer.current = setTimeout(() => setOpen(next), next ? 60 : 220);
  }, []);

  const close = useCallback(() => {
    clearTimeout(timer.current);
    setOpen(false);
  }, []);

  /** Position the panel under the real header, measured rather than assumed. */
  useEffect(() => {
    if (!open) return;
    const header = triggerRef.current?.closest("header");
    if (header) setTop(Math.max(header.getBoundingClientRect().bottom, 0));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  useEffect(() => () => clearTimeout(timer.current), []);

  /**
   * Hover opens it on a real pointer; a tap opens it on a touch screen. The
   * media query is read once at the event rather than at mount, because a
   * laptop with a touchscreen can be either at different moments.
   */
  const hoverable = () =>
    typeof window !== "undefined" &&
    window.matchMedia("(hover:hover) and (pointer:fine)").matches;

  const label = locale === "ar" ? "المحلات" : "Shops";

  return (
    <>
      <Link
        ref={triggerRef}
        href="/shops"
        aria-expanded={open}
        aria-haspopup="true"
        onMouseEnter={() => hoverable() && setOpenLater(true)}
        onMouseLeave={() => hoverable() && setOpenLater(false)}
        onFocus={() => hoverable() && setOpen(true)}
        onClick={(event) => {
          /**
           * Click still works on a mouse, and it PINS the panel rather than
           * requiring a held hover. It is also the only way in on touch, which
           * is why the navigation is suppressed rather than allowed through.
           */
          event.preventDefault();
          clearTimeout(timer.current);
          setOpen((previous) => !previous);
        }}
      >
        {label}
        <svg
          className="lq-chev"
          viewBox="0 0 24 24"
          width="14"
          height="14"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </Link>

      <div className="lq-scrim" data-open={open} onClick={close} aria-hidden="true" />

      <div
        className="lq-mega"
        data-open={open}
        style={{ "--mega-top": `${top}px` } as React.CSSProperties}
        /** Hidden from the tree when closed, so a keyboard does not tab into a
            panel nobody can see. `pointer-events:none` alone would not do it —
            it stops the pointer and leaves the links in the tab order.

            React 19 types `inert` as a boolean and serialises it to the HTML
            attribute itself, so this is `inert={!open}` rather than the
            spread-an-empty-string trick older React needed. */
        inert={!open}
        onMouseEnter={() => hoverable() && setOpenLater(true)}
        onMouseLeave={() => hoverable() && setOpenLater(false)}
      >
        <div className="lq-mega__az">
          {groups.map(([letter, items]) => (
            <div className="lq-mega__grp" key={letter}>
              <span className="lq-mega__ltr">{letter}</span>
              {items.map((brand) => (
                <Link
                  key={brand.id}
                  href={`/shop/${brand.slug}`}
                  data-bidi
                  /**
                   * Pointer AND keyboard both drive the pane. `design/`'s
                   * version listened for `mouseover` only, so tabbing through
                   * the index left the pane frozen on whichever shop the mouse
                   * had last grazed — the feature is invisible to a keyboard.
                   */
                  onMouseEnter={() => setFeatured(brand)}
                  onFocus={() => setFeatured(brand)}
                  onClick={close}
                >
                  {brand.name}
                </Link>
              ))}
            </div>
          ))}
        </div>

        {shown ? (
          <Link className="lq-mega__feat" href={`/shop/${shown.slug}`} onClick={close}>
            <Feature brand={shown} />
          </Link>
        ) : null}
      </div>
    </>
  );
}
