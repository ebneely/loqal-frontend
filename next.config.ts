import path from "node:path";

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Where Turbopack should consider the project root.
   *
   * Turbopack finds the root by walking UP for a lockfile. This app is an npm
   * workspace, so the lockfile — and almost every dependency, hoisted — lives
   * two directories above it. Left to guess, Turbopack rooted itself at the app
   * and then could not resolve `react`, `zod`, `@tanstack/react-query` or even
   * its own `@swc/helpers`; the identical build under `--webpack` succeeded,
   * which is what identified this as resolution rather than code.
   *
   * Pointed at the monorepo root, so the hoisted `node_modules` is inside it.
   * Harmless if this app is ever extracted to a repository of its own: the
   * lockfile would then be here and this resolves to the same directory.
   */
  turbopack: {
    root: path.join(import.meta.dirname, "..", ".."),
  },

  /**
   * Dev only. The dev server refuses `/_next/*` for any origin not listed here,
   * and the default list does not include `127.0.0.1` — so opening the app at
   * http://127.0.0.1:3000 answered 403 on seven chunks, React never hydrated,
   * and every handler in the chrome was dead while CSS hover still worked.
   */
  allowedDevOrigins: ["127.0.0.1", "localhost", "0.0.0.0"],

  /*
   * No `transpilePackages` for @loqal/contracts: the schemas are VENDORED into
   * src/contracts and `@loqal/contracts/*` is a tsconfig path alias onto them,
   * exactly as the dashboard does it. This repository has to build on its own,
   * and a package alias reaching up out of the checkout does not.
   *
   * The cost is a second copy that can drift from packages/contracts. That is
   * the same trade the dashboard already made, and it is why the backend keeps
   * its own response schemas too — see the parity spec there.
   */

  /*
   * There is no `eslint` key here on purpose. Next 16 removed `next lint`
   * outright and `next build` no longer lints at all, so the option does
   * nothing — linting is the ESLint CLI's job now and the scope lives in
   * eslint.config.mjs. Anything relying on the build to catch lint errors has
   * to run `npm run lint` explicitly.
   */

  /**
   * Whether `remotePatterns` below is populated, exposed to client code as a
   * build-time boolean. `next/image` THROWS on a remote src with no matching
   * pattern, so on a deployment that never set LOQAL_MEDIA_HOST every product
   * photo would take its whole page down — `shop-card.tsx` already dodged this
   * with a plain `<img>`, and `product-photo.tsx` reads this flag to fall back
   * to the garment drawing instead. "1"/"" rather than a real boolean because
   * `env` values are inlined as strings.
   */
  env: {
    NEXT_PUBLIC_LOQAL_MEDIA_READY: process.env.LOQAL_MEDIA_HOST ? "1" : "",
  },

  /**
   * Product photography is brand-supplied and arrives from the API's media
   * host, so the remote patterns are read from the environment rather than
   * hardcoded — a storefront that only renders images from a domain baked
   * into the bundle cannot be pointed at a staging bucket.
   */
  images: {
    remotePatterns: process.env.LOQAL_MEDIA_HOST
      ? [{ protocol: "https", hostname: process.env.LOQAL_MEDIA_HOST }]
      : [],
    // The design system's photo wells are all 3:4; these are the widths a
    // 2-up phone grid and a 4-up desktop grid actually request.
    deviceSizes: [390, 640, 768, 1024, 1280, 1600],
    imageSizes: [96, 128, 192, 256, 384],
  },
};

export default nextConfig;
