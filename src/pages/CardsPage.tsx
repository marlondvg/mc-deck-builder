import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useCards, usePacks } from "../api/hooks";
import type { Card } from "../api/types";
import CardTile from "../components/CardTile";
import CardModal from "../components/CardModal";
import Dropdown, { CheckRow } from "../components/Dropdown";
import MultiSelect from "../components/MultiSelect";
import { factionRank, factionStyle } from "../lib/factions";
import { firstPrintings } from "../lib/reprints";
import { DEFAULT_SORT, SORTS, makeComparator, type SortId } from "../lib/sorting";

const PAGE_SIZE = 60;

function uniqueOptions(cards: Card[], code: keyof Card, label: keyof Card): [string, string][] {
  const map = new Map<string, string>();
  for (const c of cards) {
    const k = c[code] as string | undefined;
    if (k && !map.has(k)) map.set(k, (c[label] as string | undefined) ?? k);
  }
  return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
}

// Multi-value filters live in the URL as comma-separated lists: ?faction=aggression,justice
const readList = (params: URLSearchParams, key: string) =>
  (params.get(key) ?? "").split(",").filter(Boolean);

// Checkbox options. Keys are URL params set to "1" when on; add new ones here.
const OPTIONS = [
  { key: "encounter", label: "Incluir cartas de encuentro" },
  { key: "noimg", label: "Mostrar cartas sin imagen" },
  { key: "reprints", label: "Mostrar reimpresiones (arte nuevo)" },
] as const;

