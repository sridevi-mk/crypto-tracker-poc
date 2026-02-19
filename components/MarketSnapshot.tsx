"use client";
import React from "react";

export interface MarketSnapshotItem {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  total_volume: number;
  price_change_percentage_24h: number;
}

interface MarketSnapshotProps {
  items: MarketSnapshotItem[];
}

export function MarketSnapshot({ items }: MarketSnapshotProps) {
  if (!items || items.length === 0) return null;
  const topGainer = items.reduce((max, c) =>
    c.price_change_percentage_24h > (max?.price_change_percentage_24h ?? -Infinity) ? c : max, items[0]);
  const topLoser = items.reduce((min, c) =>
    c.price_change_percentage_24h < (min?.price_change_percentage_24h ?? Infinity) ? c : min, items[0]);
  const totalVolume = items.reduce((sum, c) => sum + c.total_volume, 0);

  return (
    <div className="mb-6 grid gap-4 md:grid-cols-3">
      <div className="rounded-xl border border-border bg-panel p-4 shadow-panel">
        <div className="text-xs font-medium uppercase tracking-wide text-mist">Top Gainer</div>
        <div className="mt-2 flex items-center gap-2">
          <img src={topGainer.image} alt={topGainer.symbol} width={24} height={24} />
          <span className="font-medium text-ink">{topGainer.name} ({topGainer.symbol.toUpperCase()})</span>
        </div>
        <div className="mt-2 text-lg font-semibold text-emerald-600">{topGainer.price_change_percentage_24h?.toFixed(2)}%</div>
      </div>
      <div className="rounded-xl border border-border bg-panel p-4 shadow-panel">
        <div className="text-xs font-medium uppercase tracking-wide text-mist">Top Loser</div>
        <div className="mt-2 flex items-center gap-2">
          <img src={topLoser.image} alt={topLoser.symbol} width={24} height={24} />
          <span className="font-medium text-ink">{topLoser.name} ({topLoser.symbol.toUpperCase()})</span>
        </div>
        <div className="mt-2 text-lg font-semibold text-rose-600">{topLoser.price_change_percentage_24h?.toFixed(2)}%</div>
      </div>
      <div className="rounded-xl border border-border bg-panel p-4 shadow-panel">
        <div className="text-xs font-medium uppercase tracking-wide text-mist">Total Volume</div>
        <div className="mt-2 text-lg font-semibold text-ink">${totalVolume.toLocaleString()}</div>
      </div>
    </div>
  );
}
