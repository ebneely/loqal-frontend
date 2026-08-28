"use client";

import { useState, useSyncExternalStore } from "react";

/**
 * The first thing anybody sees, and only the first thing.
 *
 * ONCE PER SESSION, NOT PER NAVIGATION. A shopper moving from the home page to
 * a product to their bag is inside one visit; showing them the mark at every
 * step turns a greeting into a toll gate. `sessionStorage` is the right store
 * for exactly that scope — it dies with the tab, so a fresh visit is greeted
 * again and a browse is not.
 *
 * IT NEVER GATES CONTENT. The page underneath is rendered, laid out and
 * readable the whole time; this is an overlay that leaves. If the JavaScript
 * fails, the timer never runs or the browser throws on storage, what remains is
 * the site — not a blank screen with a logo on it, which is the failure mode of
 * every splash that decides when the page is allowed to appear.
 *
 * `aria-hidden` and no focus trap: a screen reader is already reading the real
 * page, and it should not be told to wait for an animation it cannot see.
 */

const SEEN = "loqal_greeted";

/**
 * Answered once per document, then remembered.
 *
 * `useSyncExternalStore` calls its snapshot on every render and requires the
 * same answer each time, so the decision is memoised here rather than
 * recomputed — and the write happens on that same first call, which is what
 * makes this once per session rather than once per render.
 *
 * Wrapped, because storage THROWS rather than returning null in a hardened
 * browser or a third-party frame. A shopper with storage blocked is greeted
 * every visit; a repeated hello is a smaller failure than a broken one.
 */
let decided: boolean | null = null;

function shouldGreet(): boolean {
  if (decided !== null) return decided;

  try {
    decided = window.sessionStorage.getItem(SEEN) !== "1";
    window.sessionStorage.setItem(SEEN, "1");
  } catch {
    decided = true;
  }

  return decided;
}

/** Nothing to subscribe to: the answer cannot change within one document. */
const subscribeNever = () => () => {};

/** What the server rendered, so hydration matches the HTML it produced. */
const onServer = () => false;

export function Opening() {
  /**
   * `useSyncExternalStore`, not `useState` + `useEffect`.
   *
   * `sessionStorage` is state that lives outside React, cannot be read during a
   * server render, and must not tear during hydration — which is the exact
   * problem this hook exists for. Setting state in an effect would do the same
   * job one wasted render later, and this repository's lint rule refuses it.
   * `locale-context.tsx` and `brands-menu.tsx` both make the same call.
   */
  const greet = useSyncExternalStore(subscribeNever, shouldGreet, onServer);

  /** Turned on by the animation ending — an event, not an effect. */
  const [done, setDone] = useState(false);

  if (!greet || done) return null;

  /**
   * ONE ANIMATION, and the element leaves when that animation ends — not when
   * a timer guesses it has.
   *
   * The first draft held with `setTimeout` and faded with a second one, which
   * is two numbers that have to agree with a duration in the stylesheet and
   * silently stop agreeing the moment anyone edits it. It is also `setState`
   * inside an effect, which this repository's lint refuses, and it is right to:
   * an overlay that removes itself on a clock keeps running in a background tab
   * where the animation is throttled and the timer is not.
   *
   * `animationend` is the actual event. Under `prefers-reduced-motion` the
   * animation is a hair long rather than absent, so it still fires and the
   * overlay still leaves.
   */
  return (
    <div
      className="lq-open"
      aria-hidden="true"
      onAnimationEnd={(event) => {
        if (event.animationName.startsWith("lq-open-hold")) setDone(true);
      }}
    >
      <span className="lq-open__mark">
        <span>l</span>
        <span>o</span>
        <span>q</span>
        {/* The three a's are the brand's own joke. They fill in the reading
            direction, so the sequence mirrors under Arabic without a second
            rule — the flex row follows `dir`, and the delays follow the row. */}
        <span className="lq-open__a">a</span>
        <span className="lq-open__a">a</span>
        <span className="lq-open__a">a</span>
        <span>l</span>
      </span>
    </div>
  );
}
