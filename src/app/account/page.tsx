import type { Metadata } from "next";

import { AccountView } from "./account-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "حسابي",
  robots: { index: false, follow: false },
};

export default function AccountPage() {
  return <AccountView />;
}
