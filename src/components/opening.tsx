"use client";

import { useState } from "react";

/**
 * Server-rendered so it paints with the first frame. It lifts in the keyframes,
 * not here, so a broken bundle cannot leave it stuck. The inline script in
 * layout.tsx decides whether this tab has already been greeted.
 */
export function Opening() {
  const [done, setDone] = useState(false);
  if (done) return null;

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
        <span className="lq-open__a">a</span>
        <span className="lq-open__a lq-open__a--2">a</span>
        <span className="lq-open__a lq-open__a--3">a</span>
        <span>l</span>
      </span>
    </div>
  );
}
