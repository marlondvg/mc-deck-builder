import { Link, useParams } from "react-router-dom";
import { useCard } from "../api/hooks";
import { cardImageUrl } from "../api/marvelcdb";
import { factionStyle } from "../lib/factions";

function Stat({ label, value }: { label: string; value: number | null | undefined }) {
  if (value === undefined || value === null) return null;
  return (
    <div className="rounded-lg bg-slate-100 px-3 py-2 text-center">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="font-display text-2xl leading-tight">{value}</div>
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

export default function CardDetailPage() {
  const { code } = useParams();
  const { data: card, isLoading, isError } = useCard(code);

  if (isLoading) return <p className="py-20 text-center text-slate-500">Loading card…</p>;
  if (isError || !card) {
    return (
      <div className="py-20 text-center">
        <p className="text-slate-600">Couldn't find that card.</p>
        <Link to="/" className="mt-3 inline-block font-medium text-marvel hover:underline">
          ← Back to cards
        </Link>
      </div>
    );
  }

  const img = cardImageUrl(card);
  const style = factionStyle(card.faction_code);

  return (
    <div className="space-y-4">
      <Link to="/" className="text-sm font-medium text-marvel hover:underline">
        ← Back to cards
      </Link>

      <div className="grid gap-8 md:grid-cols-[320px_1fr]">
        <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-sm">
          <div className={`h-2 ${style.bar}`} />
          {img ? (
            <img src={img} alt={card.name} className="w-full" />
          ) : (
            <div className="flex aspect-[5/7] items-center justify-center text-slate-500">
              No image available
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div>
            <h1 className="font-display text-5xl tracking-wide">{card.name}</h1>
            {card.subname && <p className="text-lg text-slate-500">{card.subname}</p>}
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              <span className={`rounded-full px-3 py-1 font-medium ${style.badge}`}>
                {card.faction_name}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1">{card.type_name}</span>
              <span className="rounded-full bg-slate-100 px-3 py-1">{card.pack_name}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            <Stat label="Cost" value={card.cost} />
            <Stat label="ATK" value={card.attack} />
            <Stat label="THW" value={card.thwart} />
            <Stat label="DEF" value={card.defense} />
            <Stat label="HP" value={card.health} />
            <Stat label="Hand" value={card.hand_size} />
          </div>

          {card.traits && <p className="font-semibold italic">{card.traits}</p>}

          {card.text && (
            <p className="whitespace-pre-line rounded-xl border border-ink/10 bg-white p-4 leading-relaxed">
              {plainText(card.text)}
            </p>
          )}

          {card.flavor && (
            <p className="whitespace-pre-line text-sm italic text-slate-500">
              {plainText(card.flavor)}
            </p>
          )}

          {card.illustrator && (
            <p className="text-xs text-slate-400">Illustrated by {card.illustrator}</p>
          )}
        </div>
      </div>
    </div>
  );
}
