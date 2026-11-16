"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import { useAddresses, useSetAddressPin, type SavedAddress } from "@/lib/account";
import { useSession } from "@/lib/auth-client";
import {
  setDeliveryLocation,
  useDeliveryLocation,
  type DeliveryLocation,
  type LatLng,
} from "@/lib/delivery-location";
import { useLocale } from "@/lib/locale-context";

/**
 * "التوصيل إلى: …" — the delivery location control and its picker.
 *
 * Rendered twice by the shell, once in each chrome (`head` in the desktop
 * header, `bar` as the line under the phone top bar); the container query
 * hides one. Each owns a native <dialog>: `showModal()` puts it in the top
 * layer — out of the shell's containing block, so no portal — makes the page
 * behind it inert (the focus trap), closes on Escape and hands focus back to
 * the trigger on close.
 *
 * The picker body, and with it Leaflet, mounts only while the dialog is open.
 */

const LocationMap = dynamic(() => import("@/components/location-map"), {
  ssr: false,
  loading: () => <div className="lq-locmap lq-skel" aria-hidden="true" />,
});

/** Tahrir: where the map starts when nothing is chosen yet. */
const CAIRO: LatLng = { latitude: 30.0444, longitude: 31.2357 };

export function LocationControl({ variant }: { variant: "head" | "bar" }) {
  const locale = useLocale();
  const t = (ar: string, en: string) => (locale === "ar" ? ar : en);
  const chosen = useDeliveryLocation();
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const titleId = useId();

  useEffect(() => {
    if (open && !dialog.current?.open) dialog.current?.showModal();
  }, [open]);

  const close = useCallback(() => dialog.current?.close(), []);

  return (
    <>
      <button
        type="button"
        className={variant === "head" ? "lq-loc" : "lq-loc lq-locbar"}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <span className="lq-icon" data-icon="map-pin" aria-hidden="true" />
        <span className="lq-loc__t">
          {chosen ? (
            <>
              <span className="lq-loc__k">{t("التوصيل إلى", "Deliver to")}</span>
              <b className="lq-loc__v" data-bidi>
                {chosen.label}
              </b>
            </>
          ) : (
            <b className="lq-loc__v">{t("اختر موقع التوصيل", "Choose a delivery location")}</b>
          )}
        </span>
        <span className="lq-icon lq-loc__chev" data-icon="chevron-down" aria-hidden="true" />
      </button>

      <dialog
        ref={dialog}
        className="lq-locdlg"
        aria-labelledby={titleId}
        onClose={() => setOpen(false)}
        /* A click on the dialog box itself, not its contents, is the backdrop. */
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
      >
        <div className="lq-sheet__grab" aria-hidden="true" />
        <div className="lq-sheet__head">
          <h2 className="lq-sheet__title" id={titleId}>
            {t("اختر موقع التوصيل", "Choose a delivery location")}
          </h2>
          <button type="button" className="lq-iconbtn" onClick={close} aria-label={t("إغلاق", "Close")}>
            <span className="lq-icon" data-icon="x" aria-hidden="true" />
          </button>
        </div>
        {open ? <PickerBody chosen={chosen} onDone={close} /> : null}
      </dialog>
    </>
  );
}

type Place = { area: string | null; city: string | null };

