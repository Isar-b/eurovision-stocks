import type { Portfolio, PriceMap, TradeSide, Holding } from "./types";
import { roundCurrency } from "./pricing";

export type TradeRequest = {
  code: string;
  side: TradeSide;
  units: number;
  price: number;
};

export type TradeResult =
  | { ok: true; portfolio: Portfolio }
  | { ok: false; error: string };

const UNIT_PRECISION = 2;

function roundUnits(u: number): number {
  return Math.round(u * 10 ** UNIT_PRECISION) / 10 ** UNIT_PRECISION;
}

export function applyTrade(p: Portfolio, t: TradeRequest): TradeResult {
  const units = roundUnits(t.units);
  if (!Number.isFinite(units) || units <= 0) {
    return { ok: false, error: "Quantity must be greater than zero." };
  }
  if (!Number.isFinite(t.price) || t.price <= 0) {
    return { ok: false, error: "Price unavailable for this country." };
  }

  const value = roundCurrency(units * t.price);
  const next: Portfolio = {
    ...p,
    holdings: { ...p.holdings },
    updatedAt: new Date().toISOString(),
  };
  const current = next.holdings[t.code];

  if (t.side === "buy") {
    if (value > p.cash + 1e-9) {
      return { ok: false, error: "Not enough cash for this purchase." };
    }
    next.cash = roundCurrency(p.cash - value);
    if (current) {
      const totalUnits = roundUnits(current.units + units);
      const totalCost =
        current.units * current.costBasis + units * t.price;
      next.holdings[t.code] = {
        units: totalUnits,
        costBasis: roundCurrency(totalCost / totalUnits),
      };
    } else {
      next.holdings[t.code] = {
        units,
        costBasis: roundCurrency(t.price),
      };
    }
    return { ok: true, portfolio: next };
  }

  // sell
  if (!current || current.units <= 0) {
    return { ok: false, error: "You don't hold any units of this country." };
  }
  if (units > current.units + 1e-9) {
    return {
      ok: false,
      error: `You only hold ${current.units} units.`,
    };
  }
  const remaining = roundUnits(current.units - units);
  next.cash = roundCurrency(p.cash + value);
  if (remaining <= 1e-9) {
    delete next.holdings[t.code];
  } else {
    next.holdings[t.code] = {
      units: remaining,
      costBasis: current.costBasis,
    };
  }
  return { ok: true, portfolio: next };
}

export function holdingsValue(
  holdings: Record<string, Holding>,
  prices: PriceMap,
): number {
  let total = 0;
  for (const [code, h] of Object.entries(holdings)) {
    const price = prices[code] ?? h.costBasis;
    total += h.units * price;
  }
  return roundCurrency(total);
}

export function totalValue(p: Portfolio, prices: PriceMap): number {
  return roundCurrency(p.cash + holdingsValue(p.holdings, prices));
}

export function unrealisedPnL(
  p: Portfolio,
  prices: PriceMap,
): { absolute: number; pct: number } {
  let cost = 0;
  let market = 0;
  for (const [code, h] of Object.entries(p.holdings)) {
    const price = prices[code] ?? h.costBasis;
    cost += h.units * h.costBasis;
    market += h.units * price;
  }
  const absolute = roundCurrency(market - cost);
  const pct = cost > 0 ? (absolute / cost) * 100 : 0;
  return { absolute, pct: Math.round(pct * 100) / 100 };
}
