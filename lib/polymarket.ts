import type { PriceMap } from "./types";
import { probabilityToPrice } from "./pricing";

const GAMMA_EVENT_URL =
  "https://gamma-api.polymarket.com/events?slug=eurovision-winner-2026";

export type PolymarketSubMarket = {
  id: string;
  question: string;
  slug: string;
  groupItemTitle: string;
  outcomes: string;
  outcomePrices?: string;
  clobTokenIds: string;
  lastTradePrice?: number;
  closed: boolean;
  active: boolean;
};

export type PolymarketEvent = {
  id: string;
  slug: string;
  title: string;
  closed: boolean;
  active: boolean;
  endDate: string;
  markets: PolymarketSubMarket[];
};

function isLikelyCountry(m: PolymarketSubMarket): boolean {
  const title = m.groupItemTitle?.trim() ?? "";
  if (!title) return false;
  if (title === "Other") return false;
  if (/^Country\s+[A-Z]$/.test(title)) return false;
  return true;
}

export async function fetchEvent(): Promise<PolymarketEvent> {
  const res = await fetch(GAMMA_EVENT_URL, {
    cache: "no-store",
    headers: { accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(
      `Polymarket Gamma error ${res.status}: ${await res.text()}`,
    );
  }
  const arr = (await res.json()) as PolymarketEvent[];
  const ev = arr[0];
  if (!ev) throw new Error("Polymarket: empty events response");
  return ev;
}

export type ParsedSubMarket = {
  countryName: string;
  yesPrice: number; // probability 0..1
  yesTokenId: string;
  marketId: string;
  slug: string;
  active: boolean;
  closed: boolean;
};

export function parseEvent(ev: PolymarketEvent): ParsedSubMarket[] {
  const out: ParsedSubMarket[] = [];
  for (const m of ev.markets) {
    if (!isLikelyCountry(m)) continue;
    let yesPrice: number | null = null;
    if (m.outcomePrices) {
      try {
        const arr = JSON.parse(m.outcomePrices) as string[];
        if (arr.length >= 1) yesPrice = parseFloat(arr[0]);
      } catch {
        // ignore parse error
      }
    }
    if (yesPrice === null && typeof m.lastTradePrice === "number") {
      yesPrice = m.lastTradePrice;
    }
    if (yesPrice === null) continue;
    let yesTokenId = "";
    try {
      const ids = JSON.parse(m.clobTokenIds) as string[];
      yesTokenId = ids[0] ?? "";
    } catch {
      // ignore
    }
    out.push({
      countryName: m.groupItemTitle.trim(),
      yesPrice,
      yesTokenId,
      marketId: m.id,
      slug: m.slug,
      active: m.active,
      closed: m.closed,
    });
  }
  return out;
}

export async function fetchPricesByCountry(): Promise<
  Record<string, { price: number; closed: boolean; active: boolean }>
> {
  const ev = await fetchEvent();
  const subs = parseEvent(ev);
  const result: Record<string, { price: number; closed: boolean; active: boolean }> = {};
  for (const s of subs) {
    result[s.countryName] = {
      price: probabilityToPrice(s.yesPrice),
      closed: s.closed,
      active: s.active,
    };
  }
  return result;
}

/**
 * Build a {countryCode -> price} map suitable for the `prices:current` store key,
 * given a `Country[]` from the seed and a fresh fetch from Polymarket. Countries
 * the API has dropped or marked closed retain their last seeded price (set by
 * caller's existing PriceMap), or fall back to 0 if none.
 */
export function applyPricesByCountry(
  countries: { code: string; name: string }[],
  byCountry: Record<string, { price: number; closed: boolean; active: boolean }>,
  fallback: PriceMap,
): { prices: PriceMap; closedCountries: string[]; missing: string[] } {
  const prices: PriceMap = { ...fallback };
  const closedCountries: string[] = [];
  const missing: string[] = [];
  for (const c of countries) {
    const live = byCountry[c.name];
    if (!live) {
      missing.push(c.name);
      if (prices[c.code] === undefined) prices[c.code] = 0;
      continue;
    }
    if (live.closed) closedCountries.push(c.code);
    prices[c.code] = live.price;
  }
  return { prices, closedCountries, missing };
}
