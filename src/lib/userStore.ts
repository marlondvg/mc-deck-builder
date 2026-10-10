import { useCallback, useSyncExternalStore } from "react";
import { useAuth } from "./auth";

// Per-user data saved in localStorage under `<prefix><username>`, shared by
// every component that uses it and kept in sync across tabs. Move to the
// backend once real accounts exist.

interface Options<T> {
  prefix: string;
  empty: T;
  /** Turn the stored JSON back into a value; throw or return `empty` on bad data. */
  parse: (raw: unknown) => T;
  serialize: (value: T) => unknown;
}

export function createUserStore<T>({ prefix, empty, parse, serialize }: Options<T>) {
  const cache = new Map<string, T>();
  const listeners = new Set<() => void>();

  function read(username: string | null): T {
    if (!username) return empty;
    if (cache.has(username)) return cache.get(username)!;
    let value = empty;
    try {
      const raw = localStorage.getItem(prefix + username);
      if (raw) value = parse(JSON.parse(raw));
    } catch {
      /* storage unavailable or bad data: start empty */
    }
    cache.set(username, value);
    return value;
  }

  function write(username: string, value: T) {
    cache.set(username, value);
    try {
      localStorage.setItem(prefix + username, JSON.stringify(serialize(value)));
    } catch {
      /* storage unavailable: keep in memory only */
    }
    listeners.forEach((l) => l());
  }

  function subscribe(listener: () => void) {
    listeners.add(listener);
    // Pick up changes made in another tab.
    const onStorage = (e: StorageEvent) => {
      if (e.key?.startsWith(prefix)) {
        cache.clear();
        listener();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  }

  /** The signed-in user's value, and `update` to change it (no-op when signed out). */
  return function useUserStore() {
    const { username } = useAuth();
    const value = useSyncExternalStore(subscribe, () => read(username));
    const update = useCallback(
      (change: (current: T) => T) => {
        if (username) write(username, change(read(username)));
      },
      [username],
    );
    return [value, update] as const;
  };
}
