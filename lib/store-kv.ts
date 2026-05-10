import { Redis } from "@upstash/redis";
import type {
  Country,
  PriceMap,
  PriceSnapshot,
  Portfolio,
  User,
  ContestState,
} from "./types";
import type { Store } from "./store";
import { HISTORY_CAP } from "./dates";

const KEY_PREFIX = process.env.KV_KEY_PREFIX ?? "evs:";

const K = {
  countries: `${KEY_PREFIX}countries`,
  pricesCurrent: `${KEY_PREFIX}prices:current`,
  pricesLastFetch: `${KEY_PREFIX}prices:lastFetch`,
  pricesHistory: (code: string) => `${KEY_PREFIX}prices:history:${code}`,
  users: `${KEY_PREFIX}users`,
  userByName: (lc: string) => `${KEY_PREFIX}user:byname:${lc}`,
  portfolios: `${KEY_PREFIX}portfolios`,
  contestState: `${KEY_PREFIX}contest:state`,
};

let redis: Redis | null = null;
function getRedis(): Redis {
  if (!redis) {
    const url =
      process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
    const token =
      process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
    if (!url || !token) {
      throw new Error(
        "Missing Upstash/Vercel KV env vars: set UPSTASH_REDIS_REST_URL+TOKEN or KV_REST_API_URL+TOKEN",
      );
    }
    redis = new Redis({ url, token });
  }
  return redis;
}

async function getJson<T>(key: string, fallback: T): Promise<T> {
  const v = await getRedis().get<T>(key);
  return (v as T) ?? fallback;
}

async function setJson<T>(key: string, value: T): Promise<void> {
  await getRedis().set(key, value);
}

export const kvStore: Store = {
  async listCountries() {
    return getJson<Country[]>(K.countries, []);
  },
  async getCountry(code) {
    const all = await this.listCountries();
    return all.find((c) => c.code === code) ?? null;
  },
  async replaceCountries(all) {
    await setJson(K.countries, all);
  },
  async upsertCountry(c) {
    const all = await this.listCountries();
    const idx = all.findIndex((x) => x.code === c.code);
    if (idx >= 0) all[idx] = c;
    else all.push(c);
    await setJson(K.countries, all);
  },

  async getCurrentPrices() {
    return getJson<PriceMap>(K.pricesCurrent, {});
  },
  async setCurrentPrices(prices) {
    await setJson(K.pricesCurrent, prices);
  },
  async getPricesLastFetch() {
    return getJson<number>(K.pricesLastFetch, 0);
  },
  async setPricesLastFetch(ts) {
    await setJson(K.pricesLastFetch, ts);
  },
  async appendPriceSnapshot(code, snap) {
    const r = getRedis();
    const key = K.pricesHistory(code);
    await r.rpush(key, JSON.stringify(snap));
    // Trim to last HISTORY_CAP entries.
    await r.ltrim(key, -HISTORY_CAP, -1);
  },
  async getPriceHistory(code) {
    const r = getRedis();
    const raw = await r.lrange<string>(K.pricesHistory(code), 0, -1);
    return raw.map((s) =>
      typeof s === "string" ? (JSON.parse(s) as PriceSnapshot) : (s as PriceSnapshot),
    );
  },

  async listUsers() {
    return getJson<User[]>(K.users, []);
  },
  async getUser(id) {
    const all = await this.listUsers();
    return all.find((u) => u.id === id) ?? null;
  },
  async getUserByName(displayName) {
    const lc = displayName.trim().toLowerCase();
    const id = await getRedis().get<string>(K.userByName(lc));
    if (!id) return null;
    return this.getUser(id);
  },
  async upsertUser(u) {
    const all = await this.listUsers();
    const idx = all.findIndex((x) => x.id === u.id);
    if (idx >= 0) all[idx] = u;
    else all.push(u);
    await setJson(K.users, all);
    await getRedis().set(K.userByName(u.displayName.toLowerCase()), u.id);
  },

  async getPortfolio(userId) {
    const all = await this.listPortfolios();
    return all.find((p) => p.userId === userId) ?? null;
  },
  async savePortfolio(p) {
    const all = await this.listPortfolios();
    const idx = all.findIndex((x) => x.userId === p.userId);
    if (idx >= 0) all[idx] = p;
    else all.push(p);
    await setJson(K.portfolios, all);
  },
  async listPortfolios() {
    return getJson<Portfolio[]>(K.portfolios, []);
  },

  async getContestState() {
    return getJson<ContestState>(K.contestState, { closed: false });
  },
  async setContestState(s) {
    await setJson(K.contestState, s);
  },
};
