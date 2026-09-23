"use client";

import { useEffect, useRef } from "react";

import { track, type TrackInput } from "@/lib/analytics";

/**
 * One analytics event when a page is seen, from a page that is otherwise a
 * server component.
 *
 * The shop page and the product page render on the server, and a beacon can
 * only leave from the browser, so each drops one of these in and it renders
 * nothing. Once per mount: the ref survives React's development double-run of
 * effects, so a local session does not count every view twice, and a new
 * product is a new page and so a new mount.
 */
export function TrackView(props: TrackInput) {
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    track(props);
    // The event describes the page as it was first seen, and the page is keyed
    // by its route: a later prop change is not a second view.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
