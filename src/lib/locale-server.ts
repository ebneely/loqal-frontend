import { cookies } from "next/headers";

import { defaultLocale, isLocale, LOCALE_COOKIE, type Locale } from "./locale";

/**
 * The language, resolved on the SERVER, so the HTML arrives in it.
 *
 * This is the decision `locale-context.tsx` used to defer to the client, and
 * the cost it named turned out to be two bugs rather than one frame: the chrome
 * swapped to English on hydration while every server-rendered string on the
 * catalogue pages stayed Arabic forever, and a reload flashed Arabic before
 * settling back.
 *
 * It marks these routes dynamic. The catalogue reads keep their own `next:
 * { revalidate }`, so a request still costs a React render and no database
 * round trip.
 */
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return value && isLocale(value) ? value : defaultLocale;
}
