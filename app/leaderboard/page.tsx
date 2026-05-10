import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { store } from "@/lib/store";
import { totalValue, unrealisedPnL } from "@/lib/portfolio";
import { LeaderboardRow, type LeaderboardRowData } from "@/components/LeaderboardRow";
import { STARTING_CASH } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const portfolios = await store.listPortfolios();
  const users = await store.listUsers();
  const prices = await store.getCurrentPrices();
  const userMap = new Map(users.map((u) => [u.id, u]));

  const rows: LeaderboardRowData[] = portfolios
    .map((p) => {
      const u = userMap.get(p.userId);
      if (!u) return null;
      const total = totalValue(p, prices);
      const pnl = unrealisedPnL(p, prices);
      const pnlVsStart = total - STARTING_CASH;
      const pnlPct = (pnlVsStart / STARTING_CASH) * 100;
      return {
        userId: u.id,
        displayName: u.displayName,
        avatar: u.avatar,
        total,
        pnlVsStart: Math.round(pnlVsStart * 100) / 100,
        pnlPct: Math.round(pnlPct * 100) / 100,
        pnlAbsolute: pnl.absolute,
        rank: 0,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => b.total - a.total)
    .map((r, i) => ({ ...r, rank: i + 1 }));

  const top = rows.slice(0, 10);
  const me = rows.find((r) => r.userId === user.id) ?? null;
  const meInTop = me && top.some((r) => r.userId === me.userId);

  return (
    <div className="max-w-3xl mx-auto px-5 py-5 space-y-4">
      <div>
        <div className="evs-section-label text-evs-cyan">Leaderboard</div>
        <h1 className="font-display font-extrabold text-2xl">
          {rows.length} {rows.length === 1 ? "trader" : "traders"}
        </h1>
      </div>
      {rows.length === 0 ? (
        <div className="evs-card p-6 text-center text-evs-muted text-sm">
          No trades yet.
        </div>
      ) : (
        <div className="space-y-1.5">
          {top.map((r) => (
            <LeaderboardRow
              key={r.userId}
              row={r}
              highlight={r.userId === user.id}
              selfLink={r.userId === user.id}
            />
          ))}
          {me && !meInTop && (
            <>
              <div className="text-center text-evs-muted text-xs py-1">···</div>
              <LeaderboardRow row={me} highlight selfLink />
            </>
          )}
        </div>
      )}
    </div>
  );
}
