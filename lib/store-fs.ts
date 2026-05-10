import fs from "node:fs/promises";
import path from "node:path";
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

const DATA_DIR = path.join(process.cwd(), "data");

const FILES = {
  countries: path.join(DATA_DIR, "countries.json"),
  countriesSeed: path.join(DATA_DIR, "countries.seed.json"),
  pricesCurrent: path.join(DATA_DIR, "prices-current.json"),
  pricesLastFetch: path.join(DATA_DIR, "prices-lastFetch.json"),
  pricesHistory: path.join(DATA_DIR, "prices-history.json"),
  users: path.join(DATA_DIR, "users.json"),
  portfolios: path.join(DATA_DIR, "portfolios.json"),
  contestState: path.join(DATA_DIR, "contest-state.json"),
};

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readJsonOrSeed<T>(
  file: string,
  seedFile: string | null,
  fallback: T,
): Promise<T> {
  await ensureDir();
  try {
    const txt = await fs.readFile(file, "utf-8");
    return JSON.parse(txt) as T;
  } catch {
    if (seedFile) {
      try {
        const txt = await fs.readFile(seedFile, "utf-8");
        const parsed = JSON.parse(txt) as T;
        await fs.writeFile(file, JSON.stringify(parsed, null, 2), "utf-8");
        return parsed;
      } catch {
        // fall through
      }
    }
    await fs.writeFile(file, JSON.stringify(fallback, null, 2), "utf-8");
    return fallback;
  }
}

async function writeJson<T>(file: string, data: T): Promise<void> {
  await ensureDir();
  await fs.writeFile(file, JSON.stringify(data, null, 2), "utf-8");
}

const locks = new Map<string, Promise<void>>();
async function withLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const prev = locks.get(key) ?? Promise.resolve();
  let release: () => void = () => {};
  const p = new Promise<void>((res) => (release = res));
  locks.set(key, prev.then(() => p));
  try {
    await prev;
    return await fn();
  } finally {
    release();
    if (locks.get(key) === p) locks.delete(key);
  }
}

export const fsStore: Store = {
  async listCountries() {
    return readJsonOrSeed<Country[]>(FILES.countries, FILES.countriesSeed, []);
  },
  async getCountry(code) {
    const all = await this.listCountries();
    return all.find((c) => c.code === code) ?? null;
  },
  async replaceCountries(all) {
    return withLock("countries", async () => {
      await writeJson(FILES.countries, all);
    });
  },
  async upsertCountry(c) {
    return withLock("countries", async () => {
      const all = await readJsonOrSeed<Country[]>(
        FILES.countries,
        FILES.countriesSeed,
        [],
      );
      const idx = all.findIndex((x) => x.code === c.code);
      if (idx >= 0) all[idx] = c;
      else all.push(c);
      await writeJson(FILES.countries, all);
    });
  },

  async getCurrentPrices() {
    return readJsonOrSeed<PriceMap>(FILES.pricesCurrent, null, {});
  },
  async setCurrentPrices(prices) {
    return withLock("prices", async () => {
      await writeJson(FILES.pricesCurrent, prices);
    });
  },
  async getPricesLastFetch() {
    return readJsonOrSeed<number>(FILES.pricesLastFetch, null, 0);
  },
  async setPricesLastFetch(ts) {
    return withLock("pricesLastFetch", async () => {
      await writeJson(FILES.pricesLastFetch, ts);
    });
  },
  async appendPriceSnapshot(code, snap) {
    return withLock("history", async () => {
      const all = await readJsonOrSeed<Record<string, PriceSnapshot[]>>(
        FILES.pricesHistory,
        null,
        {},
      );
      const arr = all[code] ?? [];
      arr.push(snap);
      if (arr.length > HISTORY_CAP) arr.splice(0, arr.length - HISTORY_CAP);
      all[code] = arr;
      await writeJson(FILES.pricesHistory, all);
    });
  },
  async getPriceHistory(code) {
    const all = await readJsonOrSeed<Record<string, PriceSnapshot[]>>(
      FILES.pricesHistory,
      null,
      {},
    );
    return all[code] ?? [];
  },

  async listUsers() {
    return readJsonOrSeed<User[]>(FILES.users, null, []);
  },
  async getUser(id) {
    const all = await this.listUsers();
    return all.find((u) => u.id === id) ?? null;
  },
  async getUserByName(displayName) {
    const all = await this.listUsers();
    const lc = displayName.trim().toLowerCase();
    return all.find((u) => u.displayName.toLowerCase() === lc) ?? null;
  },
  async upsertUser(u) {
    return withLock("users", async () => {
      const all = await readJsonOrSeed<User[]>(FILES.users, null, []);
      const idx = all.findIndex((x) => x.id === u.id);
      if (idx >= 0) all[idx] = u;
      else all.push(u);
      await writeJson(FILES.users, all);
    });
  },

  async getPortfolio(userId) {
    const all = await this.listPortfolios();
    return all.find((p) => p.userId === userId) ?? null;
  },
  async savePortfolio(p) {
    return withLock("portfolios", async () => {
      const all = await readJsonOrSeed<Portfolio[]>(FILES.portfolios, null, []);
      const idx = all.findIndex((x) => x.userId === p.userId);
      if (idx >= 0) all[idx] = p;
      else all.push(p);
      await writeJson(FILES.portfolios, all);
    });
  },
  async listPortfolios() {
    return readJsonOrSeed<Portfolio[]>(FILES.portfolios, null, []);
  },

  async getContestState() {
    return readJsonOrSeed<ContestState>(FILES.contestState, null, {
      closed: false,
    });
  },
  async setContestState(s) {
    return withLock("contestState", async () => {
      await writeJson(FILES.contestState, s);
    });
  },
};
