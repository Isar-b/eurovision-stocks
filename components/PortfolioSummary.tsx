import type { Portfolio, PriceMap } from "@/lib/types";
import { holdingsValue, totalValue, unrealisedPnL } from "@/lib/portfolio";
import { STARTING_CASH } from "@/lib/dates";

export function PortfolioSummary({
  portfolio,
  prices,
}: {
  portfolio: Portfolio;
  prices: PriceMap;
}) {
  const total = totalValue(portfolio, prices);
  const holdings = holdingsValue(portfolio.holdings, prices);
  const pnl = unrealisedPnL(portfolio, prices);
  const pnlVsStart = total - STARTING_CASH;
  const pnlVsStartPct = (pnlVsStart / STARTING_CASH) * 100;
  const isUp = pnlVsStart >= 0;

  return (
    <div className="space-y-3">
      <div className="evs-card p-5 evs-hero-gradient">
        <div className="evs-section-label mb-1">Total value</div>
        <div className="evs-price-lg text-4xl text-evs-soft">
          £{total.toFixed(2)}
        </div>
        <div
          className={`text-sm mt-1 evs-tabular ${
            isUp ? "text-evs-success" : "text-evs-danger"
          }`}
        >
          {isUp ? "▲" : "▼"} {isUp ? "+" : ""}
          £{pnlVsStart.toFixed(2)} · {isUp ? "+" : ""}
          {pnlVsStartPct.toFixed(2)}% since open
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Card label="Cash" value={`£${portfolio.cash.toFixed(2)}`} />
        <Card label="Holdings" value={`£${holdings.toFixed(2)}`} />
        <Card
          label="Unrealised P&L"
          value={`${pnl.absolute >= 0 ? "+" : ""}£${pnl.absolute.toFixed(2)}`}
          color={pnl.absolute >= 0 ? "success" : "danger"}
        />
      </div>
    </div>
  );
}

function Card({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: "success" | "danger";
}) {
  const c =
    color === "success"
      ? "text-evs-success"
      : color === "danger"
        ? "text-evs-danger"
        : "text-evs-soft";
  return (
    <div className="evs-card px-3 py-2.5">
      <div className="evs-section-label">{label}</div>
      <div className={`evs-price ${c}`}>{value}</div>
    </div>
  );
}
