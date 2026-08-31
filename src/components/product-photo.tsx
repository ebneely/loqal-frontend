"use client";

import Image from "next/image";
import { useState } from "react";

import { Garment, garmentFor } from "@/components/garment";

/**
 * A product photo that cannot take its page down.
 *
 * `next/image` THROWS — during render, not load — on a remote src with no
 * matching `remotePatterns` entry, and `next.config.ts` reads those patterns
 * from LOQAL_MEDIA_HOST. On any deployment that has not set it, every product
 * with a `coverUrl` was a crashed grid and a crashed product page.
 * `shop-card.tsx` already dodged the same trap for logos with a plain `<img>`;
 * products get something better, because every product well already has a
 * drawn fallback: the garment line art its own no-photo branch uses.
 *
 * Two failure paths, one answer:
 *
 *   1. The host is not configured. Known at BUILD time via
 *      NEXT_PUBLIC_LOQAL_MEDIA_READY (see `next.config.ts`), so `Image` is
 *      never rendered and never throws.
 *   2. The host is configured and the file still does not load — a 404, a
 *      dead bucket, a phone that lost the network. `onError` swaps in the
 *      garment rather than leaving the browser's broken-image glyph in a
 *      3:4 well.
 *
 * SEEDED FROM `productId`, exactly like the no-photo branch, so a photo that
 * fails draws the SAME garment the product shows everywhere else it has no
 * photo — one identity per product, not a different drawing per failure.
 *
 * A component of its own because `product-card.tsx` is a server component and
 * an `onError` needs client state; `product-view.tsx` shares it so the two
 * call sites cannot drift.
 */
const MEDIA_READY = process.env.NEXT_PUBLIC_LOQAL_MEDIA_READY === "1";

export function ProductPhoto({
  src,
  alt,
  productId,
  sizes,
  priority = false,
}: {
  src: string;
  alt: string;
  /** Seeds the fallback drawing — the same key the no-photo branch uses. */
  productId: string;
  sizes: string;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);

  if (!MEDIA_READY || failed) {
    return <Garment className="lq-garment" kind={garmentFor(productId)} />;
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      onError={() => setFailed(true)}
    />
  );
}
