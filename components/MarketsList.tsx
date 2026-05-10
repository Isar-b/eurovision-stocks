"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Country, PriceMap } from "@/lib/types";

type SortKey = "price-desc" | "price-asc" | "change-desc" | "change-asc";

export function MarketsList({
  countries,
  initialPrices,
  initialLastFetch,
}: {
  countries: Country[];
  initialPrices: PriceMap;
  initialLastFetch: number;
}) {
  const [prices, setPrices] = useState<PriceMap>(initialPrices);
  const [lastFetch, setLastFetch] = useState<number>(initialLastFetch);
  const [stale, setStale] = useState(false);
  const [sort, setSort] = useState<SortKey>("price-desc");

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/prices", { cache: "no-store" });
        const data = (await res.json()) as {
          prices: PriceMap;
          lastFetch: number;
          stale: boolean;
        };
        setPrices(data.prices);
        setLastFetch(data.lastFetch);
        setStale(data.stale);
      } catch {
        setStale(true);
      }
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  const rows = useMemo(() => {
    const enriched = countries.map((c) => {
      const price = prices[c.code] ?? c.openPrice;
      const change = c.openPrice > 0 ? ((price - c.openPrice) / c.openPrice) * 100 : 0;
      return { country: c, price, change };
    });
    enriched.sort((a, b) => {
      switch (sort) {
        case "price-desc":
          return b.price - a.price;
        case "price-asc":
          return a.price - b.price;
        case "change-desc":
          return b.change - a.change;
        case "change-asc":
          return a.change - b.change;
      }
    });
    return enriched;
  }, [countries, prices, sort]);

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex gap-2 flex-wrap">
          <SortChip
            current={sort}
            value="price-desc"
            label="Price ▼"
            onClick={setSort}
          />
          <SortChip
            current={sort}
            value="price-asc"
            label="Price ▲"
            onClick={setSort}
          />
          <SortChip
            current={sort}
            value="change-desc"
            label="Movers ▲"
            onClick={setSort}
          />
          <SortChip
            current={sort}
            value="change-asc"
            label="Movers ▼"
            onClick={setSort}
          />
        </div>
        <div className="text-[10px] text-evs-muted text-right">
          {stale ? (
            <span className="text-evs-danger">Prices stale</span>
          ) : (
            <>
              Updated{" "}
              <span className="evs-tabular">
                {lastFetch ? formatTime(lastFetch) : "—"}
              </span>
            </>
          )}
        </div>
      </div>
      <div className="space-y-1.5">
        {rows.map(({ country, price, change }) => (
          <Link
            key={country.code}
            href={`/country/${country.code}`}
            className="evs-card flex items-center gap-3 px-3 py-3 hover:bg-white/5 transition-colors"
          >
            <span className="text-2xl">{country.flag}</span>
            <div className="flex-1 min-w-0">
              <div className="font-display font-bold text-evs-soft truncate">
                {country.name}
              </div>
              <div className="text-[11px] text-evs-muted">
                {country.withdrawn ? "Withdrawn — sell only" : country.code}
              </div>
            </div>
            <div className="text-right">
              <div
                className={`font-display font-extrabold evs-tabular text-lg ${
                  change > 0
                    ? "text-evs-success"
                    : change < 0
                      ? "text-evs-danger"
                      : "text-evs-soft"
                }`}
              >
                £{price.toFixed(2)}
              </div>
              <div
                className={`text-[11px] evs-tabular ${
                  change > 0
                    ? "text-evs-success/80"
                    : change < 0
                      ? "text-evs-danger/80"
                      : "text-evs-muted"
                }`}
              >
                {change > 0 ? "+" : ""}
                {change.toFixed(2)}%
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function SortChip({
  current,
  value,
  label,
  onClick,
}: {
  current: SortKey;
  value: SortKey;
  label: string;
  onClick: (v: SortKey) => void;
}) {
  const active = current === value;
  return (
    <button
      onClick={() => onClick(value)}
      className={`px-3 py-1.5 rounded-md text-[11px] font-display font-bold uppercase tracking-[1px] transition-colors ${
        active
          ? "bg-evs-magenta text-white"
          : "bg-white/5 text-evs-muted hover:text-evs-soft"
      }`}
    >
      {label}
    </button>
  );
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}
