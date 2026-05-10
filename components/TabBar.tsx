"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Tab = { href: string; label: string; icon: string; matchPrefix: string };

const TABS: Tab[] = [
  { href: "/markets", label: "Markets", icon: "📈", matchPrefix: "/markets" },
  { href: "/portfolio", label: "Portfolio", icon: "💼", matchPrefix: "/portfolio" },
  { href: "/leaderboard", label: "Leaderboard", icon: "🏆", matchPrefix: "/leaderboard" },
];

export function TabBar() {
  const pathname = usePathname() ?? "";
  // Hide on country detail and trade pages so the tab bar doesn't compete with the back chevron.
  if (pathname.startsWith("/country") || pathname.startsWith("/login")) return null;
  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-0 left-0 right-0 z-30 bg-evs-deep/95 backdrop-blur border-t border-evs-border"
    >
      <div className="max-w-3xl mx-auto flex">
        {TABS.map((t) => {
          const active = pathname.startsWith(t.matchPrefix);
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-display font-bold uppercase tracking-[1.5px] transition-colors ${
                active ? "text-evs-magenta" : "text-evs-muted hover:text-evs-soft"
              }`}
            >
              <span className="text-lg leading-none">{t.icon}</span>
              <span>{t.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
