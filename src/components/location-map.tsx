"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useRef } from "react";

import type { LatLng } from "@/lib/delivery-location";

/**
 * The map in the location picker: OpenStreetMap tiles under a pin fixed at the
 * centre. The shopper drags the map, not the pin, which is easier with a thumb
 * and leaves the keyboard (arrow keys pan Leaflet) a way to do the same.
 *
 * Client only — Leaflet touches `window` on import — so the picker loads this
 * file with `next/dynamic` and `ssr: false`, and only once the picker opens.
 */
export default function LocationMap({
  view,
  onMove,
  label,
}: {
  /** Where to look. Changing it recentres; the shopper's own panning does not. */
  view: LatLng;
  onMove: (center: LatLng) => void;
  label: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const moved = useRef(onMove);
  const first = useRef(view);

  useEffect(() => {
    moved.current = onMove;
  }, [onMove]);

  useEffect(() => {
    if (!box.current) return;
    const map = L.map(box.current, { zoomControl: true }).setView(
      [first.current.latitude, first.current.longitude],
      16,
    );
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    map.on("moveend", () => {
      const center = map.getCenter();
      moved.current({ latitude: center.lat, longitude: center.lng });
    });
    /* The dialog sizes itself after this mounts; without this the tiles fill
       only the box Leaflet measured first. */
    const resize = new ResizeObserver(() => map.invalidateSize());
    resize.observe(box.current);
    mapRef.current = map;
    return () => {
      resize.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const center = map.getCenter();
    if (Math.abs(center.lat - view.latitude) < 1e-6 && Math.abs(center.lng - view.longitude) < 1e-6) return;
    map.setView([view.latitude, view.longitude], Math.max(map.getZoom(), 16));
  }, [view]);

  return (
    <div className="lq-locmap">
      {/* LTR always: Leaflet positions tiles from the left. */}
      <div ref={box} className="lq-locmap__box" dir="ltr" role="application" aria-label={label} />
      <span className="lq-locmap__pin" aria-hidden="true">
        <span className="lq-icon" data-icon="map-pin" />
      </span>
    </div>
  );
}
