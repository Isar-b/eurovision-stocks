import { NextResponse } from "next/server";

// TEMPORARY: reports env-var presence only (no values). Removed after OAuth setup.
export const dynamic = "force-dynamic";

export async function GET() {
  const fingerprint = (name: string) => {
    const v = process.env[name];
    if (v === undefined) return "undefined";
    if (v === "") return "empty";
    return `set, length=${v.length}`;
  };
  return NextResponse.json({
    AUTH_GOOGLE_ID: fingerprint("AUTH_GOOGLE_ID"),
    AUTH_GOOGLE_SECRET: fingerprint("AUTH_GOOGLE_SECRET"),
    AUTH_SECRET: fingerprint("AUTH_SECRET"),
    NEXTAUTH_SECRET: fingerprint("NEXTAUTH_SECRET"),
    AUTH_URL: fingerprint("AUTH_URL"),
    NEXTAUTH_URL: fingerprint("NEXTAUTH_URL"),
    VERCEL_URL: fingerprint("VERCEL_URL"),
    VERCEL_ENV: process.env.VERCEL_ENV ?? "undefined",
    STORE_BACKEND: process.env.STORE_BACKEND ?? "undefined",
  });
}
