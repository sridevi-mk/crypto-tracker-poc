"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

const REFRESH_MS = Number(process.env.NEXT_PUBLIC_REFRESH_MS) || 30000;

type CoinRow = {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  total_volume: number;
  price_change_percentage_24h: number;
};

function change24h(c: CoinRow) {
  return typeof c.price_change_percentage_24h === "number" ? c.price_change_percentage_24h : 0;
}

function KpiCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "up" | "down";
}) {
  const toneClass =
    tone === "up" ? "text-emerald-600" : tone === "down" ? "text-rose-600" : "text-ink";
  return (
    <div className="rounded-xl border border-border bg-panel p-4 shadow-panel">
      <div className="text-[11px] font-medium uppercase tracking-wider text-mist">{label}</div>
      <div className={`mt-2 text-2xl font-bold ${toneClass}`}>{value}</div>
    </div>
  );
}

function fmtUsd(n: number) {
  return `$${n.toLocaleString()}`;
}

export default function DashboardPage() {
  const [topN, setTopN] = useState(50);
  const [minMarketCap, setMinMarketCap] = useState(0);
  const [direction, setDirection] = useState<"all" | "gainers" | "losers">("all");

  const { data, isLoading, error } = useQuery({
    queryKey: ["market-top-dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/market/top?per_page=250");
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        const message = body?.error
          ? `${body.error}${body?.status ? ` (${body.status})` : ""}`
          : "Failed to fetch";
        throw new Error(message);
      }
      return body as { coins: CoinRow[] };
    },
    refetchInterval: REFRESH_MS,
    staleTime: 30000,
  });

  const allItems = data?.coins || [];
  const items = useMemo(() => {
    const base = allItems.filter((c) => (c.market_cap || 0) >= minMarketCap);
    const withDirection =
      direction === "gainers"
        ? base.filter((c) => change24h(c) >= 0)
        : direction === "losers"
          ? base.filter((c) => change24h(c) < 0)
          : base;
    return withDirection
      .sort((a, b) => (b.market_cap || 0) - (a.market_cap || 0))
      .slice(0, topN);
  }, [allItems, minMarketCap, direction, topN]);

  const totalMarketCap = items.reduce((sum, c) => sum + (c.market_cap || 0), 0);
  const totalVolume = items.reduce((sum, c) => sum + (c.total_volume || 0), 0);
  const avgChange24h = items.length
    ? items.reduce((sum, c) => sum + change24h(c), 0) / items.length
    : 0;
  const gainers = [...items]
    .sort((a, b) => change24h(b) - change24h(a))
    .slice(0, 5);
  const losers = [...items]
    .sort((a, b) => change24h(a) - change24h(b))
    .slice(0, 5);
  const topByCap = [...items].sort((a, b) => b.market_cap - a.market_cap).slice(0, 8);
  const topByVolume = [...items].sort((a, b) => b.total_volume - a.total_volume).slice(0, 8);
  const maxCap = topByCap[0]?.market_cap || 1;
  const maxVol = topByVolume[0]?.total_volume || 1;

  const sparkData = [...items]
    .sort((a, b) => b.market_cap - a.market_cap)
    .slice(0, 12)
    .map((c) => c.current_price || 0);
  const minSpark = Math.min(...sparkData, 0);
  const maxSpark = Math.max(...sparkData, 1);
  const sparkPoints = sparkData
    .map((v, i) => {
      const x = (i / Math.max(sparkData.length - 1, 1)) * 100;
      const y = 90 - ((v - minSpark) / Math.max(maxSpark - minSpark, 1)) * 80;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-panel p-6 shadow-panel">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-ink">Power Dashboard</h1>
          <p className="mt-1 text-xs text-mist">Data source: CoinGecko API (via `/api/market/top`)</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/"
            className="rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium text-ink hover:bg-slate-50"
          >
            Back to Overview
          </Link>
          <Link
            href="/screener"
            className="rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium text-ink hover:bg-slate-50"
          >
            Open Screener
          </Link>
        </div>
      </div>

      <div className="mb-6 grid gap-3 rounded-xl border border-border bg-panel p-4 shadow-panel md:grid-cols-4">
        <div className="md:col-span-1">
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-mist">Top N</label>
          <select
            value={topN}
            onChange={(e) => setTopN(Number(e.target.value))}
            className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-ink outline-none ring-cyan-200 focus:ring-2"
          >
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={250}>250</option>
          </select>
        </div>
        <div className="md:col-span-1">
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-mist">Min Market Cap</label>
          <select
            value={minMarketCap}
            onChange={(e) => setMinMarketCap(Number(e.target.value))}
            className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-ink outline-none ring-cyan-200 focus:ring-2"
          >
            <option value={0}>No minimum</option>
            <option value={1_000_000_000}>$1B+</option>
            <option value={10_000_000_000}>$10B+</option>
            <option value={100_000_000_000}>$100B+</option>
          </select>
        </div>
        <div className="md:col-span-1">
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-mist">24h Direction</label>
          <select
            value={direction}
            onChange={(e) => setDirection(e.target.value as "all" | "gainers" | "losers")}
            className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-ink outline-none ring-cyan-200 focus:ring-2"
          >
            <option value="all">All</option>
            <option value="gainers">Gainers only</option>
            <option value="losers">Losers only</option>
          </select>
        </div>
        <div className="md:col-span-1">
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-mist">Result Set</label>
          <div className="rounded-lg border border-border bg-slate-50 px-3 py-2 text-sm font-medium text-ink">
            {items.length} of {allItems.length}
          </div>
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Tracked Coins" value={String(items.length)} />
        <KpiCard label="Total Market Cap" value={fmtUsd(totalMarketCap)} />
        <KpiCard label="24h Total Volume" value={fmtUsd(totalVolume)} />
        <KpiCard
          label="Average 24h Change"
          value={`${avgChange24h.toFixed(2)}%`}
          tone={avgChange24h >= 0 ? "up" : "down"}
        />
      </div>

      {isLoading && <div className="rounded-lg border border-border bg-panel p-4 text-sm text-mist">Loading dashboard...</div>}
      {error && <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error.message}</div>}

      {!isLoading && !error && items.length === 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          No coins match your current filters. Try lowering min market cap or changing direction.
        </div>
      )}

      {!isLoading && !error && items.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-12">
          <section className="rounded-xl border border-border bg-panel p-4 shadow-panel lg:col-span-5">
            <h2 className="text-sm font-semibold text-ink">Market Cap Ranking</h2>
            <div className="mt-3 space-y-2">
              {topByCap.map((c) => (
                <div key={c.id}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium text-ink">{c.symbol.toUpperCase()}</span>
                    <span className="text-mist">{fmtUsd(c.market_cap)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"
                      style={{ width: `${(c.market_cap / maxCap) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-border bg-panel p-4 shadow-panel lg:col-span-4">
            <h2 className="text-sm font-semibold text-ink">Price Trend (Top Coins)</h2>
            <svg viewBox="0 0 100 100" className="mt-3 h-44 w-full rounded-lg bg-slate-50">
              <polyline
                fill="none"
                stroke="#0ea5e9"
                strokeWidth="2.5"
                points={sparkPoints}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p className="mt-2 text-xs text-mist">Relative line chart by current price (top market cap assets).</p>
          </section>

          <section className="rounded-xl border border-border bg-panel p-4 shadow-panel lg:col-span-3">
            <h2 className="text-sm font-semibold text-ink">Market Breadth</h2>
            <div className="mt-3 space-y-3">
              <div>
                <div className="mb-1 text-xs text-mist">Advancing</div>
                <div className="text-lg font-semibold text-emerald-600">
                  {items.filter((c) => c.price_change_percentage_24h >= 0).length}
                </div>
              </div>
              <div>
                <div className="mb-1 text-xs text-mist">Declining</div>
                <div className="text-lg font-semibold text-rose-600">
                  {items.filter((c) => c.price_change_percentage_24h < 0).length}
                </div>
              </div>
              <div>
                <div className="mb-1 text-xs text-mist">Flat</div>
                <div className="text-lg font-semibold text-ink">
                  {items.filter((c) => Math.abs(c.price_change_percentage_24h) < 0.01).length}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-panel p-4 shadow-panel lg:col-span-6">
            <h2 className="text-sm font-semibold text-ink">Top Gainers (24h)</h2>
            <div className="mt-3 space-y-2">
              {gainers.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <img src={c.image} alt={c.symbol} width={20} height={20} />
                    <span className="text-sm font-medium text-ink">{c.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-emerald-700">{change24h(c).toFixed(2)}%</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-border bg-panel p-4 shadow-panel lg:col-span-6">
            <h2 className="text-sm font-semibold text-ink">Top Losers (24h)</h2>
            <div className="mt-3 space-y-2">
              {losers.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-lg bg-rose-50 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <img src={c.image} alt={c.symbol} width={20} height={20} />
                    <span className="text-sm font-medium text-ink">{c.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-rose-700">{change24h(c).toFixed(2)}%</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-border bg-panel p-4 shadow-panel lg:col-span-12">
            <h2 className="text-sm font-semibold text-ink">Volume Distribution</h2>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {topByVolume.map((c) => (
                <div key={c.id}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium text-ink">{c.symbol.toUpperCase()}</span>
                    <span className="text-mist">{fmtUsd(c.total_volume)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                      style={{ width: `${(c.total_volume / maxVol) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
