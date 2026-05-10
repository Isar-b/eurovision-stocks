/**
 * Locks trading and (optionally) records the winner.
 *
 *   tsx scripts/freeze-contest.ts            # freeze, no winner yet
 *   tsx scripts/freeze-contest.ts FI         # freeze and set Finland as winner
 *
 * Run against KV with: dotenv -e .env.production.local -- tsx scripts/freeze-contest.ts FI
 */
import { store } from "../lib/store";

async function main() {
  const winnerCode = process.argv[2];
  const state = await store.getContestState();
  state.closed = true;
  state.closedAt = new Date().toISOString();
  if (winnerCode) {
    const c = await store.getCountry(winnerCode);
    if (!c) throw new Error(`No such country code: ${winnerCode}`);
    state.winner = winnerCode;
    // Set winner price to £100 per F-34.
    const prices = await store.getCurrentPrices();
    prices[winnerCode] = 100;
    await store.setCurrentPrices(prices);
    console.log(`Winner: ${c.flag} ${c.name}`);
  }
  await store.setContestState(state);
  console.log(`Contest frozen at ${state.closedAt}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
