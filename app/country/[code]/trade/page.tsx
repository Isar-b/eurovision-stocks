import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { store } from "@/lib/store";
import { DealTicket } from "@/components/DealTicket";
import { STARTING_CASH } from "@/lib/dates";

export const dynamic = "force-dynamic";

type Params = {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ side?: string }>;
};

export default async function TradePage({ params, searchParams }: Params) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { code } = await params;
  const { side } = await searchParams;
  if (side !== "buy" && side !== "sell") redirect(`/country/${code}`);

  const country = await store.getCountry(code);
  if (!country) notFound();

  const contest = await store.getContestState();
  if (contest.closed) redirect(`/country/${code}`);
  if (side === "buy" && country.withdrawn) redirect(`/country/${code}`);

  const prices = await store.getCurrentPrices();
  const portfolio = await store.getPortfolio(user.id);
  const cash = portfolio?.cash ?? STARTING_CASH;
  const holding = portfolio?.holdings[code] ?? null;
  if (side === "sell" && !holding) redirect(`/country/${code}`);

  const currentPrice = prices[code] ?? country.openPrice;

  return (
    <div className="max-w-md mx-auto px-5 py-5 space-y-4">
      <Link
        href={`/country/${code}`}
        className="text-evs-muted text-sm hover:text-evs-soft"
      >
        ← {country.name}
      </Link>
      <h1 className="font-display font-extrabold text-2xl">
        {side === "buy" ? "Buy" : "Sell"} · {country.flag} {country.name}
      </h1>
      <DealTicket
        country={country}
        side={side}
        currentPrice={currentPrice}
        cash={cash}
        holding={holding}
      />
    </div>
  );
}
