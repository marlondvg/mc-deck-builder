import { Link } from "react-router-dom";
import type { Card } from "../api/types";
import { cardImageUrl } from "../api/marvelcdb";
import { factionStyle } from "../lib/factions";

export default function CardTile({ card }: { card: Card }) {
  const img = cardImageUrl(card);
  const style = factionStyle(card.faction_code);

  return (
    <Link
      to={`/card/${card.code}`}
      className="group overflow-hidden rounded-xl border border-ink/10 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className={`h-1.5 ${style.bar}`} />
      {img ? (
        <img
          src={img}
          alt={card.name}
          loading="lazy"
          className="aspect-[5/7] w-full bg-slate-100 object-cover"
        />
      ) : (
        <div className="flex aspect-[5/7] w-full items-center justify-center bg-slate-100 p-3 text-center text-sm text-slate-500">
          No image available
        </div>
      )}
      <div className="space-y-1 p-3">
        <p className="truncate text-sm font-semibold group-hover:text-marvel">{card.name}</p>
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span className="truncate">{card.type_name}</span>
          <span className={`rounded-full px-2 py-0.5 font-medium ${style.badge}`}>
            {card.faction_name}
          </span>
        </div>
      </div>
    </Link>
  );
}
