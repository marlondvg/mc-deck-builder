import type { Card, Pack } from "../api/types";
import { ASPECT_NAMES, deckSize, signatureCards, type Deck } from "./deckRules";
import { makeComparator } from "./sorting";

/**
 * The deck as plain text to copy or share, grouped like the deck list:
 * the hero's cards first, then the rest by type, with each card's pack.
 */
export function deckAsText(deck: Deck, byCode: Map<string, Card>, packs: Pack[] | undefined): string {
  const hero = byCode.get(deck.heroCode);
  const signature = new Set(
    hero ? signatureCards([...byCode.values()], hero).map((c) => c.code) : [],
  );
  const cards = Object.keys(deck.slots)
    .map((code) => byCode.get(code))
    .filter((c): c is Card => !!c)
    .sort(makeComparator("type", packs));

  const groups = new Map<string, Card[]>();
  for (const c of cards) {
    const group = signature.has(c.code) ? "Cartas del héroe" : c.type_name;
    groups.set(group, [...(groups.get(group) ?? []), c]);
  }
  // Hero cards go first whatever their type.
  const ordered = [...groups].sort(([a], [b]) =>
    a === "Cartas del héroe" ? -1 : b === "Cartas del héroe" ? 1 : 0,
  );

  const lines = [
    deck.name,
    "",
    `Héroe: ${hero?.name ?? deck.heroCode}`,
    `Aspecto: ${deck.aspects.map((a) => ASPECT_NAMES[a] ?? a).join(", ")}`,
    `Cartas: ${deckSize(deck)}`,
  ];
  for (const [group, list] of ordered) {
    const total = list.reduce((n, c) => n + deck.slots[c.code], 0);
    lines.push("", `${group} (${total})`);
    for (const c of list) lines.push(`${deck.slots[c.code]}x ${c.name} (${c.pack_name})`);
  }
  return lines.join("\n") + "\n";
}
