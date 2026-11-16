/**
 * One value kept in localStorage, shared by every reader in the tab.
 *
 * The same rules as `delivery-location.ts`: storage is a convenience, never a
 * dependency. A private window, blocked site data or a full quota throws, and
 * the value then lives in memory for the rest of the visit. Another tab's
 * write arrives through the `storage` event.
 *
 * `storage` is injectable so the store can be tested without a browser.
 */
export type LocalStore<T> = {
  get(): T;
  set(next: T): void;
  subscribe(listener: () => void): () => void;
};

export function createLocalStore<T>(
  key: string,
  parse: (raw: unknown) => T,
  empty: T,
  storage: () => Storage | null = () => (typeof window === "undefined" ? null : window.localStorage),
): LocalStore<T> {
  const listeners = new Set<() => void>();
  /** `undefined` until first read; then the one copy every reader shares. */
  let current: T | undefined;

  const read = (): T => {
    try {
      const raw = storage()?.getItem(key);
      return raw ? parse(JSON.parse(raw)) : empty;
    } catch {
      return empty;
    }
  };

  return {
    get() {
      if (current === undefined) current = read();
      return current;
    },
    set(next) {
      current = next;
      try {
        storage()?.setItem(key, JSON.stringify(next));
      } catch {
        /* Memory only for this visit. */
      }
      listeners.forEach((listener) => listener());
    },
    subscribe(listener) {
      listeners.add(listener);
      const onStorage = (event: StorageEvent) => {
        if (event.key !== key) return;
        current = undefined;
        listener();
      };
      if (typeof window !== "undefined") window.addEventListener("storage", onStorage);
      return () => {
        listeners.delete(listener);
        if (typeof window !== "undefined") window.removeEventListener("storage", onStorage);
      };
    },
  };
}
