import { defineConfig } from "eslint/config";
import next from "eslint-config-next/core-web-vitals";

/**
 * ESLint 9 flat config, run by the ESLint CLI.
 *
 * Next 16 removed `next lint` and `next build` no longer lints, so this is the
 * only thing that does — `npm run lint`, and CI has to call it explicitly.
 *
 * `eslint-config-next` ships native flat config in 16, so it is imported
 * directly. Wrapping it in `FlatCompat` (which the 15-era setup needed) throws
 * "Converting circular structure to JSON" on the react plugin.
 */
export default defineConfig([
  {
    /**
     * The mockups are a read-only reference of hand-written HTML and a vendored
     * design system. They are not application source and must never be linted.
     */
    ignores: [
      "Talabat-style storefront UI mockups/**",
      ".next/**",
      "node_modules/**",
    ],
  },
  next,
]);
