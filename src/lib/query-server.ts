import "server-only";

import { QueryClient, defaultShouldDehydrateQuery } from "@tanstack/react-query";
import { cache } from "react";

/**
 * The server's QueryClient, one per request.
 *
 * `cache()` is React's per-request memo: every server component in one render
 * gets the SAME client, so a layout prefetching the cart and a page prefetching
 * the same cart issue one request, not two — but the next request gets a fresh
 * one. Without it, two shoppers rendering concurrently could share a cache,
 * which on a storefront means serving one person's bag to another.
 *
 * Deliberately separate from lib/query.tsx: that file is "use client" and its
 * browser singleton must never be reachable from a server render.
 */
export const getServerQueryClient = cache(
  () =>
    new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60_000,
        },
        dehydrate: {
          // Pending queries are dehydrated too, which is what lets a server
          // component start a prefetch without awaiting it and stream the
          // result. See the same setting in lib/query.tsx.
          shouldDehydrateQuery: (query) =>
            defaultShouldDehydrateQuery(query) || query.state.status === "pending",
        },
      },
    })
);
