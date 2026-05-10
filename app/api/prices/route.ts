import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import {
  fetchPricesByCountry,
  applyPricesByCountry,
  bootstrapCountriesFromPolymarket,
} from "@/lib/polymarket";
import { PRICE_POLL_INTERVAL_MS } from "@/lib/dates";

export const dynamic = "force-dynamic";

let inFlight: Promise<void> | null = null;

async function ensureCountries(): Promise<void> {
  const existing = await store.listCountries();
  if (existing.length > 0) return;
  const fresh = await bootstrapCountriesFromPolymarket();
  if (fresh.length > 0) {
    await store.replaceCountries(fresh);
  }
}

async function maybeRefresh(): Promise<{ refreshed: boolean; stale: boolean; error?: string }> {
  const last = await store.getPricesLastFetch();
  const now = Date.now();
  if (now - last < PRICE_POLL_INTERVAL_MS) {
    return { refreshed: false, stale: false };
  }

  if (inFlight) {
    await inFlight;
    return { refreshed: false, stale: false };
  }

  let error: string | undefined;
  inFlight = (async () => {
    try {
      await ensureCountries();
      const byCountry = await fetchPricesByCountry();
      const countries = await store.listCountries();
      const fallback = await store.getCurrentPrices();
      const { prices, closedCountries, missing } = applyPricesByCountry(
        countries,
        byCountry,
        fallback,
      );
      await store.setCurrentPrices(prices);
      await store.setPricesLastFetch(Date.now());

      // Persist a price snapshot per country for the chart.
      const ts = Date.now();
      await Promise.all(
        countries.map((c) =>
          store.appendPriceSnapshot(c.code, { ts, price: prices[c.code] ?? 0 }),
        ),
      );

      // Mark closed countries withdrawn.
      if (closedCountries.length) {
        for (const code of closedCountries) {
          const c = countries.find((x) => x.code === code);
          if (c && !c.withdrawn) {
            await store.upsertCountry({ ...c, withdrawn: true });
          }
        }
      }

      if (missing.length) {
        console.warn(`Polymarket missing countries: ${missing.join(", ")}`);
      }
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
      console.error("Polymarket fetch failed:", error);
    }
  })();
  try {
    await inFlight;
  } finally {
    inFlight = null;
  }
  return { refreshed: !error, stale: !!error, error };
}

export async function GET() {
  const refresh = await maybeRefresh();
  const prices = await store.getCurrentPrices();
  const lastFetch = await store.getPricesLastFetch();
  return NextResponse.json({
    prices,
    lastFetch,
    refreshed: refresh.refreshed,
    stale: refresh.stale,
    error: refresh.error,
  });
}
