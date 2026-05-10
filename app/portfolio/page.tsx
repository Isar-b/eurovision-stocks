import { redirect } from "next/navigation";
import { getCurrentUser, ensurePortfolio } from "@/lib/auth";
import { store } from "@/lib/store";
import { PortfolioSummary } from "@/components/PortfolioSummary";
import { HoldingRow } from "@/components/HoldingRow";

export const dynamic = "force-dynamic";

export default async function PortfolioPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await ensurePortfolio(user.id);

  const portfolio = await store.getPortfolio(user.id);
  if (!portfolio) redirect("/markets");

  const prices = await store.getCurrentPrices();
  const countries = await store.listCountries();
  const countryMap = new Map(countries.map((c) => [c.code, c]));

  const holdingEntries = Object.entries(portfolio.holdings)
    .map(([code, h]) => {
      const c = countryMap.get(code);
      if (!c) return null;
      return { country: c, holding: h, currentPrice: prices[code] ?? c.openPrice };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => b.holding.units * b.currentPrice - a.holding.units * a.currentPrice);

  return (
    <div className="max-w-3xl mx-auto px-5 py-5 space-y-5">
      <div>
        <div className="evs-section-label text-evs-cyan">My portfolio</div>
        <h1 className="font-display font-extrabold text-2xl">
          {user.displayName}
        </h1>
      </div>

      <PortfolioSummary portfolio={portfolio} prices={prices} />

      <div>
        <div className="evs-section-label mb-2">
          Holdings ({holdingEntries.length})
        </div>
        {holdingEntries.length === 0 ? (
          <div className="evs-card p-6 text-center text-evs-muted text-sm">
            You don&apos;t hold any countries yet.
            <br />
            <a href="/markets" className="text-evs-cyan hover:underline">
              Open the markets →
            </a>
          </div>
        ) : (
          <div className="space-y-1.5">
            {holdingEntries.map(({ country, holding, currentPrice }) => (
              <HoldingRow
                key={country.code}
                country={country}
                holding={holding}
                currentPrice={currentPrice}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
