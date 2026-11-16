import { describe, expect, it, vi } from "vitest";

import { createLocalStore } from "../local-store";
import { RECENT_MAX, addRecent } from "../recent-searches";
import {
  EMPTY_SAVED,
  isSaved,
  syncGuestFavourites,
  toggleSaved,
  type FavouriteTarget,
} from "../favourites-store";

/** A Map-backed stand-in for localStorage. */
function memoryStorage(seed: Record<string, string> = {}): Storage {
  const data = new Map(Object.entries(seed));
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (key) => data.get(key) ?? null,
    key: (index) => [...data.keys()][index] ?? null,
    removeItem: (key) => void data.delete(key),
    setItem: (key, value) => void data.set(key, value),
  };
}

const asList = (raw: unknown) => (Array.isArray(raw) ? (raw as string[]) : []);

describe("createLocalStore", () => {
  it("reads what is stored, writes through, and tells its listeners", () => {
    const storage = memoryStorage({ k: JSON.stringify(["a"]) });
    const store = createLocalStore("k", asList, [], () => storage);
    expect(store.get()).toEqual(["a"]);

    const listener = vi.fn();
    const stop = store.subscribe(listener);
    store.set(["b"]);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(storage.getItem("k")).toBe(JSON.stringify(["b"]));
    stop();
  });

  it("falls back to the empty value on garbage, and to memory when storage throws", () => {
    expect(createLocalStore("k", asList, [], () => memoryStorage({ k: "{not json" })).get()).toEqual([]);

    const throwing = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    } as unknown as Storage;
    const store = createLocalStore("k", asList, [], () => throwing);
    expect(store.get()).toEqual([]);
    store.set(["kept in memory"]);
    expect(store.get()).toEqual(["kept in memory"]);
  });
});

describe("addRecent", () => {
  it("puts the newest first, trims it, and keeps one copy whatever the case", () => {
    expect(addRecent(["قميص", "Hoodie"], "  hoodie ")).toEqual(["hoodie", "قميص"]);
    expect(addRecent([], "  جاكيت   جلد ")).toEqual(["جاكيت جلد"]);
  });

  it("ignores blank words and keeps at most eight", () => {
    expect(addRecent(["a"], "   ")).toEqual(["a"]);
    const full = Array.from({ length: RECENT_MAX }, (_, i) => `t${i}`);
    const next = addRecent(full, "new");
    expect(next).toHaveLength(RECENT_MAX);
    expect(next[0]).toBe("new");
    expect(next).not.toContain(`t${RECENT_MAX - 1}`);
  });
});

const shop: FavouriteTarget = { kind: "shop", item: { id: "s1", slug: "dryp", name: "Dryp" } };
const piece: FavouriteTarget = {
  kind: "product",
  item: { id: "p1", slug: "tee", brandSlug: "dryp", brandName: "Dryp", name: { ar: "تيشيرت" } },
};

describe("favourites store", () => {
  it("toggles a shop and a piece in and out, newest first", () => {
    const one = toggleSaved(EMPTY_SAVED, shop);
    expect(isSaved(one, shop)).toBe(true);
    expect(isSaved(one, piece)).toBe(false);

    const two = toggleSaved(one, piece);
    expect(two.products.map((p) => p.id)).toEqual(["p1"]);

    const back = toggleSaved(two, shop);
    expect(isSaved(back, shop)).toBe(false);
    expect(isSaved(back, piece)).toBe(true);
  });

  it("pushes every id once and keeps only what failed", async () => {
    const saved = toggleSaved(toggleSaved(EMPTY_SAVED, shop), piece);
    const put = vi.fn(async (kind: string, id: string) => {
      if (id === "p1") throw new Error("network");
      return kind;
    });
    const left = await syncGuestFavourites(saved, put, () => false);
    expect(put).toHaveBeenCalledTimes(2);
    expect(left).toEqual({ shops: [], products: [piece.item] });
  });

  it("stops at the first 404: the API has no favourites yet", async () => {
    const saved = toggleSaved(toggleSaved(EMPTY_SAVED, shop), piece);
    const put = vi.fn(async () => {
      throw new Error("404");
    });
    const left = await syncGuestFavourites(saved, put, () => true);
    expect(put).toHaveBeenCalledTimes(1);
    expect(left).toEqual(saved);
  });
});
