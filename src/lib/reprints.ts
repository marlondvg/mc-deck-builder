import type { Card, Pack } from "../api/types";

// The same card is often reprinted in later packs with new art. MarvelCDB
// doesn't always link those reprints with `duplicate_of_code`, so we group cards
// that share name, subname, type, aspect and rules text.

const norm = (s: string | undefined) =>
  (s ?? "")
    .replace(/<[^>]+>/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "");

export const printingKey = (c: Card) =>
  [norm(c.name), norm(c.subname), c.type_code, c.faction_code, norm(c.text)].join("|");

/** Comparator: earlier release first (pack release date, then pack position, then card code). */
export function byRelease(packs: Pack[] | undefined) {
  const order = new Map<string, { date: string; position: number }>();
  for (const p of packs ?? []) {
    order.set(p.code, { date: p.available || "9999-12-31", position: p.position ?? 9999 });
  }
  return (a: Card, b: Card) => {
    const pa = order.get(a.pack_code);
    const pb = order.get(b.pack_code);
    const da = pa?.date ?? "9999-12-31";
    const db = pb?.date ?? "9999-12-31";
    if (da !== db) return da < db ? -1 : 1;
    const qa = pa?.position ?? 9999;
    const qb = pb?.position ?? 9999;
    if (qa !== qb) return qa - qb;
    return a.code.localeCompare(b.code);
  };
}

/** Keeps only the first-released printing of each card. */
export function firstPrintings(cards: Card[], packs: Pack[] | undefined): Card[] {
  const compare = byRelease(packs);
  const best = new Map<string, Card>();
  for (const c of cards) {
    const key = printingKey(c);
    const current = best.get(key);
    if (!current || compare(c, current) < 0) best.set(key, c);
  }
  const keep = new Set(best.values());
  return cards.filter((c) => keep.has(c));
}
