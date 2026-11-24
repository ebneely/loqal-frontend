import type { Metadata } from "next";
import { Suspense } from "react";

import { fetchBrands } from "@/lib/catalog";
import { SignInView } from "./sign-in-view";

/**
 * Signing in.
 *
 * Dynamic and noindex: this is a credential form, and there is nothing here
 * worth a crawler's time or an ISR entry.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "الدخول",
  robots: { index: false, follow: false },
};

/**
 * The panel's front layer shows real shops, never stock pictures: up to three
 * shop photos from the same cached `/v1/brands` read the home page makes. The
 * read is capped at two seconds and any failure is `[]`, which draws garment
 * line art in the frames instead — a sign-in form must never wait on, or fail
 * because of, a picture.
 */
async function shopPhotos(): Promise<string[]> {
  const read = fetchBrands(1, 24).then(
    (page) =>
      [...new Set(page.items.map((shop) => shop.images[0] ?? shop.coverUrl).filter(Boolean))].slice(
        0,
        3
      ) as string[],
    () => []
  );
  const late = new Promise<string[]>((resolve) => setTimeout(() => resolve([]), 2000));
  return Promise.race([read, late]);
}

/**
 * The Suspense boundary is not decoration: the view reads `?next=` with
 * `useSearchParams`, and Next refuses to build a page that does so without one.
 */
export default async function SignInPage() {
  const photos = await shopPhotos();

  return (
    <Suspense fallback={<main className="lq-signin" />}>
      <SignInView photos={photos} />
    </Suspense>
  );
}
