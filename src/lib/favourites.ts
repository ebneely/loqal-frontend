"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  favouriteIdsSchema,
  favouritesSchema,
  type FavouriteIds,
} from "@loqal/contracts/storefront.contract";
import { ApiError, api } from "./api";
import { useSession } from "./auth-client";
import {
  EMPTY_SAVED,
  favouriteStore,
  isSaved,
  syncGuestFavourites,
  toggleSaved,
  type FavouriteTarget,
  type Saved,
} from "./favourites-store";

/**
 * Favourites: the account's list when signed in, this browser's otherwise.
 *
 * SHIPS AHEAD OF ITS API. Until `/v1/favourites/ids` answers, a signed-in
 * shopper is treated like a guest — the hearts keep working in this browser,
 * and the next sign-in pushes them up. Nothing here shows an error for a
 * route that does not exist yet.
 */
export const favouriteKeys = {
  ids: (userId: string | null) => ["favourite-ids", userId] as const,
  list: (userId: string | null) => ["favourites", userId] as const,
};

const pathOf = (kind: FavouriteTarget["kind"], id: string) =>
  `/v1/favourites/${kind === "shop" ? "shops" : "products"}/${encodeURIComponent(id)}`;

const isMissing = (error: unknown) => error instanceof ApiError && error.isNotFound;

function useUserId(): string | null {
  const { data } = useSession();
  return data?.user?.id ?? null;
}

/** The guest list. Empty on the server and in the hydration pass. */
export function useSavedLocal(): Saved {
  return useSyncExternalStore(favouriteStore.subscribe, favouriteStore.get, () => EMPTY_SAVED);
}

function useFavouriteIds(userId: string | null) {
  return useQuery({
    queryKey: favouriteKeys.ids(userId),
    queryFn: () => api.get(favouriteIdsSchema, "/v1/favourites/ids"),
    enabled: userId != null,
    staleTime: 60_000,
    retry: false,
  });
}

/** One heart: whether it is on, and the tap that flips it. */
export function useFavourite(target: FavouriteTarget) {
  const userId = useUserId();
  const ids = useFavouriteIds(userId);
  const saved = useSavedLocal();
  const client = useQueryClient();
  const key = favouriteKeys.ids(userId);
  const field = target.kind === "shop" ? "shopIds" : "productIds";
  const id = target.item.id;
  const remote = userId != null && ids.isSuccess;

  const mutation = useMutation({
    mutationFn: (on: boolean) =>
      on ? api.put(z.unknown(), pathOf(target.kind, id)) : api.delete(z.unknown(), pathOf(target.kind, id)),
    // Optimistic: the heart fills on the tap, and goes back if the API refuses.
    onMutate: async (on: boolean) => {
      await client.cancelQueries({ queryKey: key });
      const previous = client.getQueryData<FavouriteIds>(key);
      if (previous) {
        const rest = previous[field].filter((entry) => entry !== id);
        client.setQueryData<FavouriteIds>(key, { ...previous, [field]: on ? [...rest, id] : rest });
      }
      return { previous };
    },
    onError: (_error, _on, context) => {
      if (context?.previous) client.setQueryData(key, context.previous);
    },
    onSettled: () => client.invalidateQueries({ queryKey: favouriteKeys.list(userId) }),
  });

  const on = remote ? ids.data[field].includes(id) : isSaved(saved, target);

  const toggle = () => {
    if (remote) mutation.mutate(!on);
    else favouriteStore.set(toggleSaved(favouriteStore.get(), target));
  };

  return { on, toggle, failed: mutation.isError };
}

/** The account's full list, for the «المفضلة» tab. Disabled for a guest. */
export function useFavouriteList() {
  const userId = useUserId();
  const list = useQuery({
    queryKey: favouriteKeys.list(userId),
    queryFn: () => api.get(favouritesSchema, "/v1/favourites"),
    enabled: userId != null,
    staleTime: 30_000,
    retry: false,
  });
  return { userId, list };
}

/**
 * Mounted once, in the layout: when somebody signs in, the hearts they set as
 * a guest go up to their account, and then the account's ids are read again.
 * Whatever did not go up stays in the browser for next time.
 */
export function FavouritesSync() {
  const userId = useUserId();
  const client = useQueryClient();
  const synced = useRef<string | null>(null);

  useEffect(() => {
    if (!userId || synced.current === userId) return;
    synced.current = userId;
    const saved = favouriteStore.get();
    if (saved.shops.length + saved.products.length === 0) return;

    void syncGuestFavourites(saved, (kind, id) => api.put(z.unknown(), pathOf(kind, id)), isMissing).then(
      (left) => {
        favouriteStore.set(left);
        return client.invalidateQueries({ queryKey: favouriteKeys.ids(userId) });
      },
    );
  }, [userId, client]);

  return null;
}
