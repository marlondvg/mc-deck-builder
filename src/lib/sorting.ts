import type { Card, Pack } from "../api/types";
import { factionRank } from "./factions";

// Sort options for the card list, mirroring MarvelCDB's "Sort" menu.
export const SORTS = [
  { id: "type", label: "Por tipo", short: "Tipo" },
  { id: "name", label: "Por nombre", short: "Nombre" },
  { id: "number", label: "Por número de carta", short: "Número" },
  { id: "cost", label: "Por coste", short: "Coste" },
  { id: "set-name", label: "Por set, luego nombre", short: "Set / nombre" },
  { id: "set-type", label: "Por set, luego tipo", short: "Set / tipo" },
  { id: "set-number", label: "Por set, luego número", short: "Set / número" },
  { id: "aspect-name", label: "Por aspecto, luego nombre", short: "Aspecto / nombre" },
  { id: "aspect-type", label: "Por aspecto, luego tipo", short: "Aspecto / tipo" },
  { id: "aspect-cost", label: "Por aspecto, luego coste", short: "Aspecto / coste" },
  { id: "aspect-number", label: "Por aspecto, luego número", short: "Aspecto / número" },
] as const;

export type SortId = (typeof SORTS)[number]["id"];
export const DEFAULT_SORT: SortId = "aspect-type";

type Compare = (a: Card, b: Card) => number;

// Ignore leading quotes/punctuation ('Pool Inspection, "Avenge Me!").
const nameKey = (name: string) => name.replace(/^[^\p{L}\p{N}]+/u, "");
const byName: Compare = (a, b) => nameKey(a.name).localeCompare(nameKey(b.name));

// Card codes look like "01055" or "01001a": compare numerically.
const byNumber: Compare = (a, b) =>
  a.code.localeCompare(b.code, undefined, { numeric: true });

// Cards without a cost (resources, heroes…) go after the costed ones.
const byCost: Compare = (a, b) => {
  const ca = a.cost ?? Number.POSITIVE_INFINITY;
  const cb = b.cost ?? Number.POSITIVE_INFINITY;
  return ca === cb ? 0 : ca < cb ? -1 : 1;
};

// Player card types first, in deck-list order; anything else after, alphabetically.
const TYPE_ORDER = [
  "hero",
  "alter_ego",
  "ally",
  "event",
  "resource",
  "support",
  "upgrade",
  "player_side_scheme",
  "obligation",
];
const typeRank = (code: string) => {
  const i = TYPE_ORDER.indexOf(code);
  return i === -1 ? TYPE_ORDER.length : i;
};
const byType: Compare = (a, b) =>
  typeRank(a.type_code) - typeRank(b.type_code) || a.type_name.localeCompare(b.type_name);

const byAspect: Compare = (a, b) => factionRank(a.faction_code) - factionRank(b.faction_code);

/** Sets in release order (pack date, then pack position). */
function bySet(packs: Pack[] | undefined): Compare {
  const rank = new Map<string, number>();
  [...(packs ?? [])]
    .sort(
      (a, b) =>
        (a.available || "9999").localeCompare(b.available || "9999") ||
        (a.position ?? 9999) - (b.position ?? 9999),
    )
    .forEach((p, i) => rank.set(p.code, i));
  const r = (c: Card) => rank.get(c.pack_code) ?? Number.MAX_SAFE_INTEGER;
  return (a, b) => r(a) - r(b) || a.pack_name.localeCompare(b.pack_name);
}

const chain =
  (...cmps: Compare[]): Compare =>
  (a, b) => {
    for (const cmp of cmps) {
      const d = cmp(a, b);
      if (d !== 0) return d;
    }
    return 0;
  };

export function makeComparator(sort: SortId, packs: Pack[] | undefined): Compare {
  const set = bySet(packs);
  switch (sort) {
    case "type":
      return chain(byType, byName, byNumber);
    case "number":
      return byNumber;
    case "cost":
      return chain(byCost, byName, byNumber);
    case "set-name":
      return chain(set, byName, byNumber);
    case "set-type":
      return chain(set, byType, byName, byNumber);
    case "set-number":
      return chain(set, byNumber);
    case "aspect-name":
      return chain(byAspect, byName, byNumber);
    case "aspect-type":
      return chain(byAspect, byType, byName, byNumber);
    case "aspect-cost":
      return chain(byAspect, byCost, byName, byNumber);
    case "aspect-number":
      return chain(byAspect, byNumber);
    case "name":
    default:
      return chain(byName, byNumber);
  }
}
