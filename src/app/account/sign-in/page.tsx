import type { Metadata } from "next";

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

export default function SignInPage() {
  return <SignInView />;
}
