import type {
  Country,
  PriceMap,
  PriceSnapshot,
  Portfolio,
  User,
  ContestState,
} from "./types";

export interface Store {
  // Countries (seeded once)
  listCountries(): Promise<Country[]>;
  getCountry(code: string): Promise<Country | null>;
  replaceCountries(all: Country[]): Promise<void>;
  upsertCountry(c: Country): Promise<void>;

  // Prices
  getCurrentPrices(): Promise<PriceMap>;
  setCurrentPrices(prices: PriceMap): Promise<void>;
  getPricesLastFetch(): Promise<number>;
  setPricesLastFetch(ts: number): Promise<void>;
  appendPriceSnapshot(code: string, snap: PriceSnapshot): Promise<void>;
  getPriceHistory(code: string): Promise<PriceSnapshot[]>;

  // Users
  listUsers(): Promise<User[]>;
  getUser(id: string): Promise<User | null>;
  getUserByName(displayName: string): Promise<User | null>;
  upsertUser(u: User): Promise<void>;

  // Portfolios
  getPortfolio(userId: string): Promise<Portfolio | null>;
  savePortfolio(p: Portfolio): Promise<void>;
  listPortfolios(): Promise<Portfolio[]>;

  // Contest state
  getContestState(): Promise<ContestState>;
  setContestState(s: ContestState): Promise<void>;
}

import { fsStore } from "./store-fs";
import { kvStore } from "./store-kv";

const backend = (process.env.STORE_BACKEND ?? "fs").toLowerCase();
export const store: Store = backend === "kv" ? kvStore : fsStore;
