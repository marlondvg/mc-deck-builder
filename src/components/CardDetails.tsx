import type { Card } from "../api/types";
import { cardImageUrl } from "../api/marvelcdb";
import { factionStyle } from "../lib/factions";

function Stat({ label, value }: { label: string; value: number | null | undefined }) {
  if (value === undefined || value === null) return null;
  return (
    <div className="panel rounded-xl px-3 py-2 text-center shadow-comic-sm">
      <div className="text-xs font-bold uppercase tracking-[0.14em] text-subtle">{label}</div>
      <div className="font-display text-3xl leading-tight">{value}</div>
    </div>
  );
}

// MarvelCDB card text uses simple HTML (<b>, <i>) and [resource] tokens.
// Strip tags and turn tokens into readable words rather than injecting HTML.
function plainText(text: string): string {
  return text
    .replace(/<[^>]+>/g, "")
    .replace(/\[(\w+)\]/g, (_, token: string) => `(${token})`);
}

/** Image + info for one card. Used by the card modal and the /card/:code page. */
export default function CardDetails({ card, titleId }: { card: Card; titleId?: string }) {
  const img = cardImageUrl(card);
  const style = factionStyle(card.faction_code);

  return (
    <div className="grid gap-8 md:grid-cols-[minmax(0,340px)_1fr]">
      <div className="panel self-start overflow-hidden rounded-[18px] bg-white shadow-comic-lg">
        {img ? (
          <img src={img} alt={card.name} className="block w-full" />
        ) : (
          <div className={`comic-fill ${style.fill} flex aspect-[5/7] items-center justify-center p-6`}>
            <span className="-skew-x-6 border-[3px] border-ink bg-white px-4 py-1.5 font-display text-2xl uppercase shadow-comic-sm">
              Sin imagen
            </span>
          </div>
        )}
      </div>

      <div className="min-w-0 space-y-5">
        <div>
          <h2
            id={titleId}
            className="font-display text-4xl uppercase leading-none tracking-wide sm:text-5xl"
          >
            {card.name}
          </h2>
          {card.subname && <p className="mt-1 text-lg text-muted">{card.subname}</p>}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            <span className={`rounded-lg border-2 border-ink px-3 py-1 font-bold ${style.badge}`}>
              {card.faction_name}
            </span>
            <span className="rounded-lg border-2 border-ink bg-white px-3 py-1 font-bold">
              {card.type_name}
            </span>
            <span className="rounded-lg border-2 border-ink bg-white px-3 py-1">{card.pack_name}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          <Stat label="Coste" value={card.cost} />
          <Stat label="ATK" value={card.attack} />
          <Stat label="THW" value={card.thwart} />
          <Stat label="DEF" value={card.defense} />
          <Stat label="HP" value={card.health} />
          <Stat label="Mano" value={card.hand_size} />
        </div>

        {card.traits && <p className="font-semibold italic">{card.traits}</p>}

        {card.text && (
          <p className="panel whitespace-pre-line p-5 leading-relaxed">{plainText(card.text)}</p>
        )}

        {card.flavor && (
          <p className="whitespace-pre-line text-sm italic text-muted">{plainText(card.flavor)}</p>
        )}

        {card.illustrator && (
          <p className="text-xs text-subtle">Ilustración: {card.illustrator}</p>
        )}
      </div>
    </div>
  );
}
