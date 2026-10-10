import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { cardImageUrl } from "../api/marvelcdb";
import { useCards, usePacks } from "../api/hooks";
import type { Card } from "../api/types";
import CardModal from "../components/CardModal";
import { CheckRow } from "../components/Dropdown";
import { useAuth } from "../lib/auth";
import { useCollection } from "../lib/collection";
import {
  ASPECT_NAMES,
  DECK_MAX,
  DECK_MIN,
  aspectCounts,
  cardLimit,
  collectionWarnings,
  deckIssues,
  deckPool,
  deckSize,
  heroRules,
  isHeroExtra,
  ownedCopies,
  signatureCards,
  titleCounts,
  titleKey,
} from "../lib/deckRules";
import CostCurve from "../components/CostCurve";
import DeckActions from "../components/DeckActions";
import { deckAsText } from "../lib/deckExport";
import { useDecks } from "../lib/decks";
import { factionStyle } from "../lib/factions";
import { printingKey } from "../lib/reprints";
import { makeComparator } from "../lib/sorting";

const compare = (packs: Parameters<typeof makeComparator>[1]) => makeComparator("aspect-type", packs);

function CountButton(props: { label: string; disabled?: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      aria-label={props.label}
      title={props.label}
      disabled={props.disabled}
      onClick={props.onClick}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 border-ink bg-white text-lg font-bold leading-none hover:bg-amber-soft disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-white"
    >
      {props.children}
    </button>
  );
}

