export type LeaderboardRowData = {
  rank: number;
  userId: string;
  displayName: string;
  avatar?: string;
  total: number;
  pnlVsStart: number;
  pnlPct: number;
};

export function LeaderboardRow({
  row,
  highlight = false,
}: {
  row: LeaderboardRowData;
  highlight?: boolean;
}) {
  const up = row.pnlVsStart >= 0;
  return (
    <div
      className={`evs-card flex items-center gap-3 p-3 ${
        highlight ? "border-evs-magenta/60 ring-1 ring-evs-magenta/30" : ""
      }`}
    >
      <div className="font-display font-extrabold text-evs-muted w-6 text-center">
        {row.rank}
      </div>
      {row.avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={row.avatar}
          alt=""
          className="w-9 h-9 rounded-full border border-evs-border"
        />
      ) : (
        <div className="w-9 h-9 rounded-full bg-evs-violet/40 grid place-items-center font-display font-bold text-sm">
          {row.displayName.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="font-display font-bold text-evs-soft truncate">
          {row.displayName}
          {highlight && (
            <span className="ml-2 text-[10px] uppercase tracking-[1px] text-evs-magenta">
              You
            </span>
          )}
        </div>
        <div
          className={`text-[11px] evs-tabular ${
            up ? "text-evs-success" : "text-evs-danger"
          }`}
        >
          {up ? "+" : ""}
          £{row.pnlVsStart.toFixed(2)} · {up ? "+" : ""}
          {row.pnlPct.toFixed(2)}%
        </div>
      </div>
      <div className="font-display font-extrabold evs-tabular text-evs-soft">
        £{row.total.toFixed(2)}
      </div>
    </div>
  );
}
