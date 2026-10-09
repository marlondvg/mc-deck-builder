import type { Card, Pack } from "./types";

export const MARVELCDB_ORIGIN = "https://marvelcdb.com";
const API = `${MARVELCDB_ORIGIN}/api/public`;

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`);
  if (!res.ok) {
    throw new Error(`MarvelCDB request failed: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
}

export const fetchAllCards = () => getJson<Card[]>("/cards/");
export const fetchPacks = () => getJson<Pack[]>("/packs/");
export const fetchCard = (code: string) => getJson<Card>(`/card/${code}`);

/** Absolute URL for a card image, or null when the card has no image. */
export function cardImageUrl(card: Pick<Card, "imagesrc">): string | null {
  return card.imagesrc ? `${MARVELCDB_ORIGIN}${card.imagesrc}` : null;
}
