import { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { usePacks } from "../api/hooks";
import type { Pack } from "../api/types";
import { useAuth } from "../lib/auth";
import { useCollection } from "../lib/collection";

// Packs not yet released have no date; they go last.
const byRelease = (a: Pack, b: Pack) =>
  (a.available ?? "9999").localeCompare(b.available ?? "9999") || a.position - b.position;

const monthYear = (date: string) =>
  new Date(`${date}T00:00:00`).toLocaleDateString("es", { month: "short", year: "numeric" });

function PackTile({ pack, owned, onToggle }: { pack: Pack; owned: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={owned}
      className={`flex min-h-16 items-center gap-3 rounded-xl border-2 px-3.5 py-2.5 text-left transition ${
        owned
          ? "border-ink bg-white shadow-comic-sm"
          : "border-dashed border-ink/40 bg-white/40 text-muted hover:border-ink hover:bg-white"
      }`}
    >
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border-2 ${
          owned ? "border-ink bg-red" : "border-ink/40 bg-white"
        }`}
        aria-hidden="true"
      >
        {owned && (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        )}
      </span>
      <span className="flex min-w-0 flex-col">
        <span className={`truncate font-bold ${owned ? "text-ink" : ""}`}>{pack.name}</span>
        <span className="text-xs text-subtle">
          {pack.available ? monthYear(pack.available) : "Próximamente"}
          {pack.total ? ` · ${pack.total} cartas` : ""}
        </span>
      </span>
    </button>
  );
}

export default function CollectionPage() {
  const { username } = useAuth();
  const { data: packs, isLoading, isError, error, refetch } = usePacks();
  const { owned, setOwned, toggle } = useCollection();
  const [q, setQ] = useState("");

  const sorted = useMemo(() => [...(packs ?? [])].sort(byRelease), [packs]);
  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    return term ? sorted.filter((p) => p.name.toLowerCase().includes(term)) : sorted;
  }, [sorted, q]);

  // Group by release year, keeping release order.
  const groups = useMemo(() => {
    const map = new Map<string, Pack[]>();
    for (const pack of shown) {
      const year = pack.available?.slice(0, 4) ?? "Próximamente";
      map.set(year, [...(map.get(year) ?? []), pack]);
    }
    return [...map];
  }, [shown]);

  if (!username) return <Navigate to="/login" replace />;

  const ownedCount = sorted.filter((p) => owned.has(p.code)).length;
  const shownCodes = shown.map((p) => p.code);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-1.5">
        {packs && (
          <span className="eyebrow">
            {ownedCount} de {sorted.length} packs
          </span>
        )}
        <h1 className="font-display text-5xl uppercase leading-none tracking-wide sm:text-6xl">
          Mi colección
        </h1>
        <p className="text-sm text-muted">
          Marca los packs que tienes. Se guardan en este navegador.
        </p>
      </div>

      <div className="panel flex flex-wrap items-center gap-3 p-4">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar pack…"
          aria-label="Buscar packs"
          className="field min-w-64 flex-1"
        />
        <button type="button" className="btn-secondary" onClick={() => setOwned(shownCodes, true)}>
          Marcar {q ? "los mostrados" : "todos"}
        </button>
        <button type="button" className="btn-secondary" onClick={() => setOwned(shownCodes, false)}>
          Desmarcar {q ? "los mostrados" : "todos"}
        </button>
      </div>

      {isLoading && <p className="py-16 text-center text-muted">Cargando packs…</p>}

      {isError && (
        <div className="panel p-6 text-center">
          <p className="font-bold text-danger">No se pudieron cargar los packs.</p>
          <p className="mt-1 text-sm text-muted">{(error as Error).message}</p>
          <button onClick={() => refetch()} className="btn-primary mt-4">
            Reintentar
          </button>
        </div>
      )}

      {packs && shown.length === 0 && (
        <p className="py-16 text-center text-muted">Ningún pack coincide con esa búsqueda.</p>
      )}

      {groups.map(([year, list]) => (
        <section key={year} className="space-y-3">
          <h2 className="font-display text-3xl uppercase tracking-wide">{year}</h2>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3">
            {list.map((pack) => (
              <PackTile
                key={pack.code}
                pack={pack}
                owned={owned.has(pack.code)}
                onToggle={() => toggle(pack.code)}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
