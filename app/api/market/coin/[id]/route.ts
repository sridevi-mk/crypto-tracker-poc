import { fetchCoinGecko } from '@/lib/coingecko';
import { cacheGet, cacheSet } from '@/lib/cache';
import { z } from 'zod';
import type { NextRequest } from 'next/server';

const paramsSchema = z.object({
  id: z.string().min(1),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const parse = paramsSchema.safeParse(params);
  if (!parse.success) {
    return new Response(
      JSON.stringify({ error: 'Invalid coin id', details: parse.error.flatten() }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
  const { id } = parse.data;
  const cacheKey = `coin:${id}`;
  const cached = cacheGet<any>(cacheKey);
  if (cached) {
    return new Response(JSON.stringify(cached), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'X-Cache': 'HIT' },
    });
  }
  try {
    const data = await fetchCoinGecko<any>(
      `/coins/${id}`,
      {
        localization: 'false',
        tickers: 'false',
        market_data: 'true',
        community_data: 'false',
        developer_data: 'false',
        sparkline: 'false',
      }
    );
    // Sanitize description (short plain text)
    let desc = data?.description?.en || '';
    desc = desc.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    if (desc.length > 300) desc = desc.slice(0, 297) + '...';
    const result = {
      id: data.id,
      symbol: data.symbol,
      name: data.name,
      image: data.image?.large || data.image?.thumb || '',
      homepage: Array.isArray(data.links?.homepage) ? data.links.homepage[0] : '',
      categories: data.categories || [],
      description: desc,
      market: data.market_data || {},
    };
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
