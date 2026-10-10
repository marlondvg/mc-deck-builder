// Shapes of the MarvelCDB public API responses.
// Based on https://marvelcdb.com/api/doc. Most fields are optional because
// they only exist for some card types (e.g. `attack` only on heroes/allies).

export type FactionCode =
  | "aggression"
  | "justice"
  | "leadership"
  | "protection"
  | "pool"
  | "basic"
  | "hero"
  | "encounter"
  | (string & {});

export interface Card {
  code: string;
  name: string;
  real_name?: string;
  subname?: string;
  pack_code: string;
  pack_name: string;
  type_code: string;
  type_name: string;
  faction_code: FactionCode;
  faction_name: string;
  position?: number;
  set_code?: string;
  set_name?: string;
  cost?: number | null;
  text?: string;
  real_text?: string;
  flavor?: string;
  traits?: string;
  illustrator?: string;
  quantity?: number;
  deck_limit?: number;
  /** MarvelCDB sends `is_unique`; `unique` kept as a fallback. */
  is_unique?: boolean;
  unique?: boolean;
  permanent?: boolean;
  resource_energy?: number;
  resource_mental?: number;
  resource_physical?: number;
  resource_wild?: number;
  // Hero / ally / minion stats
  attack?: number;
  /** Consequential damage an ally takes when it attacks / thwarts. */
  attack_cost?: number;
  thwart_cost?: number;
  thwart?: number;
  defense?: number;
  health?: number;
  /** Star icon printed next to a stat: the card text has a rule about it. */
  cost_star?: boolean;
  attack_star?: boolean;
  thwart_star?: boolean;
  defense_star?: boolean;
  health_star?: boolean;
  hand_size?: number;
  // Images are served by marvelcdb.com; `imagesrc` is a site-relative path.
  imagesrc?: string;
  url?: string;
  duplicate_of?: string;
}

export interface Pack {
  code: string;
  name: string;
  position: number;
  available?: string;
  known?: number;
  total?: number;
  id?: number;
  cgdb_id?: number | null;
}