/** A card in the browser: image (opens the details) and +/- buttons. */
function PoolTile(props: {
  card: Card;
  count: number;
  limit: number;
  /** False when the card's title is already at its limit (e.g. via another version). */
  canAdd: boolean;
  /** Copies in the user's collection, or null when not tracking it. */
  owned: number | null;
  /** In the pool only thanks to the hero's deck-building ability. */
  extra: boolean;
  onOpen: () => void;
  onChange: (count: number) => void;
}) {
  const { card, count, limit } = props;
  const img = cardImageUrl(card);
  return (
    <div className={`panel flex flex-col overflow-hidden ${count ? "ring-4 ring-red" : ""}`}>
      <button type="button" onClick={props.onOpen} title={`Ver ${card.name}`} className="block">
        {img ? (
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
            className={`comic-fill ${factionStyle(card.faction_code).fill} flex aspect-[5/7] w-full items-center justify-center border-b-[3px] border-ink p-2 text-center font-bold`}
          >
            {card.name}
          </div>
        )}
      </button>
      <div className="flex items-center justify-between gap-1 px-2 py-2">
        <CountButton label={`Quitar ${card.name}`} disabled={count === 0} onClick={() => props.onChange(count - 1)}>
          −
        </CountButton>
        <span className="text-sm font-bold tabular-nums">
          {count} / {limit}
        </span>
        <CountButton label={`Agregar ${card.name}`} disabled={!props.canAdd} onClick={() => props.onChange(count + 1)}>
          +
        </CountButton>
      </div>
      {(props.extra || props.owned !== null) && (
        <div className="flex flex-wrap items-center justify-between gap-1 px-2 pb-2 text-xs">
          {props.owned !== null && (
            <span className={props.owned < count ? "font-bold text-danger" : "text-subtle"}>
              Tienes {props.owned}
            </span>
          )}
          {props.extra && (
            <span
              className={`rounded border-2 border-ink px-1 font-bold ${factionStyle(card.faction_code).badge}`}
              title="Permitida por la habilidad del héroe"
            >
              Extra
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/** One line of the deck list. Hero cards are fixed (no buttons). */
function DeckRow(props: {
  card: Card;
  count: number;
  canAdd: boolean;
  fixed: boolean;
  onOpen: () => void;
  onChange: (count: number) => void;
}) {
  const { card, count } = props;
  return (
    <li className="flex min-h-9 items-center gap-2">
      <span className="w-6 shrink-0 text-right font-bold tabular-nums">{count}×</span>
      <button type="button" onClick={props.onOpen} className="min-w-0 flex-1 truncate text-left hover:underline">
        {card.name}
      </button>
      {card.cost != null && (
        <span className="shrink-0 rounded-md border-2 border-ink px-1.5 text-xs font-bold" title="Coste">
          {card.cost}
        </span>
      )}
      {props.fixed ? (
        <span className="w-[68px] shrink-0 text-center text-xs text-subtle" title="Carta del héroe: fija">
          fija
        </span>
      ) : (
        <span className="flex shrink-0 gap-1">
          <CountButton label={`Quitar ${card.name}`} onClick={() => props.onChange(count - 1)}>
            −
          </CountButton>
          <CountButton label={`Agregar ${card.name}`} disabled={!props.canAdd} onClick={() => props.onChange(count + 1)}>
            +
          </CountButton>
        </span>
      )}
    </li>
  );
}

export default function DeckEditorPage() {
  const { id } = useParams();
  const { username } = useAuth();
  const { data: cards, isLoading } = useCards();
  const { data: packs } = usePacks();
  const { owned } = useCollection();
  const { decks, updateDeck, deleteDeck, duplicateDeck } = useDecks();
  const navigate = useNavigate();
  const deck = decks.find((d) => d.id === id);

  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [tab, setTab] = useState<"cards" | "deck">("cards");
  const [openCode, setOpenCode] = useState<string | null>(null);

  const byCode = useMemo(() => new Map((cards ?? []).map((c) => [c.code, c])), [cards]);
  const hero = deck ? byCode.get(deck.heroCode) : undefined;

  const signature = useMemo(
    () => (cards && hero ? signatureCards(cards, hero) : []),
    [cards, hero],
  );
  const signatureCodes = useMemo(() => new Set(signature.map((c) => c.code)), [signature]);

  const rules = useMemo(() => (hero ? heroRules(hero) : null), [hero]);
  const aspectKey = deck?.aspects.join(",") ?? "";
  const pool = useMemo(
    () =>
      rules
        ? deckPool(cards ?? [], aspectKey.split(",").filter(Boolean), rules, packs).sort(compare(packs))
        : [],
    [cards, aspectKey, rules, packs],
  );
  const copies = useMemo(() => ownedCopies(cards ?? [], owned), [cards, owned]);

  const types = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of pool) map.set(c.type_code, c.type_name);
    return [...map];
  }, [pool]);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return pool.filter(
      (c) =>
        (showAll || copies.has(printingKey(c)) || (deck?.slots[c.code] ?? 0) > 0) &&
        (!type || c.type_code === type) &&
        (!needle ||
          [c.name, c.traits, c.text].some((f) => f?.toLowerCase().includes(needle))),
    );
  }, [pool, q, type, showAll, copies, deck]);

  if (!username) return <Navigate to="/login" replace />;
  if (isLoading || !cards) return <p className="py-16 text-center text-muted">Cargando cartas…</p>;
  if (!deck || !hero || !rules) {
    return (
      <p className="py-16 text-center text-muted">
        No se encontró ese mazo.{" "}
        <Link to="/decks" className="font-bold text-petrol hover:underline">
          Ver mis mazos
        </Link>
      </p>
    );
  }

  const setCount = (code: string, count: number) =>
    updateDeck(deck.id, (d) => {
      const slots = { ...d.slots };
      if (count > 0) slots[code] = count;
      else delete slots[code];
      return { slots };
    });

  const size = deckSize(deck);
  const sizeOk = size >= DECK_MIN && size <= DECK_MAX;
  const issues = deckIssues(deck, byCode);
  const titles = titleCounts(deck, byCode);
  const canAdd = (c: Card) => (titles.get(titleKey(c)) ?? 0) < cardLimit(c, hero, rules);
  // Collection checks only make sense once the user has marked some packs.
  const tracking = owned.size > 0;
  const warnings = tracking ? collectionWarnings(deck, byCode, copies) : [];
  const perAspect = deck.aspects.length > 1 ? aspectCounts(deck, byCode, hero) : null;

  // Deck list: hero cards first, then the rest grouped by type.
  const deckCards = Object.keys(deck.slots)
    .map((code) => byCode.get(code))
    .filter((c): c is Card => !!c)
    .sort(compare(packs));
  const groups = new Map<string, Card[]>();
  for (const c of deckCards) {
    if (signatureCodes.has(c.code)) continue;
    groups.set(c.type_name, [...(groups.get(c.type_name) ?? []), c]);
  }
  const heroCards = deckCards.filter((c) => signatureCodes.has(c.code));
  const sum = (list: Card[]) => list.reduce((n, c) => n + (deck.slots[c.code] ?? 0), 0);

  const openCard = openCode ? byCode.get(openCode) : undefined;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-1.5">
        <Link to="/decks" className="text-sm font-bold text-petrol hover:underline">
          ← Mis mazos
        </Link>
        <input
          value={deck.name}
          onChange={(e) => updateDeck(deck.id, () => ({ name: e.target.value }))}
          aria-label="Nombre del mazo"
          className="w-full rounded-lg border-2 border-transparent bg-transparent font-display text-4xl uppercase leading-tight tracking-wide hover:border-ink/20 focus:border-ink focus:bg-white sm:text-5xl"
        />
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-bold">{hero.name}</span>
          {deck.aspects.map((a) => (
            <span key={a} className={`rounded-lg border-2 border-ink px-2.5 py-0.5 font-bold ${factionStyle(a).badge}`}>
              {ASPECT_NAMES[a] ?? a}
              {perAspect && ` ${perAspect.get(a) ?? 0}`}
            </span>
          ))}
          <span
            className={`rounded-lg border-2 border-ink px-2.5 py-0.5 font-bold ${sizeOk ? "bg-protection" : "bg-red text-white"}`}
          >
            {size} / {DECK_MIN}–{DECK_MAX} cartas
          </span>
          <span className="text-subtle">{issues.length ? "Mazo inválido" : "Mazo válido"} · se guarda solo</span>
        </div>
        <DeckActions
          name={deck.name}
          exportText={() => deckAsText(deck, byCode, packs)}
          onDuplicate={() => {
            const copy = duplicateDeck(deck.id);
            if (copy) navigate(`/decks/${copy}`);
          }}
          onDelete={() => {
            navigate("/decks");
            deleteDeck(deck.id);
          }}
        />
      </div>

      {/* On small screens the two columns become tabs. */}
      <div className="flex gap-2 lg:hidden" role="tablist">
        {(["cards", "deck"] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-xl border-2 border-ink py-2 font-bold ${tab === t ? "bg-red text-white" : "bg-white"}`}
          >
            {t === "cards" ? "Cartas" : `Mazo (${size})`}
          </button>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
        <section className={`space-y-4 ${tab === "cards" ? "" : "hidden lg:block"}`}>
          <div className="panel flex flex-wrap items-center gap-3 p-4">
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nombre, rasgos o texto…"
              aria-label="Buscar cartas"
              className="field min-w-56 flex-1"
            />
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              aria-label="Tipo de carta"
              className="field font-medium"
            >
              <option value="">Todos los tipos</option>
              {types.map(([code, name]) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
            </select>
            <CheckRow checked={showAll} onChange={setShowAll}>
              Mostrar todas las cartas (no solo mi colección)
            </CheckRow>
          </div>

          {shown.length === 0 ? (
            <p className="py-16 text-center text-muted">
              {showAll || owned.size ? (
                "Ninguna carta coincide con esos filtros."
              ) : (
                <>
                  Todavía no marcaste packs en tu colección.{" "}
                  <Link to="/collection" className="font-bold text-petrol hover:underline">
                    Ir a Mi colección
                  </Link>
                </>
              )}
            </p>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-4">
              {shown.map((c) => (
                <PoolTile
                  key={c.code}
                  card={c}
                  count={deck.slots[c.code] ?? 0}
                  limit={cardLimit(c, hero, rules)}
                  canAdd={canAdd(c)}
                  owned={tracking ? (copies.get(printingKey(c)) ?? 0) : null}
                  extra={isHeroExtra(c, deck.aspects)}
                  onOpen={() => setOpenCode(c.code)}
                  onChange={(n) => setCount(c.code, n)}
                />
              ))}
            </div>
          )}
        </section>

        <aside
          className={`panel space-y-4 p-4 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto ${
            tab === "deck" ? "" : "hidden lg:block"
          }`}
        >
          {issues.length > 0 && (
            <ul className="space-y-1 rounded-xl border-2 border-red bg-red/10 p-3 text-sm font-medium text-danger">
              {issues.map((msg) => (
                <li key={msg}>{msg}</li>
              ))}
            </ul>
          )}

          {warnings.length > 0 && (
            <details className="rounded-xl border-2 border-ink bg-amber-soft p-3 text-sm">
              <summary className="cursor-pointer font-bold">
                Tu colección no alcanza para {warnings.length}{" "}
                {warnings.length === 1 ? "carta" : "cartas"}
              </summary>
              <ul className="mt-2 space-y-1">
                {warnings.map((msg) => (
                  <li key={msg}>{msg}</li>
                ))}
              </ul>
            </details>
          )}

          <CostCurve entries={deckCards.map((c) => ({ cost: c.cost, count: deck.slots[c.code] ?? 0 }))} />

          <div>
            <h2 className="mb-1 font-display text-xl uppercase tracking-wide">
              Cartas del héroe ({sum(heroCards)})
            </h2>
            <ul>
              {heroCards.map((c) => (
                <DeckRow
                  key={c.code}
                  card={c}
                  count={deck.slots[c.code]}
                  canAdd={false}
                  fixed
                  onOpen={() => setOpenCode(c.code)}
                  onChange={() => {}}
                />
              ))}
            </ul>
          </div>

          {groups.size === 0 && (
            <p className="text-sm text-muted">Agrega cartas desde la lista de la izquierda.</p>
          )}
          {[...groups].map(([typeName, list]) => (
            <div key={typeName}>
              <h2 className="mb-1 font-display text-xl uppercase tracking-wide">
                {typeName} ({sum(list)})
              </h2>
              <ul>
                {list.map((c) => (
                  <DeckRow
                    key={c.code}
                    card={c}
                    count={deck.slots[c.code]}
                    canAdd={canAdd(c)}
                    fixed={false}
                    onOpen={() => setOpenCode(c.code)}
                    onChange={(n) => setCount(c.code, n)}
                  />
                ))}
              </ul>
            </div>
          ))}
        </aside>
      </div>

      {openCode && <CardModal code={openCode} card={openCard} onClose={() => setOpenCode(null)} />}
    </div>
  );
}
