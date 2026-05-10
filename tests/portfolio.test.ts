import { describe, it, expect } from "vitest";
import {
  applyTrade,
  totalValue,
  unrealisedPnL,
  holdingsValue,
} from "../lib/portfolio";
import type { Portfolio } from "../lib/types";

const fresh = (cash = 1000): Portfolio => ({
  userId: "u1",
  cash,
  holdings: {},
  updatedAt: "2026-05-10T00:00:00.000Z",
});

describe("applyTrade buy", () => {
  it("debits cash and creates a holding", () => {
    const p = fresh(1000);
    const r = applyTrade(p, { code: "FI", side: "buy", units: 5, price: 48 });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.portfolio.cash).toBe(760);
    expect(r.portfolio.holdings.FI).toEqual({ units: 5, costBasis: 48 });
  });

  it("rejects buys exceeding cash", () => {
    const p = fresh(100);
    const r = applyTrade(p, { code: "FI", side: "buy", units: 10, price: 48 });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error).toMatch(/cash/i);
  });

  it("averages cost basis on additive buys", () => {
    let p = fresh(1000);
    let r = applyTrade(p, { code: "FI", side: "buy", units: 5, price: 40 });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    p = r.portfolio;
    r = applyTrade(p, { code: "FI", side: "buy", units: 5, price: 60 });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.portfolio.holdings.FI.units).toBe(10);
    expect(r.portfolio.holdings.FI.costBasis).toBe(50);
  });

  it("supports fractional units to two decimal places", () => {
    const p = fresh(1000);
    const r = applyTrade(p, {
      code: "FI",
      side: "buy",
      units: 1.5,
      price: 40,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.portfolio.holdings.FI.units).toBe(1.5);
    expect(r.portfolio.cash).toBe(940);
  });

  it("rejects zero or negative quantities", () => {
    const p = fresh(1000);
    expect(applyTrade(p, { code: "FI", side: "buy", units: 0, price: 40 }).ok).toBe(
      false,
    );
    expect(applyTrade(p, { code: "FI", side: "buy", units: -1, price: 40 }).ok).toBe(
      false,
    );
  });
});

describe("applyTrade sell", () => {
  it("credits cash and reduces holding", () => {
    let p = fresh(1000);
    let r = applyTrade(p, { code: "FI", side: "buy", units: 10, price: 50 });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    p = r.portfolio;
    r = applyTrade(p, { code: "FI", side: "sell", units: 4, price: 60 });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    // 500 cash left after buy, +240 from sell = 740
    expect(r.portfolio.cash).toBe(740);
    expect(r.portfolio.holdings.FI.units).toBe(6);
    // Cost basis preserved on remaining units
    expect(r.portfolio.holdings.FI.costBasis).toBe(50);
  });

  it("removes the holding when fully sold", () => {
    let p = fresh(1000);
    let r = applyTrade(p, { code: "FI", side: "buy", units: 5, price: 50 });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    p = r.portfolio;
    r = applyTrade(p, { code: "FI", side: "sell", units: 5, price: 60 });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.portfolio.holdings.FI).toBeUndefined();
  });

  it("rejects sells exceeding holding", () => {
    let p = fresh(1000);
    let r = applyTrade(p, { code: "FI", side: "buy", units: 2, price: 50 });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    p = r.portfolio;
    r = applyTrade(p, { code: "FI", side: "sell", units: 5, price: 60 });
    expect(r.ok).toBe(false);
  });

  it("rejects sells when no holding exists", () => {
    const p = fresh(1000);
    const r = applyTrade(p, {
      code: "FI",
      side: "sell",
      units: 1,
      price: 60,
    });
    expect(r.ok).toBe(false);
  });
});

describe("portfolio aggregates", () => {
  const portfolio: Portfolio = {
    userId: "u1",
    cash: 312.5,
    holdings: {
      FI: { units: 4, costBasis: 38.1 },
      IT: { units: 10, costBasis: 27.4 },
    },
    updatedAt: "2026-05-10T00:00:00.000Z",
  };
  const prices = { FI: 47.62, IT: 28.57 };

  it("holdingsValue", () => {
    expect(holdingsValue(portfolio.holdings, prices)).toBe(476.18);
  });

  it("totalValue = cash + holdings value", () => {
    expect(totalValue(portfolio, prices)).toBe(788.68);
  });

  it("unrealisedPnL is positive when prices exceed cost basis", () => {
    const { absolute } = unrealisedPnL(portfolio, prices);
    // (47.62 - 38.10)*4 + (28.57 - 27.40)*10 = 38.08 + 11.70 = 49.78
    expect(absolute).toBeCloseTo(49.78, 2);
  });
});
