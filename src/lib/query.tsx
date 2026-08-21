"use client";

import {
  QueryClient,
  QueryClientProvider,
  isServer,
  defaultShouldDehydrateQuery,
} from "@tanstack/react-query";
import { useState } from "react";
import type { ReactNode } from "react";

import { ApiError } from "./api";

/**
 * The TanStack Query client, configured once for both renders.
 *
 * `staleTime` is 60s and not 0 for a specific reason: with App Router
 * prefetching, a query that is stale the instant it hydrates refetches on the
 * client immediately, and the server render was wasted. Sixty seconds is long
 * enough that a page handed over from the server is trusted, short enough that
 * a shopper who leaves a tab open does not decide on yesterday's stock.
 */
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: 5 * 60_000,
        // The window regaining focus is not evidence anything changed, and on a
        // phone it fires every time the shopper checks a message.
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          // A 404 is an answer, not a failure — retrying it three times just
          // delays the empty state. Same for a refusal.
          if (error instanceof ApiError) {
            if (error.isNotFound || error.isPermissionDenied || error.isUnauthenticated) {
              return false;
            }
            if (error.statusCode >= 400 && error.statusCode < 500) return false;
          }
          return failureCount < 2;
        },
      },
      mutations: {
        // A mutation that failed is a decision for the screen to explain, never
        // something to quietly repeat — a second POST /orders is a second order.
        retry: false,
      },
      dehydrate: {
        /**
         * Dehydrate queries that are still PENDING as well as settled ones.
         * This is what lets a server component call `prefetchQuery` without
         * awaiting it: the promise is streamed to the client and resolves
         * there, so a slow panel does not hold up the whole document.
         * Requires @tanstack/react-query >= 5.40.
         */
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) || query.state.status === "pending",
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

/**
 * A NEW client per request on the server, a singleton in the browser.
 *
 * The server rule is not a preference: one shared client across requests would
 * serve one shopper's cart out of another shopper's cache. The browser rule
 * avoids throwing the cache away on every render.
 */
export function getQueryClient() {
  if (isServer) return makeQueryClient();
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}

export function QueryProvider({ children }: { children: ReactNode }) {
  // useState, not useMemo: React may throw away and re-run a useMemo, and a
  // discarded QueryClient takes every in-flight request with it.
  const [client] = useState(getQueryClient);

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
