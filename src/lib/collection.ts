import { useCallback } from "react";
import { createUserStore } from "./userStore";

// The packs each user owns, saved per username (`mcdb:collection:<username>`).

const useOwnedStore = createUserStore<ReadonlySet<string>>({
  prefix: "mcdb:collection:",
  empty: new Set(),
  parse: (raw) => new Set(Array.isArray(raw) ? raw.filter((c) => typeof c === "string") : []),
  serialize: (owned) => [...owned],
});

/** The signed-in user's owned pack codes, and functions to change them. */
export function useCollection() {
  const [owned, update] = useOwnedStore();

  /** Mark the given packs as owned (true) or not owned (false). */
  const setOwned = useCallback(
    (codes: string[], value: boolean) =>
      update((current) => {
        const next = new Set(current);
        for (const code of codes) {
          if (value) next.add(code);
          else next.delete(code);
        }
        return next;
      }),
    [update],
  );

  const toggle = useCallback(
    (code: string) =>
      update((current) => {
        const next = new Set(current);
        if (!next.delete(code)) next.add(code);
        return next;
      }),
    [update],
  );

  return { owned, setOwned, toggle };
}
