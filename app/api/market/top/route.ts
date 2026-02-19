import { fetchCoinGecko } from '@/lib/coingecko';
import { cacheGet, cacheSet } from '@/lib/cache';
import { vsCurrencySchema, perPageSchema, pageSchema, orderSchema } from '@/lib/validation';
import { Coin } from '@/lib/types';
import { z } from 'zod';
import type { NextRequest } from 'next/server';

const querySchema = z.object({
  vs_currency: vsCurrencySchema.default('usd'),
  per_page: perPageSchema.default(50),
  page: pageSchema.default(1),
  order: orderSchema.default('market_cap_desc'),
});

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const query = Object.fromEntries(url.searchParams.entries());
  const parse = querySchema.safeParse(query);
  if (!parse.success) {
    return new Response(
      JSON.stringify({ error: 'Invalid query', details: parse.error.flatten() }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
  const { vs_currency, per_page, page, order } = parse.data;
  const cacheKey = `top:${vs_currency}:${per_page}:${page}:${order}`;
  const cached = cacheGet<Coin[]>(cacheKey);
  if (cached) {
    return new Response(JSON.stringify({ coins: cached }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'X-Cache': 'HIT' },
    });
  }
  try {
    const coins = await fetchCoinGecko<Coin[]>(
      '/coins/markets',
      { vs_currency, per_page, page, order }
    );
    cacheSet(cacheKey, coins, 60_000);
    return new Response(JSON.stringify({ coins }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'X-Cache': 'MISS' },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message || 'Failed to fetch data', status: err?.status || 500 }),
      { status: 502, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
