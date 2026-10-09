import { useState } from "react";
import Dropdown, { CheckRow } from "./Dropdown";

interface Props {
  /** Short name of the filter, e.g. "Aspectos". */
  label: string;
  /** Text shown when nothing is selected, e.g. "Todos los aspectos". */
  allLabel: string;
  /** [code, display name] pairs. */
  options: [string, string][];
  selected: string[];
  onChange: (selected: string[]) => void;
  /** Adds a text box to narrow long lists (e.g. packs). */
  searchable?: boolean;
  /** Optional Tailwind class for a color swatch next to each option. */
  swatchClass?: (code: string) => string | undefined;
}

export default function MultiSelect({
  label,
  allLabel,
  options,
  selected,
  onChange,
  searchable,
  swatchClass,
}: Props) {
  const [query, setQuery] = useState("");
  const names = new Map(options);

  const summary =
    selected.length === 0
      ? allLabel
      : selected.length === 1
        ? (names.get(selected[0]) ?? selected[0])
        : `${label}: ${selected.length}`;

  const needle = query.trim().toLowerCase();
  const shown = needle
    ? options.filter(([, name]) => name.toLowerCase().includes(needle))
    : options;

  const toggle = (code: string, on: boolean) =>
    onChange(on ? [...selected, code] : selected.filter((c) => c !== code));

  return (
    <Dropdown label={summary} active={selected.length > 0}>
      {searchable && (
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Filtrar ${label.toLowerCase()}…`}
          aria-label={`Filtrar ${label.toLowerCase()}`}
          className="field mb-2 h-10 w-full text-sm"
        />
      )}
      <div className="max-h-72 overflow-y-auto">
        {shown.length === 0 && <p className="px-3 py-2 text-sm text-muted">Sin resultados.</p>}
        {shown.map(([code, name]) => {
          const swatch = swatchClass?.(code);
          return (
            <CheckRow
              key={code}
              checked={selected.includes(code)}
              onChange={(on) => toggle(code, on)}
            >
              {swatch && (
                <span
                  aria-hidden="true"
                  className={`h-3.5 w-3.5 shrink-0 rounded border-2 border-ink ${swatch}`}
                />
              )}
              <span className="truncate">{name}</span>
            </CheckRow>
          );
        })}
      </div>
      {selected.length > 0 && (
        <div className="mt-2 border-t-2 border-ink/10 pt-2">
          <button
            type="button"
            onClick={() => onChange([])}
            className="w-full rounded-[10px] px-3 py-2 text-left text-sm font-bold text-petrol hover:bg-amber-soft"
          >
            Quitar selección
          </button>
        </div>
      )}
    </Dropdown>
  );
}
