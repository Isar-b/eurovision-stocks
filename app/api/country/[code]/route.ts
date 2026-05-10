import { NextResponse } from "next/server";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ code: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { code } = await params;
  const country = await store.getCountry(code);
  if (!country) return NextResponse.json({ error: "not found" }, { status: 404 });
  const prices = await store.getCurrentPrices();
  const history = await store.getPriceHistory(code);
  return NextResponse.json({
    country,
    currentPrice: prices[code] ?? country.openPrice,
    history,
  });
}
