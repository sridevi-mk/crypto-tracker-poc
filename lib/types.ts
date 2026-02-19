// Shared TypeScript types for CoinGecko API

export interface Coin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  price_change_percentage_24h: number;
}

export interface CoinGeckoListResponse {
  coins: Coin[];
}

export interface CoinGeckoError {
  status: string;
  message: string;
}
