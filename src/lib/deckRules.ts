import type { Card, DeckOption, Pack } from "../api/types";
import { firstPrintings, printingKey } from "./reprints";

// Deck building rules for Marvel Champions, on top of MarvelCDB's card data.

export const DECK_MIN = 40;
export const DECK_MAX = 50;

/** Aspects a hero can pick. Pool (from Deadpool) is open to every hero. */
export const ASPECTS = ["aggression", "justice", "leadership", "protection", "pool"] as const;
export type Aspect = (typeof ASPECTS)[number];

/** The four original aspects, which Adam Warlock must all use. */
const CORE_ASPECTS: Aspect[] = ["aggression", "justice", "leadership", "protection"];

export const ASPECT_NAMES: Record<string, string> = {
  aggression: "Aggression",
  justice: "Justice",
  leadership: "Leadership",
  protection: "Protection",
  pool: "Pool",
  basic: "Basic",
};

const PLAYER_TYPES = new Set([
  "ally",
  "event",
  "resource",
  "support",
  "upgrade",
  "player_side_scheme",
]);

const TYPE_NAMES: Record<string, string> = {
  ally: "aliados",
  event: "eventos",
  resource: "recursos",
  support: "apoyos",
  upgrade: "mejoras",
  player_side_scheme: "planes secundarios de jugador",
};

// Back faces of double-sided cards and exact reprints are never picked directly.
const isPickable = (c: Card) => !c.hidden && !c.duplicate_of_code;

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

/** What a hero's card says about building their deck. */
export interface HeroRules {
  /** How many aspects to choose (Spider-Woman: 2). */
  aspectCount: number;
  /** Aspects the hero must use, when there is no choice (Adam Warlock). */
  fixedAspects?: Aspect[];
  /** Max copies of each card that isn't the hero's own (Adam Warlock: 1). */
  copyLimit?: number;
  /** Extra cards allowed from other aspects (Gamora, Cyclops…). */
  options: DeckOption[];
}

export function heroRules(hero: Card): HeroRules {
  const req = hero.deck_requirements?.find((r) => r.aspects);
  const aspectCount = req?.aspects ?? 1;
  return {
    aspectCount,
    fixedAspects: aspectCount === CORE_ASPECTS.length ? CORE_ASPECTS : undefined,
    copyLimit: req?.limit,
    options: hero.deck_options ?? [],
  };
}

// "Persona. S.H.I.E.L.D." has the trait "s.h.i.e.l.d": compare whole traits.
const hasTrait = (c: Card, trait: string) =>
  ` ${(c.traits ?? "").toLowerCase()}`.includes(` ${trait.toLowerCase().replace(/\.$/, "")}.`);

const RESOURCE_FIELDS: Record<string, keyof Card> = {
  energy: "resource_energy",
  mental: "resource_mental",
  physical: "resource_physical",
  wild: "resource_wild",
};

export function matchesOption(c: Card, opt: DeckOption): boolean {
  if (opt.type && !opt.type.includes(c.type_code)) return false;
  if (opt.trait && !opt.trait.some((t) => hasTrait(c, t))) return false;
  if (opt.resource && !opt.resource.some((r) => Number(c[RESOURCE_FIELDS[r]] ?? 0) > 0)) {
    return false;
  }
  return true;
}

/** "eventos con rasgo Attack o Thwart", for messages. */
export function describeOption(opt: DeckOption): string {
  const what = opt.type?.map((t) => TYPE_NAMES[t] ?? t).join(" o ") ?? "cartas";
  const parts = [what];
  if (opt.trait) parts.push(`con el rasgo ${opt.trait.map((t) => t.toUpperCase()).join(" o ")}`);
  if (opt.resource) parts.push(`con recurso ${opt.resource.join(" o ")}`);
  return parts.join(" ");
}

const inAspects = (c: Card, aspects: string[]) =>
  c.faction_code === "basic" || aspects.includes(c.faction_code);

/** The hero option that lets an off-aspect card into the deck, if any. */
const optionFor = (c: Card, aspects: string[], rules: HeroRules) =>
  inAspects(c, aspects) ? undefined : rules.options.find((o) => matchesOption(c, o));

/**
 * Cards a deck can add: cards of its aspects and Basic, plus the off-aspect
 * cards the hero allows. Hero and special sets are left out, and each card
 * appears once (its first printing).
 */
export function deckPool(
  cards: Card[],
  aspects: string[],
  rules: HeroRules,
  packs: Pack[] | undefined,
): Card[] {
  const pool = cards.filter(
    (c) =>
      (c.faction_code === "basic" || (ASPECTS as readonly string[]).includes(c.faction_code)) &&
      PLAYER_TYPES.has(c.type_code) &&
      !c.card_set_code &&
      isPickable(c) &&
      (inAspects(c, aspects) || !!optionFor(c, aspects, rules)),
  );
  return firstPrintings(pool, packs);
}

/** True when the card is in the pool only thanks to a hero option. */
export const isHeroExtra = (c: Card, aspects: string[]) => !inAspects(c, aspects);

/** Copy limits count by title: reprints and versions with the same name share it. */
export const titleKey = (c: Card) => c.name.toLowerCase();

/** Max copies of a card in this deck. */
export function cardLimit(c: Card, hero: Card, rules: HeroRules): number {
  if (c.card_set_code && c.card_set_code === hero.card_set_code) return c.quantity ?? 1;
  return Math.min(c.deck_limit ?? 3, rules.copyLimit ?? Infinity);
}

