"use client";
import { useQuery } from '@tanstack/react-query';
import { MarketTable } from '../../../components/MarketTable';

const REFRESH_MS = Number(process.env.NEXT_PUBLIC_REFRESH_MS) || 30000;

export default function ScreenerPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['market-top'],
    queryFn: async () => {
      const res = await fetch('/api/market/top');
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
    refetchInterval: REFRESH_MS,
    staleTime: 30000,
  });

  const items = data?.coins || [];

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 rounded-2xl border border-border bg-panel p-6 shadow-panel">
        <h1 className="text-3xl font-bold tracking-tight text-ink">Market Screener</h1>
        <p className="mt-1 text-xs text-mist">Data source: CoinGecko API (via `/api/market/top`)</p>
      </div>
      <MarketTable items={items} isLoading={isLoading} error={error?.message} />
    </main>
  );
}
