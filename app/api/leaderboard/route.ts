import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { store } from "@/lib/store";
import { totalValue, unrealisedPnL } from "@/lib/portfolio";
import { STARTING_CASH } from "@/lib/dates";

export const dynamic = "force-dynamic";

export async function GET() {
  const me = await getCurrentUser();
  const portfolios = await store.listPortfolios();
  const users = await store.listUsers();
  const prices = await store.getCurrentPrices();
  const userMap = new Map(users.map((u) => [u.id, u]));

  const rows = portfolios
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
        pnlAbsolute: pnl.absolute,
        pnlPct: Math.round(pnlPct * 100) / 100,
        pnlVsStart: Math.round(pnlVsStart * 100) / 100,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => b.total - a.total)
    .map((r, i) => ({ ...r, rank: i + 1 }));

  return NextResponse.json({
    rows,
    me: me ? rows.find((r) => r.userId === me.id) ?? null : null,
  });
}
