import type { Card, Pack } from "../api/types";
import { firstPrintings, printingKey } from "./reprints";

// Deck building rules for Marvel Champions, on top of MarvelCDB's card data.

export const DECK_MIN = 40;
export const DECK_MAX = 50;

/** Aspects a hero can pick. Pool (from Deadpool) is open to every hero. */
export const ASPECTS = ["aggression", "justice", "leadership", "protection", "pool"] as const;
export type Aspect = (typeof ASPECTS)[number];

export const ASPECT_NAMES: Record<Aspect, string> = {
  aggression: "Aggression",
  justice: "Justice",
  leadership: "Leadership",
  protection: "Protection",
  pool: "Pool",
};

const PLAYER_TYPES = new Set([
  "ally",
  "event",
  "resource",
  "support",
  "upgrade",
  "player_side_scheme",
]);

// Back faces of double-sided cards and exact reprints are never picked directly.
const isPickable = (c: Card) => !c.hidden && !c.duplicate_of_code;

/** Copies allowed of a card in one deck. */
export const deckLimit = (c: Card) => c.deck_limit ?? 3;

/**
 * One entry per hero: the first hero card of each hero set. Heroes with
 * several hero cards (Ant-Man, Ironheart…) still show up once.
 */
export function heroChoices(cards: Card[]): Card[] {
  const bySet = new Map<string, Card>();
  for (const c of cards) {
    if (c.type_code !== "hero" || !isPickable(c) || !c.card_set_code) continue;
    const current = bySet.get(c.card_set_code);
    if (!current || c.code < current.code) bySet.set(c.card_set_code, c);
  }
  return [...bySet.values()];
}

/** The hero's own cards, which every deck for that hero must include. */
export function signatureCards(cards: Card[], hero: Card): Card[] {
  return cards.filter(
    (c) =>
      c.card_set_code === hero.card_set_code &&
      PLAYER_TYPES.has(c.type_code) &&
      isPickable(c),
  );
}

/**
 * Cards a deck with these aspects can add: aspect and Basic cards that don't
 * belong to a hero or special set, one printing each (the first released).
 */
export function deckPool(cards: Card[], aspects: string[], packs: Pack[] | undefined): Card[] {
  const allowed = new Set([...aspects, "basic"]);
  const pool = cards.filter(
    (c) =>
      allowed.has(c.faction_code) &&
      PLAYER_TYPES.has(c.type_code) &&
      !c.card_set_code &&
      isPickable(c),
  );
  return firstPrintings(pool, packs);
}

/**
 * printingKeys of the cards the user owns. Any printing of a card in an owned
 * pack counts, so a reprint in a newer pack unlocks the original card.
 */
export function ownedPrintings(cards: Card[], ownedPacks: ReadonlySet<string>): Set<string> {
  const keys = new Set<string>();
  for (const c of cards) if (ownedPacks.has(c.pack_code)) keys.add(printingKey(c));
  return keys;
}

export interface Deck {
  id: string;
  name: string;
  /** Code of the hero card, as in MarvelCDB decks. */
  heroCode: string;
  aspects: string[];
  /** Card code → copies, including the hero's own cards. */
  slots: Record<string, number>;
  createdAt: string;
  updatedAt: string;
}

export const deckSize = (deck: Pick<Deck, "slots">) =>
  Object.values(deck.slots).reduce((sum, n) => sum + n, 0);

/** Rule problems with a deck, as messages for the user. Empty means valid. */
export function deckIssues(deck: Deck, byCode: Map<string, Card>): string[] {
  const issues: string[] = [];
  const size = deckSize(deck);
  if (size < DECK_MIN || size > DECK_MAX) {
    issues.push(`El mazo tiene ${size} cartas; debe tener entre ${DECK_MIN} y ${DECK_MAX}.`);
  }

  const hero = byCode.get(deck.heroCode);
  if (hero) {
    for (const c of signatureCards([...byCode.values()], hero)) {
      const have = deck.slots[c.code] ?? 0;
      const need = c.quantity ?? 1;
      if (have < need) issues.push(`Faltan cartas del héroe: ${c.name} (${have} de ${need}).`);
    }
  }

  for (const [code, count] of Object.entries(deck.slots)) {
    const card = byCode.get(code);
    if (!card) continue;
    const limit = card.card_set_code === hero?.card_set_code ? (card.quantity ?? 1) : deckLimit(card);
    if (count > limit) issues.push(`Demasiadas copias de ${card.name}: ${count} (máximo ${limit}).`);
  }
  return issues;
}