export default function CardsPage() {
  const { data: cards, isLoading, isError, error, refetch } = useCards();
  const { data: packList } = usePacks();
  const [params, setParams] = useSearchParams();
  const [visible, setVisible] = useState(PAGE_SIZE);

  const q = params.get("q") ?? "";
  const factionSel = readList(params, "faction");
  const typeSel = readList(params, "type");
  const packSel = readList(params, "pack");
  const encounter = params.get("encounter") === "1";
  const showNoImage = params.get("noimg") === "1";
  const showReprints = params.get("reprints") === "1";
  const sortParam = params.get("sort");
  const sort: SortId = SORTS.some((s) => s.id === sortParam) ? (sortParam as SortId) : DEFAULT_SORT;

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };
  const setList = (key: string, values: string[]) => setParam(key, values.join(","));

  // Cards the user can actually build with, unless encounter cards are requested.
  // Cards without an image are hidden unless the user asks for them.
  const base = useMemo(
    () =>
      (cards ?? []).filter(
        (c) =>
          !c.duplicate_of &&
          (encounter || c.faction_code !== "encounter") &&
          (showNoImage || !!c.imagesrc),
      ),
    [cards, encounter, showNoImage],
  );

  const factions = useMemo(
    () =>
      uniqueOptions(base, "faction_code", "faction_name").sort(
        (a, b) => factionRank(a[0]) - factionRank(b[0]) || a[1].localeCompare(b[1]),
      ),
    [base],
  );
  const types = useMemo(() => uniqueOptions(base, "type_code", "type_name"), [base]);
  const packs = useMemo(() => uniqueOptions(base, "pack_code", "pack_name"), [base]);

  // Stable string keys so the memo below doesn't rerun on every render.
  const factionKey = factionSel.join(",");
  const typeKey = typeSel.join(",");
  const packKey = packSel.join(",");

  const filtered = useMemo(() => {
    const fs = new Set(factionKey.split(",").filter(Boolean));
    const ts = new Set(typeKey.split(",").filter(Boolean));
    const ps = new Set(packKey.split(",").filter(Boolean));
    const needle = q.trim().toLowerCase();

    const matches = base.filter((c) => {
      if (fs.size && !fs.has(c.faction_code)) return false;
      if (ts.size && !ts.has(c.type_code)) return false;
      if (ps.size && !ps.has(c.pack_code)) return false;
      if (!needle) return true;
      return [c.name, c.subname, c.traits, c.text]
        .filter(Boolean)
        .some((f) => f!.toLowerCase().includes(needle));
    });

    // Reprints are collapsed after filtering, so picking a newer pack still
    // shows that pack's printing.
    const result = showReprints ? matches : firstPrintings(matches, packList);
    return result.sort(makeComparator(sort, packList));
  }, [base, q, factionKey, typeKey, packKey, showReprints, packList, sort]);

  // Go back to the first page whenever the filters change.
  useEffect(
    () => setVisible(PAGE_SIZE),
    [q, factionKey, typeKey, packKey, encounter, showNoImage, showReprints, sort],
  );

  const hasFilters = !!(q || factionKey || typeKey || packKey);
  const optionsOn = OPTIONS.filter((o) => params.get(o.key) === "1").length;

  // ---- Card modal: the open card lives in ?card=CODE so filters stay put,
  // the browser Back button closes it, and the URL can be shared.
  const navigate = useNavigate();
  const location = useLocation();
  const openCode = params.get("card");

  const withCard = useCallback(
    (code: string | null) => {
      const next = new URLSearchParams(params);
      if (code) next.set("card", code);
      else next.delete("card");
      return `?${next.toString()}`;
    },
    [params],
  );

  const openIndex = openCode ? filtered.findIndex((c) => c.code === openCode) : -1;
  const openCard = openIndex >= 0 ? filtered[openIndex] : cards?.find((c) => c.code === openCode);

  const closeModal = useCallback(() => {
    // Opened from the grid: step back so history doesn't keep the modal entry.
    if ((location.state as { fromGrid?: boolean } | null)?.fromGrid) navigate(-1);
    else navigate({ search: withCard(null) }, { replace: true });
  }, [location.state, navigate, withCard]);

  const goTo = useCallback(
    (index: number) => {
      const target = filtered[index];
      if (!target) return;
      // Reveal more of the grid if the arrows walk past what's shown.
      setVisible((v) => Math.max(v, index + 1));
      navigate({ search: withCard(target.code) }, { replace: true, state: location.state });
    },
    [filtered, navigate, withCard, location.state],
  );

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
          aria-label="Buscar cartas"
          className="field min-w-64 flex-1"
        />
        <MultiSelect
          label="Aspectos"
          allLabel="Todos los aspectos"
          options={factions}
          selected={factionSel}
          onChange={(v) => setList("faction", v)}
          swatchClass={(code) => factionStyle(code).fill}
        />
        <MultiSelect
          label="Tipos"
          allLabel="Todos los tipos"
          options={types}
          selected={typeSel}
          onChange={(v) => setList("type", v)}
        />
        <MultiSelect
          label="Packs"
          allLabel="Todos los packs"
          options={packs}
          selected={packSel}
          onChange={(v) => setList("pack", v)}
          searchable
        />
        <Dropdown label={`Ordenar: ${SORTS.find((s) => s.id === sort)!.short}`} active={sort !== DEFAULT_SORT}>
          {(close) => (
            <div role="menu" aria-label="Ordenar cartas">
              {SORTS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={s.id === sort}
                  onClick={() => {
                    setParam("sort", s.id === DEFAULT_SORT ? "" : s.id);
                    close();
                  }}
                  className={`flex min-h-10 w-full items-center justify-between gap-3 rounded-[10px] px-3 text-left text-[15px] hover:bg-amber-soft ${
                    s.id === sort ? "font-bold" : ""
                  }`}
                >
                  {s.label}
                  {s.id === sort && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0f4c5c" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M5 12l5 5L20 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </Dropdown>
        <Dropdown
          label={optionsOn ? `Opciones (${optionsOn})` : "Opciones"}
          active={optionsOn > 0}
          align="right"
        >
          {OPTIONS.map((o) => (
            <CheckRow
              key={o.key}
              checked={params.get(o.key) === "1"}
              onChange={(on) => setParam(o.key, on ? "1" : "")}
            >
              {o.label}
            </CheckRow>
          ))}
        </Dropdown>
        {hasFilters && (
          <button
            onClick={() => {
              // Keep the display options, clear search and filters.
              const next = new URLSearchParams();
              for (const o of OPTIONS) if (params.get(o.key) === "1") next.set(o.key, "1");
              if (sortParam) next.set("sort", sortParam);
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
                <CardTile
                  key={card.code}
                  card={card}
                  to={{ search: withCard(card.code) }}
                />
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

      {openCode && (
        <CardModal
          key={openCode}
          code={openCode}
          card={openCard}
          onClose={closeModal}
          onPrev={openIndex > 0 ? () => goTo(openIndex - 1) : undefined}
          onNext={
            openIndex >= 0 && openIndex < filtered.length - 1
              ? () => goTo(openIndex + 1)
              : undefined
          }
        />
      )}
    </div>
  );
}
