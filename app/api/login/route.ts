import { NextResponse } from "next/server";
import { z } from "zod";
import { loginAs } from "@/lib/auth";

const Body = z.object({ displayName: z.string().min(1).max(32) });

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = Body.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Display name required" }, { status: 400 });
  }
  try {
    const user = await loginAs(parsed.data.displayName);
    return NextResponse.json({ ok: true, user });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Login failed" },
      { status: 400 },
    );
  }
}
