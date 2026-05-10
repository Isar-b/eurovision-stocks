// Eurovision 2026 — Vienna. Grand Final: Saturday 16 May 2026, 21:00 CEST = 19:00 UTC.
export const CONTEST_FINAL = "2026-05-16T19:00:00Z";

// Market open: arbitrary anchor for percent-change-since-open. We use the day the
// app went live; before then, openPrice in the seed reflects the snapshot.
export const CONTEST_OPEN = "2026-05-10T00:00:00Z";

export const STARTING_CASH = 1000;

export const PRICE_POLL_INTERVAL_MS = Number(
  process.env.PRICE_POLL_INTERVAL_MS ?? 30_000,
);

export const HISTORY_CAP = 10_000;
