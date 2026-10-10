// Bar chart of how many cards the deck has at each cost (0 to 5, then 6+).
// Cards without a cost (resources) are left out.

const BUCKETS = ["0", "1", "2", "3", "4", "5", "6+"];
const bucketOf = (cost: number) => Math.min(cost, BUCKETS.length - 1);

export default function CostCurve({ entries }: { entries: { cost: number | null | undefined; count: number }[] }) {
  const counts = BUCKETS.map(() => 0);
  for (const { cost, count } of entries) {
    if (cost != null) counts[bucketOf(cost)] += count;
  }
  const max = Math.max(1, ...counts);
  const total = counts.reduce((a, b) => a + b, 0);
  const summary = BUCKETS.map((b, i) => `coste ${b}: ${counts[i]}`).join(", ");

  return (
    <figure className="space-y-2">
      <figcaption className="font-display text-xl uppercase tracking-wide">
        Curva de coste <span className="font-sans text-sm normal-case tracking-normal text-subtle">({total} cartas con coste)</span>
      </figcaption>
      <div className="flex h-28 items-end gap-0.5 border-b-2 border-ink" role="img" aria-label={`Curva de coste: ${summary}`}>
        {counts.map((n, i) => (
          <div
            key={BUCKETS[i]}
            className="group flex h-full flex-1 flex-col items-center justify-end"
            title={`Coste ${BUCKETS[i]}: ${n} ${n === 1 ? "carta" : "cartas"}`}
          >
            {n > 0 && <span className="text-xs font-bold tabular-nums text-ink">{n}</span>}
            <div
              className="w-full max-w-9 rounded-t bg-petrol group-hover:bg-petrol-dark"
              style={{ height: `${(n / max) * 80}%` }}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-0.5 text-center text-xs font-bold text-subtle" aria-hidden="true">
        {BUCKETS.map((b) => (
          <span key={b} className="flex-1">
            {b}
          </span>
        ))}
      </div>
    </figure>
  );
}
