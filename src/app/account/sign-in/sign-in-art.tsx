"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { Garment, type GarmentKind } from "@/components/garment";

/** The drawings in the middle plane, and the ones a frame falls back to. */
const DRAWN: GarmentKind[] = ["dress", "shirt", "bag", "shoe"];
const FRAMED: GarmentKind[] = ["jacket", "knit", "tee"];

/**
 * Per plane, back to front, in px: how far the pointer moves it, how far one
 * step "page" turns it, how far a focused field draws it, how much it shrinks
 * when everything converges. The back plane moves least: that is the depth.
 */
const DEPTH = [10, 24, 44];
/** The page turn is a share of the panel's width, so a phone band keeps its frames. */
const PAGE = [0.03, 0.08, 0.16];
const LEAN = [0, 8, 24];
const SHRINK = [0.03, 0.07, 0.12];

/** Spring stiffness. Damping is 2·√K — critically damped, so no overshoot. */
const K = 60;
const DAMP = 2 * Math.sqrt(K);

type Spring = { x: number; v: number };
const spring = (): Spring => ({ x: 0, v: 0 });
function follow(s: Spring, target: number, dt: number) {
  s.v += (K * (target - s.x) - DAMP * s.v) * dt;
  s.x += s.v * dt;
}

/**
 * The panel beside the form: three planes over the green, moved by ONE rAF
 * loop. Everything that moves them is a target the loop springs toward:
 *
 *   pointer   — fine pointers only; each plane by its depth, the front frames
 *               also tilt a little in perspective;
 *   idle      — a very slow shared drift, so the panel breathes without a mouse
 *               (the only motion on a phone);
 *   page      — the step: the code step turns every plane one "page" toward the
 *               inline start, the way the form's own step left;
 *   lean      — a focused field draws the front planes toward the form;
 *   converge  — a successful sign-in pulls the planes together before leaving.
 *
 * The loop runs only while the panel is on screen and the tab is visible, and
 * not at all under `prefers-reduced-motion` — the panel is then a still picture.
 */
export function SignInArt({
  photos,
  page,
  lean,
  converge,
  children,
}: {
  photos: string[];
  page: number;
  lean: boolean;
  converge: boolean;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  /* The loop reads these every frame; a ref, so a change re-targets the
     springs without restarting anything. */
  const goal = useRef({ page, lean, converge });
  useEffect(() => {
    goal.current = { page, lean, converge };
  }, [page, lean, converge]);

  useEffect(() => {
    const art = ref.current;
    if (!art || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const layers = [...art.querySelectorAll<HTMLElement>(".lq-signin__layer")];
    const rtl = getComputedStyle(art).direction === "rtl";
    /* +1 when the inline start is physical left. */
    const startX = rtl ? 1 : -1;
    const fine = window.matchMedia("(pointer: fine)").matches;

    const pointer = { x: 0, y: 0 };
    const cx = spring();
    const cy = spring();
    const turn = spring();
    const near = spring();
    const meet = spring();

    const onMove = (event: PointerEvent) => {
      pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (event.clientY / window.innerHeight) * 2 - 1;
    };
    if (fine) window.addEventListener("pointermove", onMove, { passive: true });

    let frame = 0;
    let last = 0;
    let onScreen = true;
    // The form is at the panel's inline end on desktop, below it on a phone.
    // Measured on resize, never inside the frame, so the loop never reads layout.
    let stacked = false;
    let width = 0;
    const measure = () => {
      width = art.offsetWidth;
      stacked = width > window.innerWidth * 0.75;
    };
    measure();
    window.addEventListener("resize", measure);

    const tick = (now: number) => {
      // Clamped so a long pause (a background tab) does not fling the springs.
      const dt = Math.min((now - (last || now)) / 1000, 1 / 30);
      last = now;

      const g = goal.current;
      follow(cx, pointer.x + Math.sin(now / 2600) * 0.28, dt);
      follow(cy, pointer.y + Math.cos(now / 3400) * 0.22, dt);
      follow(turn, g.page, dt);
      follow(near, g.lean ? 1 : 0, dt);
      follow(meet, g.converge ? 1 : 0, dt);

      const keep = 1 - meet.x;

      layers.forEach((layer, i) => {
        const x =
          (cx.x * DEPTH[i] + turn.x * PAGE[i] * width * startX - (stacked ? 0 : near.x * LEAN[i] * startX)) *
          keep;
        const y = (cy.x * DEPTH[i] * 0.7 + (stacked ? near.x * LEAN[i] * 0.5 : 0)) * keep;
        const tilt =
          i === 2
            ? `perspective(1000px) rotateY(${(cx.x * 5 * keep).toFixed(2)}deg) rotateX(${(-cy.x * 4 * keep).toFixed(2)}deg) `
            : "";
        layer.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) ${tilt}scale(${(1 - meet.x * SHRINK[i]).toFixed(4)})`;
      });

      frame = requestAnimationFrame(tick);
    };

    const start = () => {
      if (frame || !onScreen || document.hidden) return;
      last = 0;
      frame = requestAnimationFrame(tick);
    };
    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
    };
    const onVisibility = () => (document.hidden ? stop() : start());

    const seen = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      if (onScreen) start();
      else stop();
    });
    seen.observe(art);
    document.addEventListener("visibilitychange", onVisibility);
    start();

    return () => {
      stop();
      seen.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", measure);
    };
  }, []);

  return (
    <div className="lq-signin__art" ref={ref}>
      <div className="lq-signin__layer" aria-hidden="true">
        <div className="lq-signin__plane">
          <span className="lq-signin__word" dir="ltr">
            loqaaal
          </span>
        </div>
      </div>

      <div className="lq-signin__layer" aria-hidden="true">
        {DRAWN.map((kind) => (
          <Garment key={kind} className="lq-garment lq-signin__drawn" kind={kind} />
        ))}
      </div>

      <div className="lq-signin__layer lq-signin__layer--frames" aria-hidden="true">
        {FRAMED.map((kind, i) => (
          <div key={kind} className="lq-signin__frame">
            {photos[i] ? (
              // Presigned shop photos from the API's media host; `next/image`
              // would need that host in `remotePatterns`, which a deployment
              // may not set.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photos[i]} alt="" fetchPriority={i === 0 ? "high" : "low"} />
            ) : (
              <Garment className="lq-garment" kind={kind} />
            )}
          </div>
        ))}
      </div>

      {children}
    </div>
  );
}
