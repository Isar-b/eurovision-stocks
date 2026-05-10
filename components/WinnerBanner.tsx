import type { Country } from "@/lib/types";

export function WinnerBanner({ winner }: { winner: Country }) {
  return (
    <div className="bg-gradient-to-r from-evs-magenta/30 via-evs-violet/30 to-evs-cyan/20 border-b border-evs-magenta/40 text-center py-2 text-sm">
      <span className="font-display font-bold uppercase tracking-[2px] text-evs-gold">
        🏆 Winner
      </span>{" "}
      <span className="font-display font-bold text-evs-soft">
        {winner.flag} {winner.name}
      </span>
    </div>
  );
}
