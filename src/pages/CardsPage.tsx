import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useCards } from "../api/hooks";
import type { Card } from "../api/types";
import CardTile from "../components/CardTile";

const PAGE_SIZE = 60;

const selectClass = "field";

function uniqueOptions(cards: Card[], code: keyof Card, label: keyof Card) {
  const map = new Map<string, string>();
  for (const c of cards) {
    const k = c[code] as string | undefined;
    if (k && !map.has(k)) map.set(k, (c[label] as string | undefined) ?? k);
  }
  return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
}

export default function CardsPage() {
  const { data: cards, isLoading, isError, error, refetch } = useCards();
  const [params, setParams] = useSearchParams();
  const [visible, setVisible] = useState(PAGE_SIZE);

  const q = params.get("q") ?? "";
  const faction = params.get("faction") ?? "";
  const type = params.get("type") ?? "";
  const pack = params.get("pack") ?? "";
  const encounter = params.get("encounter") === "1";

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  // Cards the user can actually build with, unless encounter cards are requested.
  const base = useMemo(
    () =>
      (cards ?? []).filter(
        (c) => !c.duplicate_of && (encounter || c.faction_code !== "encounter"),
      ),
    [cards, encounter],
  );

  const factions = useMemo(() => uniqueOptions(base, "faction_code", "faction_name"), [base]);
  const types = useMemo(() => uniqueOptions(base, "type_code", "type_name"), [base]);
  const packs = useMemo(() => uniqueOptions(base, "pack_code", "pack_name"), [base]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return base
      .filter((c) => {
        if (faction && c.faction_code !== faction) return false;
        if (type && c.type_code !== type) return false;
        if (pack && c.pack_code !== pack) return false;
        if (!needle) return true;
        return [c.name, c.subname, c.traits, c.text]
          .filter(Boolean)
          .some((f) => f!.toLowerCase().includes(needle));
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [base, q, faction, type, pack]);

  // Go back to the first page whenever the filters change.
  useEffect(() => setVisible(PAGE_SIZE), [q, faction, type, pack, encounter]);

  const hasFilters = !!(q || faction || type || pack);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-1.5">
        {cards && (
          <span className="eyebrow">{filtered.length.toLocaleString()} cartas</span>
        )}
        <h1 className="font-display text-5xl uppercase leading-none tracking-wide sm:text-6xl">
          Todas las cartas
        </h1>
        <p className="text-sm text-muted">Datos de MarvelCDB.</p>
      </div>

      <div className="panel flex flex-wrap items-center gap-3 p-4">
        <input
          type="search"
          value={q}
          onChange={(e) => setParam("q", e.target.value)}
          placeholder="Buscar por nombre, rasgos o texto…"
          className={`${selectClass} min-w-64 flex-1`}
        />
        <select value={faction} onChange={(e) => setParam("faction", e.target.value)} className={selectClass}>
          <option value="">Todos los aspectos</option>
          {factions.map(([code, name]) => (
            <option key={code} value={code}>
              {name}
            </option>
          ))}
        </select>
        <select value={type} onChange={(e) => setParam("type", e.target.value)} className={selectClass}>
          <option value="">Todos los tipos</option>
          {types.map(([code, name]) => (
            <option key={code} value={code}>
              {name}
            </option>
          ))}
        </select>
        <select value={pack} onChange={(e) => setParam("pack", e.target.value)} className={selectClass}>
          <option value="">Todos los packs</option>
          {packs.map(([code, name]) => (
            <option key={code} value={code}>
              {name}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            className="h-[18px] w-[18px] accent-petrol"
            checked={encounter}
            onChange={(e) => setParam("encounter", e.target.checked ? "1" : "")}
          />
          Incluir cartas de encuentro
        </label>
        {hasFilters && (
          <button
            onClick={() => {
              const next = new URLSearchParams();
              if (encounter) next.set("encounter", "1");
              setParams(next, { replace: true });
            }}
            className="text-sm font-bold text-petrol hover:underline"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {isLoading && <p className="py-16 text-center text-muted">Cargando cartas…</p>}

      {isError && (
        <div className="panel p-6 text-center">
          <p className="font-bold text-danger">No se pudieron cargar las cartas.</p>
          <p className="mt-1 text-sm text-muted">{(error as Error).message}</p>
          <button onClick={() => refetch()} className="btn-primary mt-4">
            Reintentar
          </button>
        </div>
      )}

      {cards && (
        <>
          {filtered.length === 0 ? (
            <p className="py-16 text-center text-muted">Ninguna carta coincide con esos filtros.</p>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-5">
              {filtered.slice(0, visible).map((card) => (
                <CardTile key={card.code} card={card} />
              ))}
            </div>
          )}

          {visible < filtered.length && (
            <div className="flex justify-center pt-2">
              <button
                onClick={() => setVisible((v) => v + PAGE_SIZE)}
                className="btn-secondary shadow-comic-sm"
              >
                Ver más ({filtered.length - visible} restantes)
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
