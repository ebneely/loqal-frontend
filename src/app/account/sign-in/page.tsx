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
 * The photo panel shows a real shop, never a stock picture: the first shop
 * photo from the same cached `/v1/brands` read the home page makes. The read is
 * capped at two seconds and any failure is `null`, which draws the plain green
 * plate — a sign-in form must never wait on, or fail because of, a picture.
 */
async function shopPhoto(): Promise<string | null> {
  const read = fetchBrands(1, 24).then(
    (page) => page.items.map((shop) => shop.images[0] ?? shop.coverUrl).find(Boolean) ?? null,
    () => null
  );
  const late = new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000));
  return Promise.race([read, late]);
}

/**
 * The Suspense boundary is not decoration: the view reads `?next=` with
 * `useSearchParams`, and Next refuses to build a page that does so without one.
 */
export default async function SignInPage() {
  const photo = await shopPhoto();

  return (
    <Suspense fallback={<main className="lq-signin" />}>
      <SignInView photo={photo} />
    </Suspense>
  );
}
