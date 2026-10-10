import { useCallback, useSyncExternalStore } from "react";
import { useAuth } from "./auth";

// The packs each user owns, saved in localStorage per username.
// Move to the backend once real accounts exist.

const keyFor = (username: string) => `mcdb:collection:${username}`;

const EMPTY: ReadonlySet<string> = new Set();
const cache = new Map<string, ReadonlySet<string>>();
const listeners = new Set<() => void>();

function read(username: string | null): ReadonlySet<string> {
  if (!username) return EMPTY;
  const cached = cache.get(username);
  if (cached) return cached;
  let codes: string[] = [];
  try {
    const raw = localStorage.getItem(keyFor(username));
    if (raw) codes = JSON.parse(raw);
  } catch {
    /* storage unavailable or bad data: start empty */
  }
  const owned = new Set(Array.isArray(codes) ? codes : []);
  cache.set(username, owned);
  return owned;
}

function write(username: string, owned: ReadonlySet<string>) {
  cache.set(username, owned);
  try {
    localStorage.setItem(keyFor(username), JSON.stringify([...owned]));
  } catch {
    /* storage unavailable: keep in memory only */
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Pick up changes made in another tab.
  const onStorage = (e: StorageEvent) => {
    if (e.key?.startsWith("mcdb:collection:")) {
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

/** The signed-in user's owned pack codes, and functions to change them. */
export function useCollection() {
  const { username } = useAuth();
  const owned = useSyncExternalStore(subscribe, () => read(username));

  /** Mark the given packs as owned (true) or not owned (false). */
  const setOwned = useCallback(
    (codes: string[], value: boolean) => {
      if (!username) return;
      const next = new Set(read(username));
      for (const code of codes) {
        if (value) next.add(code);
        else next.delete(code);
      }
      write(username, next);
    },
    [username],
  );

  const toggle = useCallback(
    (code: string) => setOwned([code], !read(username).has(code)),
    [setOwned, username],
  );

  return { owned, setOwned, toggle };
}
