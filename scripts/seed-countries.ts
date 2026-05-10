import fs from "node:fs/promises";
import path from "node:path";
import { fetchEvent, parseEvent } from "../lib/polymarket";
import { COUNTRY_META } from "../lib/countries";
import { probabilityToPrice } from "../lib/pricing";
import type { Country } from "../lib/types";

async function main() {
  const ev = await fetchEvent();
  console.log(`Polymarket event: ${ev.title}`);
  console.log(`Markets total: ${ev.markets.length}`);
  const subs = parseEvent(ev).filter((s) => s.active);
  console.log(`Active country sub-markets: ${subs.length}`);

  const countries: Country[] = [];
  const unknown: string[] = [];
  for (const s of subs) {
    const meta = COUNTRY_META[s.countryName];
    if (!meta) {
      unknown.push(s.countryName);
      continue;
    }
    countries.push({
      code: meta.code,
      name: s.countryName,
      flag: meta.flag,
      polymarketMarketId: s.marketId,
      polymarketSlug: s.slug,
      yesTokenId: s.yesTokenId,
      openPrice: probabilityToPrice(s.yesPrice),
    });
  }

  countries.sort((a, b) => a.name.localeCompare(b.name));

  if (unknown.length) {
    console.warn(
      `Skipped ${unknown.length} unmapped country names — add them to lib/countries.ts:`,
    );
    for (const u of unknown) console.warn(`  - ${u}`);
  }

  const outPath = path.join(process.cwd(), "data", "countries.seed.json");
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, JSON.stringify(countries, null, 2), "utf-8");
  console.log(`\nWrote ${countries.length} countries to ${outPath}`);
  for (const c of countries) {
    console.log(`  ${c.flag} ${c.code} ${c.name.padEnd(18)} £${c.openPrice}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
