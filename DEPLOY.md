# Deploying to Vercel

This is the manual checklist for getting Eurovision Stocks live on Vercel with Google sign-in and Upstash Redis. All the code is already wired — you just need to create three external accounts and paste tokens into Vercel.

## 1. Push the repo to GitHub

```bash
cd C:\Users\BhattI\eurovision-stocks
git init
git add -A
git commit -m "Initial: Eurovision Stocks v1"
gh repo create Isar-b/eurovision-stocks --public --source=. --push
```

## 2. Create the Upstash Redis database

1. Go to https://console.upstash.com → Create Database (free tier).
2. Name it `eurovision-stocks`. Region: closest to Vercel (Frankfurt or London).
3. Once created, copy the two values you'll need:
   - `UPSTASH_REDIS_REST_URL` (looks like `https://xxx.upstash.io`)
   - `UPSTASH_REDIS_REST_TOKEN`

## 3. Create a Google OAuth client

1. Go to https://console.cloud.google.com → APIs & Services → Credentials.
2. Create credentials → OAuth client ID → Web application.
3. Add **two** authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://eurovision-stocks.vercel.app/api/auth/callback/google` (you might have to come back and add this after the Vercel deploy assigns the actual domain)
4. Copy:
   - Client ID → `AUTH_GOOGLE_ID`
   - Client secret → `AUTH_GOOGLE_SECRET`

## 4. Generate an `AUTH_SECRET`

```bash
openssl rand -base64 32
```

This is what NextAuth uses to sign session JWTs. Save it as `AUTH_SECRET`.

## 5. Deploy on Vercel

1. Go to https://vercel.com/new → Import Git Repository → pick `eurovision-stocks`.
2. Framework: Next.js (auto-detected). Don't change the build command.
3. Set **Environment Variables**:
   ```
   STORE_BACKEND=kv
   KV_KEY_PREFIX=evs:
   UPSTASH_REDIS_REST_URL=<from step 2>
   UPSTASH_REDIS_REST_TOKEN=<from step 2>
   AUTH_GOOGLE_ID=<from step 3>
   AUTH_GOOGLE_SECRET=<from step 3>
   AUTH_SECRET=<from step 4>
   ADMIN_EMAILS=bhattacharjeeisar@gmail.com
   ```
4. Click Deploy.

## 6. Seed the production database

After the first deploy succeeds, push the country list into Upstash from your laptop:

```bash
# In a new file .env.production.local (gitignored), put:
# UPSTASH_REDIS_REST_URL=...
# UPSTASH_REDIS_REST_TOKEN=...

npx dotenv-cli -e .env.production.local -- tsx scripts/seed-kv.ts
```

This writes the 35 countries to `evs:countries` in Redis. The first user who hits `/markets` after that will trigger a Polymarket pull and populate `evs:prices:current`.

## 7. Smoke test

1. Open https://eurovision-stocks.vercel.app
2. Click Sign in with Google → consent screen → bounce back to /markets
3. See 35 country rows, prices match Polymarket
4. Open Finland, buy 5 units
5. Tap Portfolio — total = cash + 5 × current price
6. Tap Leaderboard — your row pinned

## After the contest (16 May 2026)

```bash
npx dotenv-cli -e .env.production.local -- tsx scripts/freeze-contest.ts <WINNER_CODE>
```

This locks trading and sets the winner's price to £100. Final leaderboard becomes the definitive ranking.
