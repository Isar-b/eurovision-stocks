import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const portfolio = await store.getPortfolio(user.id);
  const prices = await store.getCurrentPrices();
  return NextResponse.json({ portfolio, prices });
}
