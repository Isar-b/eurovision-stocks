import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { store } from "@/lib/store";
import { PriceChart } from "@/components/PriceChart";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ code: string }>; searchParams: Promise<{ traded?: string }> };

export default async function CountryDetailPage({ params, searchParams }: Params) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { code } = await params;
  const { traded } = await searchParams;

  const country = await store.getCountry(code);
  if (!country) notFound();

  const prices = await store.getCurrentPrices();
  const history = await store.getPriceHistory(code);
  const portfolio = await store.getPortfolio(user.id);
  const contest = await store.getContestState();

  const currentPrice = prices[code] ?? country.openPrice;
  const change = country.openPrice > 0
    ? ((currentPrice - country.openPrice) / country.openPrice) * 100
    : 0;
  const holding = portfolio?.holdings[code] ?? null;

  const tradingDisabled = contest.closed;
  const buyDisabled = tradingDisabled || country.withdrawn;

  return (
    <div className="max-w-3xl mx-auto px-5 py-5 space-y-4">
      <Link href="/markets" className="text-evs-muted text-sm hover:text-evs-soft">
        ← Markets
      </Link>

      <div className="flex items-center gap-3">
        <span className="text-4xl">{country.flag}</span>
        <h1 className="font-display font-extrabold text-2xl">
          {country.name}
          {country.withdrawn && (
            <span className="ml-2 text-xs text-evs-danger uppercase tracking-[1px]">
              Withdrawn
            </span>
          )}
        </h1>
      </div>

      <div>
        <div className="evs-price-lg text-4xl text-evs-soft">
          £{currentPrice.toFixed(2)}
        </div>
        <div
          className={`text-sm evs-tabular ${
            change > 0
              ? "text-evs-success"
              : change < 0
                ? "text-evs-danger"
                : "text-evs-muted"
          }`}
        >
          {change > 0 ? "▲ +" : change < 0 ? "▼ " : ""}
          £{(currentPrice - country.openPrice).toFixed(2)} · {change > 0 ? "+" : ""}
          {change.toFixed(2)}% since open
        </div>
      </div>

      <PriceChart
        countryCode={country.code}
        initialHistory={history}
        initialPrice={currentPrice}
        openPrice={country.openPrice}
      />

      {holding && (
        <div className="evs-card p-4">
          <div className="evs-section-label mb-1">Your position</div>
          <div className="text-lg text-evs-soft">
            <span className="evs-price">{holding.units}</span> units
          </div>
          <div className="text-sm text-evs-muted evs-tabular">
            Cost basis £{holding.costBasis.toFixed(2)} · Value £
            {(holding.units * currentPrice).toFixed(2)} ·{" "}
            <span
              className={
                currentPrice >= holding.costBasis
                  ? "text-evs-success"
                  : "text-evs-danger"
              }
            >
              {currentPrice >= holding.costBasis ? "+" : ""}
              £{((currentPrice - holding.costBasis) * holding.units).toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {traded && (
        <div className="evs-card p-3 text-sm text-evs-success bg-evs-success/5 border-evs-success/30">
          {traded === "buy" ? "Purchase" : "Sale"} confirmed.
        </div>
      )}

      {!tradingDisabled && (
        <div className="grid grid-cols-2 gap-2 sticky bottom-20 pt-2 bg-evs-navy/90 -mx-5 px-5 pb-2 border-t border-evs-border/40">
          <Link
            href={buyDisabled ? "#" : `/country/${code}/trade?side=buy`}
            className={`evs-btn-primary ${buyDisabled ? "pointer-events-none opacity-40" : ""}`}
          >
            Buy
          </Link>
          <Link
            href={
              holding ? `/country/${code}/trade?side=sell` : "#"
            }
            className={`evs-btn-sell ${!holding ? "pointer-events-none opacity-40" : ""}`}
          >
            Sell
          </Link>
        </div>
      )}
    </div>
  );
}
