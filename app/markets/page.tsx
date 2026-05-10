import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { store } from "@/lib/store";
import { MarketsList } from "@/components/MarketsList";
import {
  fetchPricesByCountry,
  applyPricesByCountry,
  bootstrapCountriesFromPolymarket,
} from "@/lib/polymarket";
import { PRICE_POLL_INTERVAL_MS } from "@/lib/dates";

export const dynamic = "force-dynamic";

async function ensureCountriesSeeded() {
  const existing = await store.listCountries();
  if (existing.length > 0) return;
  try {
    const fresh = await bootstrapCountriesFromPolymarket();
    if (fresh.length > 0) await store.replaceCountries(fresh);
  } catch (e) {
    console.error("Country bootstrap failed:", e);
  }
}

async function refreshPricesIfStale() {
  await ensureCountriesSeeded();
  const last = await store.getPricesLastFetch();
  if (Date.now() - last < PRICE_POLL_INTERVAL_MS) return;
  try {
    const byCountry = await fetchPricesByCountry();
    const countries = await store.listCountries();
    const fallback = await store.getCurrentPrices();
    const { prices, closedCountries } = applyPricesByCountry(
      countries,
      byCountry,
      fallback,
    );
    await store.setCurrentPrices(prices);
    await store.setPricesLastFetch(Date.now());
    const ts = Date.now();
    await Promise.all(
      countries.map((c) =>
        store.appendPriceSnapshot(c.code, { ts, price: prices[c.code] ?? 0 }),
      ),
    );
    for (const code of closedCountries) {
      const c = countries.find((x) => x.code === code);
      if (c && !c.withdrawn) {
        await store.upsertCountry({ ...c, withdrawn: true });
      }
    }
  } catch (e) {
    console.error("Price refresh failed:", e);
  }
}

export default async function MarketsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  await refreshPricesIfStale();

  const countries = await store.listCountries();
  const prices = await store.getCurrentPrices();
  const lastFetch = await store.getPricesLastFetch();

  return (
    <div className="max-w-3xl mx-auto px-5 py-5">
      <div className="mb-4">
        <div className="evs-section-label text-evs-cyan">Markets</div>
        <h1 className="font-display font-extrabold text-2xl">
          {countries.length} countries · live
        </h1>
      </div>
      <MarketsList
        countries={countries}
        initialPrices={prices}
        initialLastFetch={lastFetch}
      />
    </div>
  );
}
