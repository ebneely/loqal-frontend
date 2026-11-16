"use client";

import { useEffect } from "react";

import { track, type AnalyticsEvent } from "@/lib/analytics";

/**
 * Sends one view beacon when a server-rendered page mounts. Renders nothing.
 * Keyed on the ids, so a client navigation to another shop or piece counts.
 */
export function TrackView({ type, brandId, productId }: Pick<AnalyticsEvent, "type" | "brandId" | "productId">) {
  useEffect(() => {
    track({ type, brandId, productId });
  }, [type, brandId, productId]);
  return null;
}
