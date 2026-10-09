// Tailwind classes per faction/aspect. Written out in full so Tailwind's
// scanner picks them up (dynamic class names would be purged).
export const FACTION_STYLES: Record<string, { badge: string; bar: string }> = {
  aggression: { badge: "bg-aggression text-white", bar: "bg-aggression" },
  justice: { badge: "bg-justice text-ink", bar: "bg-justice" },
  leadership: { badge: "bg-leadership text-white", bar: "bg-leadership" },
  protection: { badge: "bg-protection text-white", bar: "bg-protection" },
  pool: { badge: "bg-pool text-white", bar: "bg-pool" },
  basic: { badge: "bg-basic text-white", bar: "bg-basic" },
  hero: { badge: "bg-hero text-white", bar: "bg-hero" },
};

const FALLBACK = { badge: "bg-slate-500 text-white", bar: "bg-slate-400" };

export const factionStyle = (code: string) => FACTION_STYLES[code] ?? FALLBACK;
