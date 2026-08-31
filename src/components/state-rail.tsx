"use client";

import dynamic from "next/dynamic";
import { useCallback, useState, useSyncExternalStore } from "react";

/**
 * The dead end as a rail you can push.
 *
 * THE FLAT DRAWING IS THE DEFAULT, not an error path. It is in the markup and
 * it is visible; the canvas covers it only once three.js has actually drawn a
 * frame. No WebGL, a blocked chunk, a browser with reduced motion on — the
 * screen still says what happened and still offers the way out, and nothing
 * about it looks like a failure to load.
 */
const RailCanvas = dynamic(() => import("./rail-canvas"), { ssr: false });

/** The same wire as `state.tsx` draws, three across, at rest. */
function FlatRail() {
  return (
    <svg
      className="lq-rail3d__flat"
      viewBox="0 0 240 96"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M4 20 H236" />
      <g>
        <path d="M50 33 V26 a4.5 4.5 0 1 0 -6 3.6" />
        <path d="M50 33 L29 48 L71 48 Z" />
      </g>
      <g>
        <path d="M120 33 V26 a4.5 4.5 0 1 0 -6 3.6" />
        <path d="M120 33 L99 48 L141 48 Z" />
      </g>
      <g>
        <path d="M190 33 V26 a4.5 4.5 0 1 0 -6 3.6" />
        <path d="M190 33 L169 48 L211 48 Z" />
      </g>
    </svg>
  );
}

const QUERY = "(prefers-reduced-motion: reduce)";

const subscribe = (onChange: () => void) => {
  const query = window.matchMedia(QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};

export function StateRail() {
  const [live, setLive] = useState(false);

  /**
   * REDUCED MOTION MEANS THE CHUNK IS NEVER FETCHED, not that it is fetched
   * and then held still: the point of the setting is the download as much as
   * the movement. The server snapshot is `true` so nothing is even considered
   * until the client has said otherwise.
   */
  const reduced = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => true,
  );

  const ready = useCallback(() => setLive(true), []);

  return (
    <div className="lq-rail3d" data-live={live}>
      <FlatRail />
      {reduced ? null : <RailCanvas onReady={ready} />}
    </div>
  );
}
