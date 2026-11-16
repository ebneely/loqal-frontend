import { useSyncExternalStore } from "react";

import { createLocalStore } from "./local-store";

/**
 * The shopper's last searches, newest first, kept in this browser only. They
 * are shown when the search field is focused while empty, and «مسح» empties
 * them. Never sent anywhere.
 */
export const RECENT_MAX = 8;

const parse = (raw: unknown): string[] =>
  Array.isArray(raw)
    ? raw.filter((entry): entry is string => typeof entry === "string").slice(0, RECENT_MAX)
    : [];

/** Adds a term to the front; the same words in any case count once. */
export function addRecent(list: readonly string[], term: string, max = RECENT_MAX): string[] {
  const clean = term.trim().replace(/\s+/g, " ").slice(0, 200);
  if (!clean) return [...list];
  const same = clean.toLocaleLowerCase();
  return [clean, ...list.filter((entry) => entry.toLocaleLowerCase() !== same)].slice(0, max);
}

export const recentSearches = createLocalStore<string[]>("lq:recent-searches", parse, []);

export const rememberSearch = (term: string) =>
  recentSearches.set(addRecent(recentSearches.get(), term));

export const clearRecentSearches = () => recentSearches.set([]);

const NONE: string[] = [];

/** Empty on the server and in the hydration pass, so the HTML never tears. */
export function useRecentSearches(): string[] {
  return useSyncExternalStore(recentSearches.subscribe, recentSearches.get, () => NONE);
}
