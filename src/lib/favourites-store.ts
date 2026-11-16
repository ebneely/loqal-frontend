import { z } from "zod";

import { createLocalStore } from "./local-store";

/**
 * A GUEST'S favourites, kept in this browser until they sign in.
 *
 * Each entry keeps the little it needs to be listed without the API (a name
 * and an address), because there is no public read of a product by id. No
 * photo: the media URLs are presigned and would be dead by the next visit.
 *
 * On sign-in the ids are pushed to the account (see `syncGuestFavourites`)
 * and the account becomes the only list.
 */
const savedShopSchema = z.object({ id: z.string(), slug: z.string(), name: z.string() });
const savedPieceSchema = z.object({
  id: z.string(),
  slug: z.string(),
  brandSlug: z.string(),
  brandName: z.string(),
  name: z.object({ ar: z.string().optional(), en: z.string().optional() }).nullable(),
});
const savedSchema = z.object({
  shops: z.array(savedShopSchema),
  products: z.array(savedPieceSchema),
});

export type SavedShop = z.infer<typeof savedShopSchema>;
export type SavedPiece = z.infer<typeof savedPieceSchema>;
export type Saved = z.infer<typeof savedSchema>;
export type FavouriteTarget =
  | { kind: "shop"; item: SavedShop }
  | { kind: "product"; item: SavedPiece };

/** Enough to be a list; a cap so a stuck tap cannot fill the quota. */
const MAX = 200;

export const EMPTY_SAVED: Saved = { shops: [], products: [] };

const parse = (raw: unknown): Saved => {
  const parsed = savedSchema.safeParse(raw);
  return parsed.success ? parsed.data : EMPTY_SAVED;
};

export const favouriteStore = createLocalStore<Saved>("lq:favourites", parse, EMPTY_SAVED);

export function isSaved(saved: Saved, target: FavouriteTarget): boolean {
  const list = target.kind === "shop" ? saved.shops : saved.products;
  return list.some((entry) => entry.id === target.item.id);
}

/** In if it was out, out if it was in. Newest first. */
export function toggleSaved(saved: Saved, target: FavouriteTarget): Saved {
  const on = isSaved(saved, target);
  if (target.kind === "shop") {
    const rest = saved.shops.filter((entry) => entry.id !== target.item.id);
    return { ...saved, shops: on ? rest : [target.item, ...rest].slice(0, MAX) };
  }
  const rest = saved.products.filter((entry) => entry.id !== target.item.id);
  return { ...saved, products: on ? rest : [target.item, ...rest].slice(0, MAX) };
}

/**
 * Pushes every guest favourite to the account, one PUT each (they are
 * idempotent). Returns what is still only in the browser: whatever failed,
 * and everything after a 404, which means this API has no favourites yet and
 * the rest would only 404 too.
 */
export async function syncGuestFavourites(
  saved: Saved,
  put: (kind: "shop" | "product", id: string) => Promise<unknown>,
  isMissing: (error: unknown) => boolean,
): Promise<Saved> {
  const left: Saved = { shops: [], products: [] };
  let missing = false;

  for (const shop of saved.shops) {
    if (missing) {
      left.shops.push(shop);
      continue;
    }
    try {
      await put("shop", shop.id);
    } catch (error) {
      missing = isMissing(error);
      left.shops.push(shop);
    }
  }
  for (const piece of saved.products) {
    if (missing) {
      left.products.push(piece);
      continue;
    }
    try {
      await put("product", piece.id);
    } catch (error) {
      missing = isMissing(error);
      left.products.push(piece);
    }
  }
  return left;
}
