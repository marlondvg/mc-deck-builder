// Tailwind classes per faction/aspect, from the design's aspect colors.
// Written out in full so Tailwind's scanner picks them up.
export const FACTION_STYLES: Record<string, { badge: string; fill: string }> = {
  aggression: { badge: "bg-aggression text-white", fill: "bg-aggression" },
  justice: { badge: "bg-justice text-ink", fill: "bg-justice" },
  leadership: { badge: "bg-leadership text-ink", fill: "bg-leadership" },
  protection: { badge: "bg-protection text-ink", fill: "bg-protection" },
  basic: { badge: "bg-basic text-ink", fill: "bg-basic" },
  pool: { badge: "bg-pool text-ink", fill: "bg-pool" },
  hero: { badge: "bg-hero text-ink", fill: "bg-hero" },
  campaign: { badge: "bg-campaign text-white", fill: "bg-campaign" },
};

const FALLBACK = { badge: "bg-basic text-ink", fill: "bg-basic" };

export const factionStyle = (code: string) => FACTION_STYLES[code] ?? FALLBACK;

/** Player aspects, shown by default in the card list. */
export const PLAYER_ASPECTS = ["aggression", "justice", "protection", "leadership", "basic", "pool"];

// Display/sort order for factions. Unknown codes go last.
const FACTION_ORDER = [...PLAYER_ASPECTS, "hero", "campaign", "encounter"];

export const factionRank = (code: string) => {
  const i = FACTION_ORDER.indexOf(code);
  return i === -1 ? FACTION_ORDER.length : i;
};
