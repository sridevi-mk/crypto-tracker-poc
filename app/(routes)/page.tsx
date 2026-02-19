"use client";
import { useQuery } from '@tanstack/react-query';
import { MarketSnapshot } from '../../components/MarketSnapshot';
import { MarketTable } from '../../components/MarketTable';
import Link from 'next/link';

const REFRESH_MS = Number(process.env.NEXT_PUBLIC_REFRESH_MS) || 30000;

export default function MarketPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['market-top'],
    queryFn: async () => {
      const res = await fetch('/api/market/top');
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        const message =
          body?.error
            ? `${body.error}${body?.status ? ` (${body.status})` : ''}`
            : 'Failed to fetch';
        throw new Error(message);
      }
      return body;
    },
    refetchInterval: REFRESH_MS,
    staleTime: 30000,
  });

  const items = data?.coins || [];

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 rounded-2xl border border-border bg-panel p-6 shadow-panel">
        <h1 className="text-3xl font-bold tracking-tight text-ink">Market Overview</h1>
        <div className="mt-3 flex items-center gap-2 text-sm text-mist">
          <span>New to crypto?</span>
          <Link
            href="/guide"
            className="inline-flex items-center rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1.5 font-semibold text-cyan-700 transition hover:bg-cyan-100 focus:outline-none focus:ring-2 focus:ring-cyan-300"
          >
            Read the quick guide
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 font-semibold text-emerald-700 transition hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-300"
          >
            Open Dashboard View
          </Link>
        </div>
        <p className="mt-1 text-xs text-mist">Data source: CoinGecko API (via `/api/market/top`)</p>
      </div>
      <MarketSnapshot items={items} />
      <MarketTable items={items} isLoading={isLoading} error={error?.message} />
    </main>
  );
}
