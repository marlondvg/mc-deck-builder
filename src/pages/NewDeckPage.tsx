import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { cardImageUrl } from "../api/marvelcdb";
import { useCards } from "../api/hooks";
import type { Card } from "../api/types";
import { CheckRow } from "../components/Dropdown";
import { useAuth } from "../lib/auth";
import { useCollection } from "../lib/collection";
import {
  ASPECTS,
  ASPECT_NAMES,
  heroChoices,
  ownedPrintings,
  signatureCards,
  type Aspect,
} from "../lib/deckRules";
import { useDecks } from "../lib/decks";
import { factionStyle } from "../lib/factions";
import { printingKey } from "../lib/reprints";

function HeroTile({ hero, onSelect }: { hero: Card; onSelect: () => void }) {
  const img = cardImageUrl(hero);
  return (
    <button
      type="button"
      onClick={onSelect}
      className="panel flex flex-col overflow-hidden text-left transition hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-comic-lg"
    >
      {img && (
        <img
          src={img}
          alt=""
          loading="lazy"
          width={710}
          height={1000}
          className="block h-auto w-full border-b-[3px] border-ink bg-canvas"
        />
      )}
      <span className="truncate px-3 py-2 font-bold">{hero.name}</span>
    </button>
  );
}

export default function NewDeckPage() {
  const { username } = useAuth();
  const { data: cards, isLoading, isError, error, refetch } = useCards();
  const { owned } = useCollection();
  const { createDeck } = useDecks();
  const navigate = useNavigate();
  const [showAll, setShowAll] = useState(false);
  const [hero, setHero] = useState<Card | null>(null);

  const heroes = useMemo(() => {
    const all = heroChoices(cards ?? []).sort((a, b) => a.name.localeCompare(b.name));
    if (showAll) return all;
    const mine = ownedPrintings(cards ?? [], owned);
    return all.filter((h) => mine.has(printingKey(h)));
  }, [cards, owned, showAll]);

  if (!username) return <Navigate to="/login" replace />;

  const create = (aspect: Aspect) => {
    if (!hero || !cards) return;
    const slots: Record<string, number> = {};
    for (const c of signatureCards(cards, hero)) slots[c.code] = c.quantity ?? 1;
    const id = createDeck({
      name: `${hero.name} – ${ASPECT_NAMES[aspect]}`,
      heroCode: hero.code,
      aspects: [aspect],
      slots,
    });
    navigate(`/decks/${id}`);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-1.5">
        <span className="eyebrow">Paso {hero ? 2 : 1} de 2</span>
        <h1 className="font-display text-5xl uppercase leading-none tracking-wide sm:text-6xl">
          Crear mazo
        </h1>
        <p className="text-sm text-muted">
          {hero ? "Elige el aspecto del mazo." : "Elige el héroe."}
        </p>
      </div>

      {hero && (
        <div className="panel flex flex-wrap items-center gap-4 p-4">
          <p className="text-lg">
            Héroe: <strong>{hero.name}</strong>
          </p>
          <div className="flex flex-wrap gap-2">
            {ASPECTS.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => create(a)}
                className={`min-h-11 rounded-xl border-2 border-ink px-4 font-bold shadow-comic-sm hover:brightness-95 ${factionStyle(a).badge}`}
              >
                {ASPECT_NAMES[a]}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setHero(null)} className="btn-secondary ml-auto">
            Cambiar héroe
          </button>
        </div>
      )}

      {!hero && (
        <div className="panel w-fit p-1">
          <CheckRow checked={showAll} onChange={setShowAll}>
            Mostrar todos los héroes (no solo los de mi colección)
          </CheckRow>
        </div>
      )}

      {isLoading && <p className="py-16 text-center text-muted">Cargando héroes…</p>}

      {isError && (
        <div className="panel p-6 text-center">
          <p className="font-bold text-danger">No se pudieron cargar las cartas.</p>
          <p className="mt-1 text-sm text-muted">{(error as Error).message}</p>
          <button onClick={() => refetch()} className="btn-primary mt-4">
            Reintentar
          </button>
        </div>
      )}

      {cards && !hero && heroes.length === 0 && (
        <p className="py-16 text-center text-muted">
          No tienes héroes en tu colección.{" "}
          <Link to="/collection" className="font-bold text-petrol hover:underline">
            Ir a Mi colección
          </Link>{" "}
          o marca "Mostrar todos los héroes".
        </p>
      )}

      {!hero && (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-4">
          {heroes.map((h) => (
            <HeroTile key={h.code} hero={h} onSelect={() => setHero(h)} />
          ))}
        </div>
      )}
    </div>
  );
}
