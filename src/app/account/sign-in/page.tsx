import type { Metadata } from "next";
import { Suspense } from "react";

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
 * The Suspense boundary is not decoration: the view reads `?next=` with
 * `useSearchParams`, and Next refuses to build a page that does so without one.
 */
export default function SignInPage() {
  return (
    <Suspense fallback={<div className="lq-gate" />}>
      <SignInView />
    </Suspense>
  );
}
