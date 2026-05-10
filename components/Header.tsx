"use client";

import type { User } from "@/lib/types";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function Header({
  user,
  contestClosed,
}: {
  user: User | null;
  contestClosed: boolean;
}) {
  const router = useRouter();
  async function handleSignOut() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="border-b border-evs-border bg-evs-deep/40 backdrop-blur sticky top-0 z-30">
      <div className="max-w-3xl mx-auto px-5 py-3 flex items-center justify-between gap-3">
        <Link href={user ? "/markets" : "/"} className="flex items-center gap-2">
          <span className="text-2xl">🎤</span>
          <div className="leading-tight">
            <div className="font-display font-extrabold text-base evs-display-gradient">
              Eurovision Stocks
            </div>
            <div className="text-[10px] uppercase tracking-[2px] text-evs-muted">
              Vienna 2026 {contestClosed ? "· Closed" : "· Live"}
            </div>
          </div>
        </Link>
        {user && (
          <div className="flex items-center gap-3">
            <div className="text-right leading-tight hidden sm:block">
              <div className="text-sm text-evs-soft">{user.displayName}</div>
            </div>
            {user.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatar}
                alt={user.displayName}
                className="w-8 h-8 rounded-full border border-evs-border"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-evs-violet/40 grid place-items-center font-display font-bold text-sm">
                {user.displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <button
              onClick={handleSignOut}
              className="text-xs text-evs-muted hover:text-evs-soft underline-offset-2 hover:underline"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
