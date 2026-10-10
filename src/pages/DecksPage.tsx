import { useMemo } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { cardImageUrl } from "../api/marvelcdb";
import { useCards, usePacks } from "../api/hooks";
import DeckActions from "../components/DeckActions";
import { useAuth } from "../lib/auth";
import { deckAsText } from "../lib/deckExport";
import { ASPECT_NAMES, deckIssues, deckSize, DECK_MAX, DECK_MIN } from "../lib/deckRules";
import { useDecks } from "../lib/decks";
import { factionStyle } from "../lib/factions";

export default function DecksPage() {
  const { username } = useAuth();
  const { data: cards } = useCards();
  const { data: packs } = usePacks();
  const { decks, deleteDeck, duplicateDeck } = useDecks();
  const byCode = useMemo(() => new Map((cards ?? []).map((c) => [c.code, c])), [cards]);
  const { search } = useLocation();

  // The card list used to live at "/": send old links with filters there.
  if (search) return <Navigate to={{ pathname: "/cards", search }} replace />;

  if (!username) {
    return (
      <div className="panel mx-auto mt-10 flex max-w-xl flex-col items-center gap-4 p-8 text-center">
        <h1 className="font-display text-5xl uppercase leading-none tracking-wide">Mazos</h1>
        <p className="text-muted">
          Inicia sesión para crear y guardar tus mazos, o mira primero todas las cartas.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link to="/login" className="btn-primary bg-red text-white">
            Iniciar sesión
          </Link>
          <Link to="/cards" className="btn-secondary">
            Ver cartas
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="eyebrow">
            {decks.length} {decks.length === 1 ? "mazo" : "mazos"}
          </span>
          <h1 className="font-display text-5xl uppercase leading-none tracking-wide sm:text-6xl">
            Mis mazos
          </h1>
        </div>
        <Link to="/decks/new" className="btn-primary bg-red text-white">
          Crear mazo
        </Link>
      </div>

      {decks.length === 0 && (
        <p className="py-16 text-center text-muted">Todavía no tienes mazos.</p>
      )}

      <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
        {decks.map((deck) => {
          const hero = byCode.get(deck.heroCode);
          const img = hero && cardImageUrl(hero);
          const size = deckSize(deck);
          const valid = cards ? deckIssues(deck, byCode).length === 0 : true;
          return (
            <div key={deck.id} className="panel flex flex-col gap-3 p-3">
              <Link
                to={`/decks/${deck.id}`}
                className="flex gap-3 overflow-hidden rounded-lg text-ink no-underline hover:bg-amber-soft"
              >
                {img && (
                  <img src={img} alt="" width={710} height={1000} className="h-auto w-20 shrink-0 rounded-md border-2 border-ink" />
                )}
                <div className="flex min-w-0 flex-col gap-1.5">
                  <span className="truncate text-lg font-bold">{deck.name}</span>
                  <span className="text-sm text-muted">{hero?.name}</span>
                  <div className="flex flex-wrap gap-1.5 text-xs font-bold">
                    {deck.aspects.map((a) => (
                      <span key={a} className={`rounded-md border-2 border-ink px-2 py-0.5 ${factionStyle(a).badge}`}>
                        {ASPECT_NAMES[a] ?? a}
                      </span>
                    ))}
                    <span className="rounded-md border-2 border-ink bg-white px-2 py-0.5">
                      {size} cartas
                    </span>
                    {!valid && (
                      <span
                        className="rounded-md border-2 border-ink bg-red px-2 py-0.5 text-white"
                        title={`Debe tener entre ${DECK_MIN} y ${DECK_MAX} cartas y cumplir los límites`}
                      >
                        Inválido
                      </span>
                    )}
                  </div>
                </div>
              </Link>
              <DeckActions
                name={deck.name}
                exportText={cards ? () => deckAsText(deck, byCode, packs) : undefined}
                onDuplicate={() => duplicateDeck(deck.id)}
                onDelete={() => deleteDeck(deck.id)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
