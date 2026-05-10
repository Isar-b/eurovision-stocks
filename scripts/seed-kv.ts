/**
 * Run with the KV env vars set, e.g.
 *   dotenv -e .env.production.local -- tsx scripts/seed-kv.ts
 *
 * Pushes the local data/countries.seed.json into Upstash Redis.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { Redis } from "@upstash/redis";
import type { Country } from "../lib/types";

async function main() {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  if (!url || !token) {
    throw new Error("Missing UPSTASH_REDIS_REST_URL/TOKEN env vars");
  }
  const prefix = process.env.KV_KEY_PREFIX ?? "evs:";
  const redis = new Redis({ url, token });

  const seedPath = path.join(process.cwd(), "data", "countries.seed.json");
  const txt = await fs.readFile(seedPath, "utf-8");
  const countries = JSON.parse(txt) as Country[];
  console.log(`Loaded ${countries.length} countries from ${seedPath}`);

  await redis.set(`${prefix}countries`, countries);
  console.log(`Wrote ${prefix}countries`);

  const existingState = await redis.get(`${prefix}contest:state`);
  if (!existingState) {
    await redis.set(`${prefix}contest:state`, { closed: false });
    console.log(`Initialised ${prefix}contest:state`);
  } else {
    console.log(`Kept existing ${prefix}contest:state`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
