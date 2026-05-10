import Link from "next/link";
import type { Country, Holding } from "@/lib/types";

export function HoldingRow({
  country,
  holding,
  currentPrice,
}: {
  country: Country;
  holding: Holding;
  currentPrice: number;
}) {
  const value = holding.units * currentPrice;
  const pnlAbs = (currentPrice - holding.costBasis) * holding.units;
  const pnlPct =
    holding.costBasis > 0
      ? ((currentPrice - holding.costBasis) / holding.costBasis) * 100
      : 0;
  const up = pnlAbs >= 0;

  return (
    <Link
      href={`/country/${country.code}`}
      className="evs-card flex items-center gap-3 p-3 hover:bg-white/5"
    >
      <span className="text-2xl">{country.flag}</span>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-evs-soft">
          {country.name} · <span className="evs-tabular">{holding.units}</span> units
        </div>
        <div className="text-[11px] text-evs-muted evs-tabular">
          Cost £{holding.costBasis.toFixed(2)} · Now £{currentPrice.toFixed(2)}
        </div>
      </div>
      <div className="text-right">
        <div className="evs-price text-evs-soft">
          £{value.toFixed(2)}
        </div>
        <div
          className={`text-[11px] evs-tabular ${
            up ? "text-evs-success" : "text-evs-danger"
          }`}
        >
          {up ? "+" : ""}
          £{pnlAbs.toFixed(2)} · {up ? "+" : ""}
          {pnlPct.toFixed(2)}%
        </div>
      </div>
    </Link>
  );
}
