import { useMemo } from "react";
import { Link, Navigate } from "react-router-dom";
import { cardImageUrl } from "../api/marvelcdb";
import { useCards } from "../api/hooks";
import { useAuth } from "../lib/auth";
import { deckIssues, deckSize, DECK_MAX, DECK_MIN } from "../lib/deckRules";
import { useDecks } from "../lib/decks";
import { factionStyle } from "../lib/factions";

export default function DecksPage() {
  const { username } = useAuth();
  const { data: cards } = useCards();
  const { decks } = useDecks();
  const byCode = useMemo(() => new Map((cards ?? []).map((c) => [c.code, c])), [cards]);

  if (!username) return <Navigate to="/login" replace />;

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
            <Link
              key={deck.id}
              to={`/decks/${deck.id}`}
              className="panel flex gap-3 overflow-hidden p-3 text-ink no-underline transition hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-comic-lg"
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
                      {a.charAt(0).toUpperCase() + a.slice(1)}
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
          );
        })}
      </div>
    </div>
  );
}
