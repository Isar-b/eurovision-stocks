# Eurovision Stocks

Paper-trading game for Eurovision 2026. Sign in with Google, get a £1,000 fictional budget, buy and sell countries like stocks while live Polymarket prices move. Compete with friends on the leaderboard before the Grand Final on 16 May 2026.

Hobby project — no real money, no real betting.

## Stack

Next.js 16 + React 19 + Tailwind v4 + NextAuth v5 + Upstash Redis. Prices from the [Polymarket Gamma API](https://gamma-api.polymarket.com/) (`eurovision-winner-2026` event).

## Local dev

```bash
npm install
npm run seed:countries   # one-time: pull country list + Polymarket token IDs
npm run dev
```

Open http://localhost:3000 and sign in with any display name.

## Tests

```bash
npm test
```

## Deployment

See `DEPLOY.md`.
