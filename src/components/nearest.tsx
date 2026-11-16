"use client";

import { Children } from "react";
import type { ReactNode } from "react";

import { formatKm, nearestKm, nearestOrder, useDeliveryLocation } from "@/lib/delivery-location";
import type { LatLng } from "@/lib/delivery-location";
import { useLocale } from "@/lib/locale-context";

type Points = readonly (LatLng | null | undefined)[];

/**
 * "2.4 كم" from the chosen delivery location to the nearest of `points` (one
 * shop, or an area's shops). Nothing at all without a location on either end.
 */
export function Distance({ points, className }: { points: Points; className?: string }) {
  const locale = useLocale();
  const km = nearestKm(useDeliveryLocation(), points);
  if (km === null) return null;
  return (
    <span className={className ?? "lq-dist"} data-num>
      {formatKm(km, locale)}
    </span>
  );
}

/**
 * Reorders server-rendered children nearest-first. `points[i]` belongs to the
 * i-th child; children with no point keep their order at the end. Before a
 * location is chosen (and in the server HTML) the order is untouched.
 */
export function NearestFirst({ points, children }: { points: readonly Points[]; children: ReactNode }) {
  const from = useDeliveryLocation();
  const items = Children.toArray(children);
  return <>{nearestOrder(from, points).map((index) => items[index])}</>;
}
