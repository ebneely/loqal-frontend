"use client";

import { useEffect } from "react";

/**
 * The garments trade squares.
 *
 * FLIP: the drawings are swapped in the DOM first, measured where they landed,
 * then put back where they were with a transform which is released on the next
 * frame. The browser animates a transform on the compositor and never relays
 * out the grid — animating grid positions directly would reflow sixty cells
 * every frame on the phone this product is read on.
 *
 * It animates markup the server already painted, exactly as `Reveal` does. If
 * this never mounts, the wall is a still wall rather than an empty one.
 */

const EVERY = 5000;
const GLIDE = 620;
/** Pairs, so this many times two pieces move at once. */
const PAIRS = 16;

export function HeroShuffle() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const wall = document.querySelector<HTMLElement>(".lq-wall");
    if (!wall) return;

    let settle: ReturnType<typeof setTimeout> | undefined;

    const move = () => {
      /* Nothing while the tab is hidden: rAF is throttled there but setInterval
         is not, so the moves would queue up and arrive as one jump on return. */
      if (document.hidden) return;

      const cells = [...wall.children] as HTMLElement[];
      if (cells.length < PAIRS * 2) return;

      const order = cells.map((_, i) => i);
      for (let i = order.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
      }

      const moving: { art: Element; cell: HTMLElement; from: DOMRect }[] = [];

      for (let i = 0; i < PAIRS * 2; i += 2) {
        const a = cells[order[i]];
        const b = cells[order[i + 1]];
        const artA = a.firstElementChild;
        const artB = b.firstElementChild;
        if (!artA || !artB) continue;

        moving.push(
          { art: artA, cell: b, from: artA.getBoundingClientRect() },
          { art: artB, cell: a, from: artB.getBoundingClientRect() }
        );
      }

      // Every swap first, so the measurements below see the final layout.
      for (const m of moving) {
        m.cell.append(m.art);
        m.cell.dataset.moving = "true";
      }

      for (const m of moving) {
        const to = m.art.getBoundingClientRect();
        const art = m.art as HTMLElement;
        art.style.transition = "none";
        /* Promoted before the move, not during it: a layer created on the first
           animated frame is rasterised mid-flight, which is the stutter. */
        art.style.willChange = "transform";
        art.style.transform = `translate(${m.from.left - to.left}px,${m.from.top - to.top}px)`;
        void art.getBoundingClientRect();
        /* --ease-in-out, not --slow. --slow spends most of its distance in the
           first third, which is right for something arriving from nowhere and
           wrong for something crossing a board — it reads as a lurch and a
           long crawl. This one leaves and arrives at the same rate. */
        art.style.transition = `transform ${GLIDE}ms var(--ease-in-out)`;
        art.style.transform = "";
      }

      settle = setTimeout(() => {
        for (const m of moving) {
          (m.art as HTMLElement).style.transition = "";
          (m.art as HTMLElement).style.willChange = "";
          m.cell.removeAttribute("data-moving");
        }
      }, GLIDE + 200);
    };

    const timer = setInterval(move, EVERY);
    return () => {
      clearInterval(timer);
      clearTimeout(settle);
    };
  }, []);

  return null;
}
