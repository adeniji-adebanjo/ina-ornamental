// Horizontal bar list — the right form for "magnitude across categories". A
// single hue (identity is carried by the always-present row label + value, not
// by color, so no categorical palette is needed), recessive track, rounded
// data-ends. Plain server component.
export interface BarItem {
  label: string;
  value: number;
}

export function BarList({
  items,
  format = (n) => n.toLocaleString(),
  emptyLabel = "No data yet.",
}: {
  items: BarItem[];
  format?: (n: number) => string;
  emptyLabel?: string;
}) {
  const populated = items.filter((i) => i.value > 0);
  if (populated.length === 0) {
    return <p className="py-6 text-center text-sm text-slate-400">{emptyLabel}</p>;
  }
  const max = Math.max(...items.map((i) => i.value), 1);

  return (
    <ul className="space-y-2.5">
      {items.map((it) => {
        const pct = max > 0 ? (it.value / max) * 100 : 0;
        return (
          <li key={it.label}>
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="truncate text-xs text-slate-600">{it.label}</span>
              <span className="shrink-0 text-xs font-semibold text-slate-800 tabular-nums">
                {format(it.value)}
              </span>
            </div>
            <div
              className="h-2 overflow-hidden rounded-full bg-slate-100"
              role="img"
              aria-label={`${it.label}: ${format(it.value)}`}
            >
              <div
                className="h-full rounded-full bg-sky-800"
                // Give any non-zero value a visible sliver.
                style={{ width: `${it.value > 0 ? Math.max(pct, 4) : 0}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
