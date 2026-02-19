// CoinGecko API fetch utility
import { CoinGeckoError } from './types';

const COINGECKO_BASE_URL = process.env.COINGECKO_BASE_URL || 'https://api.coingecko.com/api/v3';
const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY;

export async function fetchCoinGecko<T>(path: string, query?: Record<string, string | number | undefined>): Promise<T> {
  const base = COINGECKO_BASE_URL.endsWith('/') ? COINGECKO_BASE_URL : `${COINGECKO_BASE_URL}/`;
  const normalizedPath = path.replace(/^\/+/, '');
  const url = new URL(normalizedPath, base);
  if (query) {
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined) url.searchParams.set(k, String(v));
    });
  }
  const headers: Record<string, string> = {};
  headers['accept'] = 'application/json';
  headers['user-agent'] = 'CryptoTracker/1.0 (+https://localhost)';
  if (COINGECKO_API_KEY) {
    headers['x-cg-pro-api-key'] = COINGECKO_API_KEY;
  }
  let res: Response;
  try {
    res = await fetch(url.toString(), { headers });
  } catch (err) {
    throw { status: 'network_error', message: (err as Error).message } as CoinGeckoError;
  }
  let data: any;
  const text = await res.text();
  try {
    data = text ? JSON.parse(text) : null;
  } catch (err) {
    const snippet = text.slice(0, 180).replace(/\s+/g, ' ').trim();
    throw {
      status: 'invalid_json',
      message: `Failed to parse JSON (HTTP ${res.status}${snippet ? `, body: ${snippet}` : ''})`,
    } as CoinGeckoError;
  }
  if (!res.ok) {
    throw { status: String(res.status), message: data?.error || res.statusText } as CoinGeckoError;
  }
  return data as T;
}
