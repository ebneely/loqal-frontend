"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";

/**
 * The header's drop-down panel, and everything awkward about it.
 *
 * Extracted from `brands-menu.tsx` when a second one arrived. What was awkward
 * there is awkward for every one of them, and two copies of the portal, the
 * hover timing and the `inert` rule is how one of them quietly loses a fix.
 *
 * WHY THE PANEL AND THE SCRIM ARE PORTALLED TO `document.body`:
 *
 * `.lq-head` sets `backdrop-filter`, and a filter makes an element a CONTAINING
 * BLOCK FOR FIXED DESCENDANTS. A trigger lives inside that header, so before
 * the portal a `position: fixed` child did not resolve against the viewport at
 * all — it resolved against the header's own box.
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
 * ONE PANEL AT A TIME, held outside React.
 *
 * The panels are siblings in the tab order and portalled siblings in the DOM,
 * and each carries its own scrim. Two open at once is two scrims over one page
 * and two panels hanging off the same header edge — which is what happened
 * crossing from one trigger to the next, because the leaving panel waits 220ms
 * to close and the arriving one opens in 60.
 *
 * A module store rather than context: these are two nodes in one header, not a
 * tree that needs a provider, and the value is a fact about the document.
 */
let openId: string | null = null;
const listeners = new Set<() => void>();

const publish = (next: string | null) => {
  if (openId === next) return;
  openId = next;
  for (const listener of listeners) listener();
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const getSnapshot = () => openId;
const getServerSnapshot = () => null;

/**
 * Hover opens it on a real pointer; a tap opens it on a touch screen. Read at
 * the event rather than at mount, because a laptop with a touchscreen can be
 * either at different moments.
 */
const hoverable = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(hover:hover) and (pointer:fine)").matches;

export function MegaMenu({
  id,
  href,
  label,
  wide = false,
  children,
}: {
  /** Distinct per menu. Opening one closes whichever other one was open. */
  id: string;
  /** Where the trigger really points, for a middle-click and for no JS. */
  href: string;
  label: string;
  /** Drops the feature column, for a panel that is one full-width grid. */
  wide?: boolean;
  children: React.ReactNode;
}) {
  const open =
    useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot) === id;
  const triggerRef = useRef<HTMLAnchorElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  /** Measured from the header, so the panel hangs off the real chrome height. */
  const [top, setTop] = useState(96);

  const openLater = useCallback(
    (next: boolean) => {
      clearTimeout(timer.current);
      /**
       * Asymmetric, and the close delay is the whole point: the trigger and the
       * panel do not touch, so a pointer travelling from one to the other leaves
       * both for a frame. Closing immediately shuts the menu under the cursor.
       * Opening is near-instant; closing waits long enough to cross the gap.
       */
      timer.current = setTimeout(
        () => publish(next ? id : null),
        next ? 60 : 220,
      );
    },
    [id],
  );

  const close = useCallback(() => {
    clearTimeout(timer.current);
    publish(null);
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

  /* A panel left open behind a route change is a panel over the page it just
     took you to. */
  useEffect(() => () => clearTimeout(timer.current), []);

  /**
   * Mounted-on-the-client, for the portal below: `document.body` does not exist
   * while the server renders.
   *
   * `useSyncExternalStore` rather than `useState` + `useEffect`, which is the
   * same call `locale-context.tsx` makes for the same reason. The value is a
   * fact about the environment rather than React state, it differs between the
   * server render and the first client render, and it must not tear during
   * hydration — which is exactly what the third argument is for.
   */
  const mounted = useSyncExternalStore(subscribe, onClient, onServer);

  return (
    <>
      <Link
        ref={triggerRef}
        href={href}
        aria-expanded={open}
        aria-haspopup="true"
        onMouseEnter={() => hoverable() && openLater(true)}
        onMouseLeave={() => hoverable() && openLater(false)}
        onFocus={() => hoverable() && publish(id)}
        onClick={(event) => {
          /**
           * Click still works on a mouse, and it PINS the panel rather than
           * requiring a held hover. It is also the only way in on touch, which
           * is why the navigation is suppressed rather than allowed through.
           */
          event.preventDefault();
          clearTimeout(timer.current);
          publish(open ? null : id);
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
              <div
                className="lq-scrim"
                data-open={open}
                onClick={close}
                aria-hidden="true"
              />

              <div
                className="lq-mega"
                data-open={open}
                data-wide={wide || undefined}
                style={{ "--mega-top": `${top}px` } as React.CSSProperties}
                /** Hidden from the tree when closed, so a keyboard does not tab
                    into a panel nobody can see. `pointer-events:none` alone
                    would not do it — it stops the pointer and leaves the links
                    in the tab order.

                    React 19 types `inert` as a boolean and serialises it to the
                    HTML attribute itself, so this is `inert={!open}` rather than
                    the spread-an-empty-string trick older React needed. */
                inert={!open}
                onMouseEnter={() => hoverable() && openLater(true)}
                onMouseLeave={() => hoverable() && openLater(false)}
                /** Every link in here goes somewhere, so every link closes it.
                    Delegated rather than handed to each panel to wire up: a
                    panel left standing over the page it just navigated to is
                    the failure, and one forgotten `onClick` is enough to cause
                    it. Capture is not needed — Next's Link does not stop the
                    event on its way up. */
                onClick={(event) => {
                  if ((event.target as HTMLElement).closest("a")) close();
                }}
              >
                {children}
              </div>
            </>,
            document.body,
          )
        : null}
    </>
  );
}

/**
 * A store that never changes. Hoisted so the subscribe identity is stable — an
 * inline arrow would be a new function every render and would make React
 * resubscribe each time.
 */
function onClient() {
  return true;
}
function onServer() {
  return false;
}
