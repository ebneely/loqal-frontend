"use client";

import { useEffect } from "react";

/**
 * The reveal.
 *
 * THIS ONLY PLAYS AN ENTRANCE ON CONTENT THAT IS ALREADY PAINTED. Nothing here
 * hides anything, and that is the entire design of it — see the long note in
 * globals.css. `.lq-rv` is visible with no JS, no observer and no class; adding
 * `.in` starts a `lq-rise` animation on something the reader can already see.
 *
 * The tempting version sets `opacity: 0` and waits for the observer. That ships
 * a blank section every time the observer does not fire: a background tab,
 * where observers and transitions are throttled; a headless renderer; a
 * crawler; a JS error one component away. `design/` guarded that with a `.js`
 * class on <html>, which covers JS-disabled and none of the rest.
 *
 * Mounted once by `Shell`. It observes the whole document rather than taking
 * children, so a server component can opt in with a class name and never has to
 * become a client component just to animate.
 */
export function Reveal() {
  useEffect(() => {
    /**
     * Respected here as well as in CSS. The CSS rule stops the animation from
     * being defined; this stops the observer from ever running, so a reader who
     * asked for no motion costs nothing to serve.
     */
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("in");
          /* Once. A reveal that replays on every scroll past is a distraction,
             and re-observing keeps the callback alive for the page's life. */
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.06 }
    );

    const observe = () => {
      for (const element of document.querySelectorAll(".lq-rv:not(.in)")) {
        observer.observe(element);
      }
    };

    observe();

    /**
     * Route changes and client-fetched lists add `.lq-rv` nodes after mount, so
     * the observer has to pick them up. A MutationObserver rather than a
     * dependency on `usePathname`, because a TanStack query resolving is not a
     * navigation and would otherwise never be caught.
     */
    const mutations = new MutationObserver(observe);
    mutations.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutations.disconnect();
    };
  }, []);

  return null;
}
