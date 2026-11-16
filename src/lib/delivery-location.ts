import { useSyncExternalStore } from "react";
import { z } from "zod";

import type { Locale } from "./locale";

/**
 * Where the shopper wants things delivered — the "التوصيل إلى" in the chrome.
 *
 * KEPT IN THE BROWSER ONLY. Shops are sorted nearest-first here, with the
 * shop coordinates the public API already sends, so the shopper's position is
 * never sent to our server just to order a list.
 *
 * localStorage is a convenience, not a dependency: a private window, blocked
 * site data or a full quota throws, and the choice then lives in memory for
 * the rest of the visit instead of breaking the chrome.
 */

export type LatLng = { latitude: number; longitude: number };

const locationSchema = z.object({
  label: z.string(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  area: z.string().optional(),
  /** Set when the choice IS one of the shopper's saved addresses. */
  addressId: z.string().optional(),
});

export type DeliveryLocation = z.infer<typeof locationSchema>;

const KEY = "lq:delivery-location";
const listeners = new Set<() => void>();
/** `undefined` until first read; then the one copy every reader shares. */
let current: DeliveryLocation | null | undefined;

function parse(raw: string | null): DeliveryLocation | null {
  if (!raw) return null;
  try {
    const parsed = locationSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function getDeliveryLocation(): DeliveryLocation | null {
  if (current === undefined) {
    current = null;
    try {
      current = parse(window.localStorage.getItem(KEY));
    } catch {
      /* Storage unavailable: start empty and keep the choice in memory. */
    }
  }
  return current;
}

export function setDeliveryLocation(next: DeliveryLocation | null) {
  current = next;
  try {
    if (next) window.localStorage.setItem(KEY, JSON.stringify(next));
    else window.localStorage.removeItem(KEY);
  } catch {
    /* Memory only for this visit. */
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  /* Another tab chose a place: re-read on the next snapshot. */
  const onStorage = (event: StorageEvent) => {
    if (event.key !== KEY) return;
    current = undefined;
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** `null` on the server and in the hydration pass, so the HTML never tears. */
export function useDeliveryLocation(): DeliveryLocation | null {
  return useSyncExternalStore(subscribe, getDeliveryLocation, () => null);
}

// ── Distance ────────────────────────────────────────────────────────────────

/** Great-circle distance (haversine), in kilometres. Straight line, not road. */
export function distanceKm(a: LatLng, b: LatLng): number {
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = rad(b.latitude - a.latitude);
  const dLng = rad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** The nearest of several points (an area's shops), or null when none has one. */
export function nearestKm(
  from: LatLng | null,
  points: readonly (LatLng | null | undefined)[],
): number | null {
  if (!from) return null;
  let best: number | null = null;
  for (const point of points) {
    if (!point) continue;
    const km = distanceKm(from, point);
    if (best === null || km < best) best = km;
  }
  return best;
}

/**
 * "2.4 كم" — Latin digits in both languages (DESIGN.md), one decimal under
 * 10 km, whole kilometres from there.
 */
export function formatKm(km: number, locale: Locale): string {
  const tenths = Math.round(km * 10) / 10;
  const figure = tenths < 10 ? tenths.toFixed(1) : String(Math.round(km));
  return locale === "ar" ? `${figure} كم` : `${figure} km`;
}

/**
 * Indexes of `points` nearest-first. Entries with no point keep their order and
 * go last, so a shop that has not said where it is is never dropped.
 */
export function nearestOrder(
  from: LatLng | null,
  points: readonly (readonly (LatLng | null | undefined)[])[],
): number[] {
  const keyed = points.map((list, index) => ({ index, km: nearestKm(from, list) }));
  return keyed
    .sort((a, b) =>
      a.km === null ? (b.km === null ? a.index - b.index : 1) : b.km === null ? -1 : a.km - b.km,
    )
    .map((entry) => entry.index);
}