function PickerBody({ chosen, onDone }: { chosen: DeliveryLocation | null; onDone: () => void }) {
  const locale = useLocale();
  const t = (ar: string, en: string) => (locale === "ar" ? ar : en);

  const { data: session } = useSession();
  const signedIn = Boolean(session?.user);
  const { data: addresses } = useAddresses(signedIn);
  const setPin = useSetAddressPin();

  /** `view` is where the map is told to look; `center` is where it is. */
  const [view, setView] = useState<LatLng>(chosen ?? CAIRO);
  const [center, setCenter] = useState<LatLng>(chosen ?? CAIRO);
  const [place, setPlace] = useState<Place>({ area: chosen?.area ?? null, city: null });
  const [geo, setGeo] = useState<"idle" | "busy" | "denied" | "failed">("idle");
  /** A saved address with no map point, being pinned now. */
  const [pinFor, setPinFor] = useState<SavedAddress | null>(null);

  const recenter = (point: LatLng) => {
    setView(point);
    setCenter(point);
  };

  /* Reverse geocoding for the area name. Nominatim's policy is at most one
     request a second: each request waits a full second after the last move, so
     two can never be closer than that. A failure just leaves the name blank. */
  useEffect(() => {
    const abort = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&accept-language=${locale}` +
            `&lat=${center.latitude.toFixed(6)}&lon=${center.longitude.toFixed(6)}`,
          { signal: abort.signal },
        );
        if (!response.ok) throw new Error(String(response.status));
        const { address = {} } = (await response.json()) as { address?: Record<string, string> };
        setPlace({
          area: address.suburb ?? address.neighbourhood ?? address.quarter ?? address.city_district ?? null,
          city: address.city ?? address.town ?? address.village ?? address.state ?? null,
        });
      } catch {
        if (!abort.signal.aborted) setPlace({ area: null, city: null });
      }
    }, 1000);
    return () => {
      window.clearTimeout(timer);
      abort.abort();
    };
  }, [center, locale]);

  const locateMe = () => {
    if (!("geolocation" in navigator)) {
      setGeo("failed");
      return;
    }
    setGeo("busy");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setGeo("idle");
        recenter({ latitude: coords.latitude, longitude: coords.longitude });
      },
      (error) => setGeo(error.code === error.PERMISSION_DENIED ? "denied" : "failed"),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  };

  const choose = (next: DeliveryLocation) => {
    setDeliveryLocation(next);
    onDone();
  };

  const nameOf = (address: SavedAddress) => address.label ?? address.city;
  const pinned = (addresses ?? []).filter((a) => a.latitude !== null && a.longitude !== null);
  const unpinned = (addresses ?? []).filter((a) => a.latitude === null || a.longitude === null);
  const areaName = place.area ?? place.city;

  const confirm = () => {
    if (pinFor) {
      setPin.mutate(
        { id: pinFor.id, ...center },
        {
          onSuccess: () =>
            choose({ label: nameOf(pinFor), ...center, area: areaName ?? undefined, addressId: pinFor.id }),
        },
      );
      return;
    }
    choose({ label: areaName ?? t("الموقع المحدد", "Pinned location"), ...center, area: areaName ?? undefined });
  };

  return (
    <div className="lq-sheet__body lq-locpick">
      <button type="button" className="lq-btn lq-btn--secondary lq-btn--block" onClick={locateMe}aria-busy={geo === "busy"}>
        <span className="lq-icon" data-icon="map-pin" aria-hidden="true" />
        {geo === "busy" ? t("جارٍ تحديد موقعك…", "Finding you…") : t("استخدم موقعي الحالي", "Use my current location")}
      </button>
      {geo === "denied" || geo === "failed" ? (
        <p className="lq-hint lq-hint--error" role="alert">
          {geo === "denied"
            ? t(
                "لم يُسمح بالوصول إلى موقعك. فعّل إذن الموقع من إعدادات المتصفح، أو حرّك الخريطة إلى عنوانك.",
                "Location access was not allowed. Turn it on in your browser settings, or move the map to your address.",
              )
            : t(
                "تعذّر تحديد موقعك الآن. حرّك الخريطة إلى عنوانك، أو اختر عنوانًا محفوظًا.",
                "We could not find your location right now. Move the map to your address, or pick a saved one.",
              )}
        </p>
      ) : null}

      {signedIn && addresses && addresses.length > 0 ? (
        <section className="lq-locpick__saved" aria-label={t("عناويني", "My addresses")}>
          <h3 className="lq-label">{t("عناويني", "My addresses")}</h3>
          <ul>
            {pinned.map((address) => (
              <li key={address.id}>
                <button
                  type="button"
                  className="lq-row"
                  aria-current={chosen?.addressId === address.id ? "true" : undefined}
                  onClick={() =>
                    choose({
                      label: nameOf(address),
                      latitude: address.latitude!,
                      longitude: address.longitude!,
                      area: address.city,
                      addressId: address.id,
                    })
                  }
                >
                  <span className="lq-icon" data-icon="house" aria-hidden="true" />
                  <span className="lq-locpick__addr">
                    <b data-bidi>{nameOf(address)}</b>
                    <small data-bidi>{[address.street, address.city].join("، ")}</small>
                  </span>
                </button>
              </li>
            ))}
            {unpinned.map((address) => (
              <li key={address.id} className="lq-row" data-pinning={pinFor?.id === address.id || undefined}>
                <span className="lq-icon" data-icon="house" aria-hidden="true" />
                <span className="lq-locpick__addr">
                  <b data-bidi>{nameOf(address)}</b>
                  <small data-bidi>{[address.street, address.city].join("، ")}</small>
                </span>
                <button
                  type="button"
                  className="lq-textlink"
                  aria-pressed={pinFor?.id === address.id}
                  onClick={() => setPinFor(pinFor?.id === address.id ? null : address)}
                >
                  {t("حدّده على الخريطة", "Pin it on the map")}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <LocationMap
        view={view}
        onMove={setCenter}
        label={t("الخريطة: حرّكها لتضع الدبوس على عنوانك", "Map: move it to put the pin on your address")}
      />

      <p className="lq-locpick__area" aria-live="polite" data-bidi>
        {pinFor
          ? t(`تحديد موقع «${nameOf(pinFor)}»: حرّك الخريطة إلى الباب.`, `Pinning “${nameOf(pinFor)}”: move the map to the door.`)
          : (areaName ?? t("حرّك الخريطة لتضع الدبوس على عنوانك.", "Move the map to put the pin on your address."))}
      </p>

      {setPin.isError ? (
        <p className="lq-hint lq-hint--error" role="alert">
          {t("لم يُحفظ الموقع. حاول مرة أخرى.", "The location was not saved. Try again.")}
        </p>
      ) : null}

      <button
        type="button"
        className="lq-btn lq-btn--primary lq-btn--lg lq-btn--block"
        onClick={confirm}
        aria-busy={setPin.isPending}
        disabled={setPin.isPending}
      >
        {pinFor ? t("احفظ الموقع لهذا العنوان", "Save this location to the address") : t("التوصيل إلى هنا", "Deliver here")}
      </button>

      {signedIn && !pinFor ? (
        <p className="lq-hint">
          {t(
            "يُحفظ العنوان في عناويني مع أول طلب إليه، ومنها تستطيع تحديده على الخريطة.",
            "An address joins My addresses with the first order sent to it; you can pin it on the map from here.",
          )}
        </p>
      ) : null}

      <p className="lq-hint">
        {t(
          "تُرتَّب المتاجر من الأقرب داخل متصفحك، فلا يصل موقعك إلى خوادمنا لهذا الغرض. ويُرسَل موضع الدبوس إلى OpenStreetMap لمعرفة اسم المنطقة.",
          "Shops are sorted nearest-first inside your browser, so your location does not reach our servers for that. The pin's position goes to OpenStreetMap to name the area.",
        )}
      </p>
    </div>
  );
}
