import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { store } from "@/lib/store";
import { applyTrade } from "@/lib/portfolio";
import type { Portfolio } from "@/lib/types";
import { STARTING_CASH } from "@/lib/dates";

export const dynamic = "force-dynamic";

const TradeSchema = z.object({
  code: z.string().min(2).max(3),
  side: z.enum(["buy", "sell"]),
  units: z.number().positive().max(100_000),
});

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const contest = await store.getContestState();
  if (contest.closed) {
    return NextResponse.json(
      { error: "Trading is closed — the contest has ended." },
      { status: 403 },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = TradeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid trade payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { code, side, units } = parsed.data;
  const country = await store.getCountry(code);
  if (!country) {
    return NextResponse.json({ error: "Unknown country" }, { status: 404 });
  }
  if (country.withdrawn && side === "buy") {
    return NextResponse.json(
      { error: "This country has been withdrawn — no new purchases allowed." },
      { status: 409 },
    );
  }

  const prices = await store.getCurrentPrices();
  const price = prices[code] ?? country.openPrice;
  if (!price || price <= 0) {
    return NextResponse.json(
      { error: "Price unavailable for this country." },
      { status: 503 },
    );
  }

  const existing = await store.getPortfolio(user.id);
  const portfolio: Portfolio =
    existing ?? {
      userId: user.id,
      cash: STARTING_CASH,
      holdings: {},
      updatedAt: new Date().toISOString(),
    };

  const result = applyTrade(portfolio, { code, side, units, price });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  await store.savePortfolio(result.portfolio);

  return NextResponse.json({
    ok: true,
    portfolio: result.portfolio,
    executedPrice: price,
    units,
    side,
  });
}
