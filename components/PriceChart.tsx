"use client";

import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Area,
  ComposedChart,
} from "recharts";

type Snapshot = { ts: number; price: number };

const RANGES = {
  "1H": 60 * 60 * 1000,
  "6H": 6 * 60 * 60 * 1000,
  "1D": 24 * 60 * 60 * 1000,
  All: Number.POSITIVE_INFINITY,
} as const;

type RangeKey = keyof typeof RANGES;

export function PriceChart({
  history,
  openPrice,
  currentPrice,
}: {
  history: Snapshot[];
  openPrice: number;
  currentPrice: number;
}) {
  const [range, setRange] = useState<RangeKey>("All");

  const data = useMemo(() => {
    const now = Date.now();
    const cutoff = now - RANGES[range];
    const filtered = history.filter((s) => s.ts >= cutoff);
    // Always include the latest live price as the right-most point.
    if (filtered.length === 0 || filtered[filtered.length - 1].price !== currentPrice) {
      filtered.push({ ts: now, price: currentPrice });
    }
    return filtered.map((s) => ({
      ts: s.ts,
      price: s.price,
      label: new Date(s.ts).toLocaleString([], {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "short",
      }),
    }));
  }, [history, range, currentPrice]);

  const isUp = currentPrice >= openPrice;
  const stroke = isUp ? "var(--evs-success)" : "var(--evs-danger)";
  const fillId = isUp ? "evs-chart-up" : "evs-chart-down";

  if (data.length < 2) {
    return (
      <div className="evs-card h-48 grid place-items-center text-evs-muted text-sm">
        Collecting price history…
      </div>
    );
  }

  return (
    <div>
      <div className="evs-card overflow-hidden h-56 px-2 py-3">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data}>
            <defs>
              <linearGradient id="evs-chart-up" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--evs-success)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="var(--evs-success)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="evs-chart-down" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--evs-danger)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="var(--evs-danger)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis
              dataKey="ts"
              type="number"
              domain={["dataMin", "dataMax"]}
              tickFormatter={(t: number) =>
                new Date(t).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              }
              stroke="rgba(255,255,255,0.3)"
              fontSize={10}
            />
            <YAxis
              dataKey="price"
              tickFormatter={(p: number) => `£${p.toFixed(0)}`}
              stroke="rgba(255,255,255,0.3)"
              fontSize={10}
              width={40}
            />
            <Tooltip
              contentStyle={{
                background: "#060818",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 6,
                fontSize: 12,
              }}
              labelFormatter={(t: number) => new Date(t).toLocaleString()}
              formatter={(value: number) => [`£${value.toFixed(2)}`, "Price"]}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke="none"
              fill={`url(#${fillId})`}
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke={stroke}
              strokeWidth={2}
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="flex gap-2 mt-2">
        {(Object.keys(RANGES) as RangeKey[]).map((k) => (
          <button
            key={k}
            onClick={() => setRange(k)}
            className={`px-3 py-1 rounded-md text-[11px] font-display font-bold ${
              range === k
                ? "bg-evs-magenta text-white"
                : "bg-white/5 text-evs-muted hover:text-evs-soft"
            }`}
          >
            {k}
          </button>
        ))}
      </div>
    </div>
  );
}
