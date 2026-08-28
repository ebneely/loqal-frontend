"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
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
 * WHY THE PANEL AND THE SCRIM ARE PORTALLED TO `document.body`:
 *
 * `.lq-head` sets `backdrop-filter`, and a filter makes an element a CONTAINING
 * BLOCK FOR FIXED DESCENDANTS. This component is mounted inside that header
 * (`shell.tsx`, in `.lq-tools`), so before the portal a `position: fixed`
 * child did not resolve against the viewport at all — it resolved against the
 * header's own box.
 *
 * That broke the scrim in a way that looked like a hover bug. `inset: 0` made
 * it cover the HEADER exactly rather than the page, and being a descendant it
 * painted over the links inside it whatever `--z-scrim` said, because z-index
 * only orders siblings within one stacking context. The result, with the mouse
 * completely still: hover the trigger, panel opens, scrim lands on top of the
 * trigger, `mouseleave` fires, panel closes, scrim goes, `mouseenter` fires.
 * Forever.
 *
 * A portal is the fix rather than moving the JSX, because the trigger has to
 * stay inside the nav for layout and for the tab order, while the two overlays
 * must escape the header entirely. `top` is measured from the header's
 * `getBoundingClientRect().bottom`, which is a VIEWPORT coordinate and is only
 * correct once the panel actually resolves against the viewport.
 */

/**
 * A store that never changes. Hoisted to the module so the subscribe identity
 * is stable — an inline arrow would be a new function every render and would
 * make React resubscribe each time.
 */
const subscribeNever = () => () => {};
const onClient = () => true;
const onServer = () => false;

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
  const { data, isPending, isError } = useQuery({
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
   * Mounted-on-the-client, for the portal below: `document.body` does not exist
   * while the server renders.
   *
   * `useSyncExternalStore` rather than `useState` + `useEffect`, which is the
   * same call `locale-context.tsx` makes for the same reason. The value is a
   * fact about the environment rather than React state, it differs between the
   * server render and the first client render, and it must not tear during
   * hydration — which is exactly what the third argument is for. Setting state
   * in an effect would do the same job one wasted render later and React's own
   * lint rule (`react-hooks/set-state-in-effect`) refuses it.
   */
  const mounted = useSyncExternalStore(subscribeNever, onClient, onServer);

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

      {/* Portalled, not nested — see the note at the top of this file. Rendered
          only after mount: `document.body` does not exist during the server
          render. The panel is `inert` and the scrim transparent while closed,
          so there is nothing missing from the first paint. */}
      {mounted
        ? createPortal(
            <>
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
            <div className="lq-mega__az" data-empty={groups.length === 0}>
              {/* The panel used to render an empty band when the read failed or
                  had not landed: a pale strip, a scrim over the page and no
                  word about why. Loading is a skeleton, and an empty list says
                  which of the two it is. */}
              {groups.length === 0 ? (
                isPending ? (
                  <div className="lq-mega__wait" aria-hidden="true">
                    {[0, 1, 2, 3].map((i) => (
                      <span className="lq-skel" key={i} style={{ blockSize: "14px" }} />
                    ))}
                  </div>
                ) : (
                  <p className="lq-hint" role={isError ? "alert" : undefined}>
                    {isError
                      ? locale === "ar"
                        ? "مش قادرين نوصل للمحلات دلوقتي."
                        : "We cannot reach the shops right now."
                      : locale === "ar"
                        ? "المحلات هتظهر هنا أول ما تفتح."
                        : "Shops show up here as they open."}
                  </p>
                )
              ) : null}

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
            </>,
            document.body
          )
        : null}
    </>
  );
}
