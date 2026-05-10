export type Country = {
  code: string;
  name: string;
  flag: string;
  polymarketMarketId: string;
  polymarketSlug: string;
  yesTokenId: string;
  withdrawn?: boolean;
  openPrice: number;
};

export type PriceMap = Record<string, number>;

export type PriceSnapshot = {
  ts: number;
  price: number;
};

export type Holding = {
  units: number;
  costBasis: number;
};

export type Portfolio = {
  userId: string;
  cash: number;
  holdings: Record<string, Holding>;
  updatedAt: string;
};

export type User = {
  id: string;
  displayName: string;
  email?: string;
  avatar?: string;
  createdAt: string;
};

export type ContestState = {
  closed: boolean;
  winner?: string;
  closedAt?: string;
};

export type TradeSide = "buy" | "sell";
