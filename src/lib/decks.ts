import { useCallback } from "react";
import type { Deck } from "./deckRules";
import { createUserStore } from "./userStore";

// Each user's decks, saved per username (`mcdb:decks:<username>`).

const isDeck = (d: unknown): d is Deck =>
  !!d &&
  typeof d === "object" &&
  typeof (d as Deck).id === "string" &&
  typeof (d as Deck).heroCode === "string" &&
  !!(d as Deck).slots &&
  typeof (d as Deck).slots === "object";

const useDeckStore = createUserStore<readonly Deck[]>({
  prefix: "mcdb:decks:",
  empty: [],
  parse: (raw) => (Array.isArray(raw) ? raw.filter(isDeck) : []),
  serialize: (decks) => decks,
});

const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

/** The signed-in user's decks, newest change first, and functions to change them. */
export function useDecks() {
  const [decks, update] = useDeckStore();

  /** Saves a new deck and returns its id. */
  const createDeck = useCallback(
    (fields: Pick<Deck, "name" | "heroCode" | "aspects" | "slots">) => {
      const now = new Date().toISOString();
      const deck: Deck = { ...fields, id: newId(), createdAt: now, updatedAt: now };
      update((current) => [deck, ...current]);
      return deck.id;
    },
    [update],
  );

  const updateDeck = useCallback(
    (id: string, change: (deck: Deck) => Partial<Deck>) =>
      update((current) =>
        current.map((d) =>
          d.id === id ? { ...d, ...change(d), updatedAt: new Date().toISOString() } : d,
        ),
      ),
    [update],
  );

  const sorted = [...decks].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return { decks: sorted, createDeck, updateDeck };
}
