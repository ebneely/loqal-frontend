"use client";

import { useState, useSyncExternalStore } from "react";

/**
 * Which of the three dead-end treatments a shopper gets.
 *
 * `recover` — the shelf's name goes back as a text query and the results are
 *             the screen.
 * `wayon`   — the shops that are trading and the shelves either side.
 * `rail`    — the rail itself, in three dimensions.
 *
 * They are not three skins of one screen. `recover` changes what the page
 * DOES and the other two do not, so a third of the visitors to a failing
 * category see products and two thirds see a dead end. That is a product
 * decision rather than a rendering detail, and `recover` degrades to `wayon`
 * whenever the name search comes back with nothing.
 */
export type FailureVariant = "recover" | "wayon" | "rail";

const VARIANTS: readonly FailureVariant[] = ["recover", "wayon", "rail"];

const isVariant = (value: string | null): value is FailureVariant =>
  value !== null && (VARIANTS as readonly string[]).includes(value);

/** Nothing to subscribe to: "are we past hydration" changes exactly once. */
const subscribe = () => () => {};

/**
 * The draw, and why it is shaped like this.
 *
 * A random value read during render is a hydration mismatch the day somebody
 * prefetches this route on the server — the HTML would carry one treatment
 * and the client would draw another. `useSyncExternalStore` is React's own
 * answer: the server snapshot is `false`, the client's is `true`, and the
 * swap happens in a render React expects rather than in an effect that
 * cascades. Until it flips, `fallback` is what would be drawn.
 *
 * `useState` holds the draw so a re-render — a filter change, a refetch —
 * does not reshuffle the screen while a shopper is reading it.
 *
 * `fallback` is `wayon` because that one needs no WebGL and no second request.
 */
export function useFailureVariant(fallback: FailureVariant = "wayon") {
  const hydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  const [drawn] = useState<FailureVariant>(
    () => VARIANTS[Math.floor(Math.random() * VARIANTS.length)],
  );

  if (!hydrated) return fallback;

  /* `?dead=rail` pins one, so all three can be reviewed without reloading
     until the dice land on the one you wanted. Anything unrecognised falls
     through to the draw, so none of this is reachable by accident. */
  const pinned = new URLSearchParams(window.location.search).get("dead");
  return isVariant(pinned) ? pinned : drawn;
}
