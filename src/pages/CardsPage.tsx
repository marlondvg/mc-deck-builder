import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useCards } from "../api/hooks";
import type { Card } from "../api/types";
import CardTile from "../components/CardTile";

const PAGE_SIZE = 60;

const selectClass =
  "rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm outline-none focus:border-marvel focus:ring-2 focus:ring-marvel/20";

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
      <div>
        <h1 className="font-display text-4xl tracking-wide">Browse cards</h1>
        <p className="text-sm text-slate-500">
          Search every Marvel Champions card. Data from MarvelCDB.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-ink/10 bg-white p-4 shadow-sm">
        <input
          type="search"
          value={q}
          onChange={(e) => setParam("q", e.target.value)}
          placeholder="Search name, traits or text…"
          className={`${selectClass} min-w-64 flex-1`}
        />
        <select value={faction} onChange={(e) => setParam("faction", e.target.value)} className={selectClass}>
          <option value="">All aspects</option>
          {factions.map(([code, name]) => (
            <option key={code} value={code}>
              {name}
            </option>
          ))}
        </select>
        <select value={type} onChange={(e) => setParam("type", e.target.value)} className={selectClass}>
          <option value="">All types</option>
          {types.map(([code, name]) => (
            <option key={code} value={code}>
              {name}
            </option>
          ))}
        </select>
        <select value={pack} onChange={(e) => setParam("pack", e.target.value)} className={selectClass}>
          <option value="">All packs</option>
          {packs.map(([code, name]) => (
            <option key={code} value={code}>
              {name}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={encounter}
            onChange={(e) => setParam("encounter", e.target.checked ? "1" : "")}
          />
          Include encounter cards
        </label>
        {hasFilters && (
          <button
            onClick={() => {
              const next = new URLSearchParams();
              if (encounter) next.set("encounter", "1");
              setParams(next, { replace: true });
            }}
            className="text-sm font-medium text-marvel hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {isLoading && <p className="py-16 text-center text-slate-500">Loading cards…</p>}

      {isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="font-medium text-red-700">Couldn't load cards.</p>
          <p className="mt-1 text-sm text-red-600">{(error as Error).message}</p>
          <button
            onClick={() => refetch()}
            className="mt-3 rounded-full bg-marvel px-4 py-1.5 text-sm font-semibold text-white hover:bg-marvel-dark"
          >
            Try again
          </button>
        </div>
      )}

      {cards && (
        <>
          <p className="text-sm text-slate-500">
            {filtered.length.toLocaleString()} card{filtered.length === 1 ? "" : "s"}
          </p>

          {filtered.length === 0 ? (
            <p className="py-16 text-center text-slate-500">No cards match those filters.</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {filtered.slice(0, visible).map((card) => (
                <CardTile key={card.code} card={card} />
              ))}
            </div>
          )}

          {visible < filtered.length && (
            <div className="flex justify-center pt-2">
              <button
                onClick={() => setVisible((v) => v + PAGE_SIZE)}
                className="rounded-full border border-ink/15 bg-white px-6 py-2 text-sm font-semibold hover:border-marvel hover:text-marvel"
              >
                Show more ({filtered.length - visible} left)
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
