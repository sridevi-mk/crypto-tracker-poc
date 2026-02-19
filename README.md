# CryptoTracker

## Setup

1. Copy `.env.example` to `.env` and fill in values.
2. Install dependencies from repo root:
   ```bash
   npm install
   ```
3. Start the app from repo root:
   ```bash
   npx next dev ./crptotracker-workspace
   ```

## Environment Variables
Required:
- `ALCHEMY_API_KEY`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`

Common optional:
- `ALCHEMY_NETWORK` (default: `eth-mainnet`)
- `COINGECKO_API_KEY`
- `COINGECKO_BASE_URL`
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
- `NEXT_PUBLIC_REFRESH_MS`

## Run Commands
From repo root:
```bash
npx next dev ./crptotracker-workspace
npx next build ./crptotracker-workspace
npm test
```

## MVP Features
- Market overview + screener (CoinGecko-backed)
- Coin detail with chart
- Wallet connect + portfolio balances and USD valuation
- Tuffy AI chat endpoint and floating chat widget
