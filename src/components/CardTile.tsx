import { Link, type To } from "react-router-dom";
import type { Card } from "../api/types";
import { cardImageUrl } from "../api/marvelcdb";
import { factionStyle } from "../lib/factions";

export default function CardTile({ card, to }: { card: Card; to: To }) {
  const img = cardImageUrl(card);
  const style = factionStyle(card.faction_code);

  return (
    <Link
      to={to}
      state={{ fromGrid: true }}
      className="panel group flex flex-col overflow-hidden text-ink no-underline transition hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-comic-lg"
    >
      {img ? (
        // Full card at its natural proportions: fills the tile width with no
        // cropping and no letterbox margin. Width/height hint avoids layout jump.
        <img
          src={img}
          alt={card.name}
          loading="lazy"
          width={710}
          height={1000}
          className="block h-auto w-full border-b-[3px] border-ink bg-canvas"
        />
      ) : (
        <div
          className={`comic-fill ${style.fill} flex aspect-[5/7] w-full items-end border-b-[3px] border-ink p-3`}
        >
          <span className="w-full -skew-x-6 border-[3px] border-ink bg-white px-2 py-1 text-center font-display text-lg uppercase shadow-comic-sm">
            {card.type_name}
          </span>
        </div>
      )}
      <div className="flex flex-col gap-1.5 px-3.5 pb-3.5 pt-3">
        <p className="truncate text-base font-bold group-hover:text-petrol">{card.name}</p>
        <div className="flex items-center justify-between gap-2 text-sm text-muted">
          <span className="truncate">{card.type_name}</span>
          <span className={`shrink-0 rounded-md border-2 border-ink px-2 py-0.5 text-xs font-bold ${style.badge}`}>
            {card.faction_name}
          </span>
        </div>
      </div>
    </Link>
  );
}
