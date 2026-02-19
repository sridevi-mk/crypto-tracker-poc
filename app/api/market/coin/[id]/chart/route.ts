import { fetchCoinGecko } from '@/lib/coingecko';
import { cacheGet, cacheSet } from '@/lib/cache';
import { vsCurrencySchema, daysSchema } from '@/lib/validation';
import { z } from 'zod';
import type { NextRequest } from 'next/server';

const paramsSchema = z.object({
  id: z.string().min(1),
});
const querySchema = z.object({
  vs_currency: vsCurrencySchema.default('usd'),
  days: daysSchema.default('7'),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const url = new URL(req.url);
  const query = Object.fromEntries(url.searchParams.entries());
  const parseParams = paramsSchema.safeParse(params);
  const parseQuery = querySchema.safeParse(query);
  if (!parseParams.success) {
    return new Response(
      JSON.stringify({ error: 'Invalid coin id', details: parseParams.error.flatten() }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
  if (!parseQuery.success) {
    return new Response(
      JSON.stringify({ error: 'Invalid query', details: parseQuery.error.flatten() }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
  const { id } = parseParams.data;
  const { vs_currency, days } = parseQuery.data;
  const cacheKey = `chart:${id}:${vs_currency}:${days}`;
  const cached = cacheGet<any>(cacheKey);
  if (cached) {
    return new Response(JSON.stringify(cached), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'X-Cache': 'HIT' },
    });
  }
  try {
    const data = await fetchCoinGecko<any>(
      `/coins/${id}/market_chart`,
      { vs_currency, days }
    );
    // data.prices: [[timestamp, price], ...] (timestamp in ms)
    const series = Array.isArray(data.prices)
      ? data.prices.map(([t, p]: [number, number]) => ({ t: Math.floor(t / 1000), p }))
      : [];
    const result = { series };
    cacheSet(cacheKey, result, 60_000);
    return new Response(JSON.stringify(result), {
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