/** Copies per title currently in the deck. */
export function titleCounts(deck: Pick<Deck, "slots">, byCode: Map<string, Card>) {
  const counts = new Map<string, number>();
  for (const [code, n] of Object.entries(deck.slots)) {
    const c = byCode.get(code);
    if (c) counts.set(titleKey(c), (counts.get(titleKey(c)) ?? 0) + n);
  }
  return counts;
}

/**
 * Copies of each card the user owns, by printingKey: the copies of every
 * printing of that card in the user's packs.
 */
export function ownedCopies(cards: Card[], ownedPacks: ReadonlySet<string>): Map<string, number> {
  const copies = new Map<string, number>();
  for (const c of cards) {
    if (!ownedPacks.has(c.pack_code)) continue;
    const key = printingKey(c);
    copies.set(key, (copies.get(key) ?? 0) + (c.quantity ?? 1));
  }
  return copies;
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

const deckCards = (deck: Deck, byCode: Map<string, Card>) =>
  Object.entries(deck.slots)
    .map(([code, n]) => [byCode.get(code), n] as const)
    .filter((e): e is readonly [Card, number] => !!e[0]);

/** Cards per chosen aspect, not counting Basic or the hero's own cards. */
export function aspectCounts(deck: Deck, byCode: Map<string, Card>, hero: Card) {
  const counts = new Map(deck.aspects.map((a) => [a, 0]));
  for (const [c, n] of deckCards(deck, byCode)) {
    if (c.card_set_code === hero.card_set_code) continue;
    if (counts.has(c.faction_code)) counts.set(c.faction_code, counts.get(c.faction_code)! + n);
  }
  return counts;
}

/** Rule problems with a deck, as messages for the user. Empty means valid. */
export function deckIssues(deck: Deck, byCode: Map<string, Card>): string[] {
  const issues: string[] = [];
  const size = deckSize(deck);
  if (size < DECK_MIN || size > DECK_MAX) {
    issues.push(`El mazo tiene ${size} cartas; debe tener entre ${DECK_MIN} y ${DECK_MAX}.`);
  }

  const hero = byCode.get(deck.heroCode);
  if (!hero) return issues;
  const rules = heroRules(hero);

  if (deck.aspects.length !== rules.aspectCount) {
    issues.push(`${hero.name} debe usar ${rules.aspectCount} aspectos.`);
  }

  for (const c of signatureCards([...byCode.values()], hero)) {
    const have = deck.slots[c.code] ?? 0;
    const need = c.quantity ?? 1;
    if (have < need) issues.push(`Faltan cartas del héroe: ${c.name} (${have} de ${need}).`);
  }

  // Copy limits, by title.
  const counts = titleCounts(deck, byCode);
  const limits = new Map<string, { name: string; limit: number }>();
  for (const [c] of deckCards(deck, byCode)) {
    const key = titleKey(c);
    const limit = cardLimit(c, hero, rules);
    const current = limits.get(key);
    if (!current || limit < current.limit) limits.set(key, { name: c.name, limit });
  }
  for (const [key, { name, limit }] of limits) {
    const count = counts.get(key) ?? 0;
    if (count > limit) issues.push(`Demasiadas copias de ${name}: ${count} (máximo ${limit}).`);
  }

  // Cards from other aspects need a hero option, within its limits.
  const perOption = new Map<DeckOption, { copies: number; titles: Set<string> }>();
  for (const [c, n] of deckCards(deck, byCode)) {
    if (c.card_set_code === hero.card_set_code || inAspects(c, deck.aspects)) continue;
    const opt = optionFor(c, deck.aspects, rules);
    if (!opt) {
      issues.push(`${c.name} es de ${ASPECT_NAMES[c.faction_code] ?? c.faction_name}, que no es un aspecto del mazo.`);
      continue;
    }
    const use = perOption.get(opt) ?? { copies: 0, titles: new Set<string>() };
    use.copies += n;
    use.titles.add(titleKey(c));
    perOption.set(opt, use);
  }
  for (const [opt, use] of perOption) {
    if (opt.limit && use.copies > opt.limit) {
      issues.push(
        `Solo puedes incluir ${opt.limit} ${describeOption(opt)} de otros aspectos; tienes ${use.copies}.`,
      );
    }
    if (opt.name_limit && use.titles.size > opt.name_limit) {
      issues.push(
        `Solo puedes incluir ${opt.name_limit} ${describeOption(opt)} distintos de otros aspectos; tienes ${use.titles.size}.`,
      );
    }
  }

  // Spider-Woman and Adam Warlock: the same number of cards from each aspect.
  if (deck.aspects.length > 1) {
    const perAspect = aspectCounts(deck, byCode, hero);
    if (new Set(perAspect.values()).size > 1) {
      const detail = [...perAspect].map(([a, n]) => `${ASPECT_NAMES[a] ?? a} ${n}`).join(", ");
      issues.push(`Debe haber el mismo número de cartas de cada aspecto (${detail}).`);
    }
  }
  return issues;
}

/** Cards the deck uses more copies of than the user's packs give. */
export function collectionWarnings(
  deck: Deck,
  byCode: Map<string, Card>,
  owned: Map<string, number>,
): string[] {
  const warnings: string[] = [];
  const hero = byCode.get(deck.heroCode);
  for (const [c, n] of deckCards(deck, byCode)) {
    if (hero && c.card_set_code === hero.card_set_code) continue;
    const have = owned.get(printingKey(c)) ?? 0;
    if (have === 0) warnings.push(`No tienes ${c.name} en tu colección.`);
    else if (n > have) warnings.push(`Usas ${n} copias de ${c.name} y tu colección tiene ${have}.`);
  }
  return warnings;
}
