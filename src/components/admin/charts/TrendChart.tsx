"use client";

import { useState } from "react";

export interface TrendPoint {
  label: string; // x-axis / tooltip label, e.g. "5 Jul"
  value: number;
}

// Single-series line+area chart. One hue (the title names the series, so no
// legend), recessive grid, non-scaling 2px stroke, crosshair + tooltip on hover.
// Pure inline SVG — no charting dependency.
const W = 680;
const H = 200;
const PAD = { top: 14, right: 12, bottom: 22, left: 30 };
const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;
const BASE_Y = PAD.top + PLOT_H;
const BRAND = "#3b655d";

function niceCeil(n: number): number {
  if (n <= 5) return 5;
  const pow = Math.pow(10, Math.floor(Math.log10(n)));
  const f = n / pow;
  const nice = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10;
  return nice * pow;
}

export function TrendChart({
  data,
  valueLabel = "",
}: {
  data: TrendPoint[];
  valueLabel?: string;
}) {
  const [active, setActive] = useState<number | null>(null);

  if (data.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-slate-400">No data yet.</p>
    );
  }

  const n = data.length;
  const values = data.map((d) => d.value);
  const maxY = niceCeil(Math.max(...values, 1));
  const x = (i: number) =>
    n > 1 ? PAD.left + (i / (n - 1)) * PLOT_W : PAD.left + PLOT_W / 2;
  const y = (v: number) => PAD.top + PLOT_H - (v / maxY) * PLOT_H;

  const linePts = data.map((d, i) => `${x(i)},${y(d.value)}`).join(" ");
  const areaPath = `M ${x(0)},${BASE_Y} L ${linePts} L ${x(n - 1)},${BASE_Y} Z`;
  const ticks = [0, maxY / 2, maxY];
  const labelIdx = [
    0,
    Math.round((n - 1) / 3),
    Math.round((2 * (n - 1)) / 3),
    n - 1,
  ].filter((v, i, a) => a.indexOf(v) === i);

  const total = values.reduce((s, v) => s + v, 0);

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Trend of ${valueLabel || "values"} over ${n} points, total ${total}.`}
        onMouseLeave={() => setActive(null)}
      >
        {/* Gridlines + y ticks */}
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={y(t)}
              y2={y(t)}
              stroke="#eee7db"
              strokeWidth={1}
            />
            <text
              x={PAD.left - 6}
              y={y(t) + 3}
              textAnchor="end"
              fontSize={9}
              fill="#a8a091"
            >
              {Math.round(t)}
            </text>
          </g>
        ))}

        {/* Area + line */}
        <path d={areaPath} fill={BRAND} fillOpacity={0.08} />
        <polyline
          points={linePts}
          fill="none"
          stroke={BRAND}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />

        {/* x-axis labels */}
        {labelIdx.map((i) => (
          <text
            key={i}
            x={x(i)}
            y={H - 6}
            textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"}
            fontSize={9}
            fill="#a8a091"
          >
            {data[i].label}
          </text>
        ))}

        {/* Active crosshair + point */}
        {active !== null && (
          <>
            <line
              x1={x(active)}
              x2={x(active)}
              y1={PAD.top}
              y2={BASE_Y}
              stroke="#c9bfae"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
            <circle
              cx={x(active)}
              cy={y(data[active].value)}
              r={4}
              fill={BRAND}
              stroke="#fff"
              strokeWidth={2}
            />
          </>
        )}

        {/* Hover hit-slices */}
        {data.map((_, i) => {
          const half = n > 1 ? PLOT_W / (n - 1) / 2 : PLOT_W / 2;
          return (
            <rect
              key={i}
              x={x(i) - half}
              y={PAD.top}
              width={half * 2}
              height={PLOT_H}
              fill="transparent"
              onMouseEnter={() => setActive(i)}
            />
          );
        })}
      </svg>

      {active !== null && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg bg-slate-900 px-2 py-1 text-center text-[11px] leading-tight text-white shadow-lg"
          style={{
            left: `${Math.min(Math.max((x(active) / W) * 100, 8), 92)}%`,
            top: `${(y(data[active].value) / H) * 100 - 2}%`,
          }}
        >
          <div className="font-semibold tabular-nums">
            {data[active].value.toLocaleString()}
            {valueLabel ? ` ${valueLabel}` : ""}
          </div>
          <div className="text-slate-300">{data[active].label}</div>
        </div>
      )}
    </div>
  );
}
