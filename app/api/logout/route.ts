import { NextResponse } from "next/server";
import { logout } from "@/lib/auth";
import { signOut } from "@/auth";
import { oauthEnabled } from "@/auth";

export async function POST() {
  if (oauthEnabled) {
    await signOut({ redirect: false });
  } else {
    await logout();
  }
  return NextResponse.json({ ok: true });
}
