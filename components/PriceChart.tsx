"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

const POLL_MS = 15_000;

export function PriceChart({
  countryCode,
  initialHistory,
  initialPrice,
  openPrice,
}: {
  countryCode: string;
  initialHistory: Snapshot[];
  initialPrice: number;
  openPrice: number;
}) {
  const [range, setRange] = useState<RangeKey>("All");
  const [series, setSeries] = useState<Snapshot[]>(() => {
    // Seed with the server-provided history plus a synthetic "now" tick for the
    // current price, so the chart paints immediately even when history is empty.
    const seeded = [...initialHistory];
    const lastTs = seeded.length ? seeded[seeded.length - 1].ts : 0;
    const now = Date.now();
    if (now - lastTs > 1000) {
      seeded.push({ ts: now, price: initialPrice });
    }
    return seeded;
  });
  const lastSeenRef = useRef(initialPrice);

  useEffect(() => {
    let cancelled = false;
    async function tick() {
      try {
        const res = await fetch("/api/prices", { cache: "no-store" });
        const data = (await res.json()) as { prices: Record<string, number> };
        const next = data.prices[countryCode];
        if (cancelled || typeof next !== "number") return;
        // Only append if the price has actually moved or it's been > poll-interval since the last tick.
        setSeries((prev) => {
          const lastTs = prev.length ? prev[prev.length - 1].ts : 0;
          const ageMs = Date.now() - lastTs;
          if (next === lastSeenRef.current && ageMs < POLL_MS * 2) return prev;
          lastSeenRef.current = next;
          return [...prev, { ts: Date.now(), price: next }];
        });
      } catch {
        // ignore — try again next tick
      }
    }
    const id = setInterval(tick, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [countryCode]);

  const data = useMemo(() => {
    const now = Date.now();
    const cutoff = now - RANGES[range];
    const filtered = series
      .filter((s) => s.ts >= cutoff)
      .map((s) => ({ ts: s.ts, price: s.price }));
    // If we only have a single tick, mirror it to "now" so the chart paints a
    // flat line rather than a single dot — more honest about the underlying
    // unchanged price than a "loading…" placeholder.
    if (filtered.length === 1) {
      const only = filtered[0];
      const now2 = Date.now();
      if (now2 - only.ts > 1000) {
        filtered.push({ ts: now2, price: only.price });
      }
    }
    return filtered;
  }, [series, range]);

  const currentPrice = data.length ? data[data.length - 1].price : initialPrice;
  const isUp = currentPrice >= openPrice;
  const stroke = isUp ? "var(--evs-success)" : "var(--evs-danger)";
  const fillId = isUp ? "evs-chart-up" : "evs-chart-down";

  if (data.length < 2) {
    return (
      <div>
        <div className="evs-card h-56 grid place-items-center text-evs-muted text-sm">
          Collecting first price tick…
        </div>
        <RangeChips range={range} setRange={setRange} />
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
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <RangeChips range={range} setRange={setRange} />
    </div>
  );
}

function RangeChips({
  range,
  setRange,
}: {
  range: RangeKey;
  setRange: (k: RangeKey) => void;
}) {
  return (
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
  );
}
