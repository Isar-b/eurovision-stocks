import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { store } from "@/lib/store";
import { PortfolioSummary } from "@/components/PortfolioSummary";
import { HoldingRow } from "@/components/HoldingRow";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ userId: string }> };

export default async function PublicPortfolioPage({ params }: Params) {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  const { userId } = await params;
  if (userId === me.id) redirect("/portfolio");

  const user = await store.getUser(userId);
  if (!user) notFound();

  const portfolio = await store.getPortfolio(userId);
  const prices = await store.getCurrentPrices();
  const countries = await store.listCountries();
  const countryMap = new Map(countries.map((c) => [c.code, c]));

  const holdingEntries = portfolio
    ? Object.entries(portfolio.holdings)
        .map(([code, h]) => {
          const c = countryMap.get(code);
          if (!c) return null;
          return {
            country: c,
            holding: h,
            currentPrice: prices[code] ?? c.openPrice,
          };
        })
        .filter((x): x is NonNullable<typeof x> => x !== null)
        .sort(
          (a, b) =>
            b.holding.units * b.currentPrice -
            a.holding.units * a.currentPrice,
        )
    : [];

  return (
    <div className="max-w-3xl mx-auto px-5 py-5 space-y-5">
      <Link
        href="/leaderboard"
        className="text-evs-muted text-sm hover:text-evs-soft"
      >
        ← Leaderboard
      </Link>

      <div className="flex items-center gap-3">
        {user.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.avatar}
            alt=""
            className="w-12 h-12 rounded-full border border-evs-border"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-evs-violet/40 grid place-items-center font-display font-bold text-lg">
            {user.displayName.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <div className="evs-section-label text-evs-cyan">Trader</div>
          <h1 className="font-display font-extrabold text-2xl">
            {user.displayName}
          </h1>
        </div>
      </div>

      {portfolio ? (
        <PortfolioSummary portfolio={portfolio} prices={prices} />
      ) : (
        <div className="evs-card p-5 text-evs-muted text-sm">
          No portfolio yet.
        </div>
      )}

      <div>
        <div className="evs-section-label mb-2">
          Holdings ({holdingEntries.length})
        </div>
        {holdingEntries.length === 0 ? (
          <div className="evs-card p-6 text-center text-evs-muted text-sm">
            {user.displayName} hasn&apos;t bought any countries yet.
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
