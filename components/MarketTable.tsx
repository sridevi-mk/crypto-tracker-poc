"use client";
import { useEffect, useMemo, useState } from "react";

export interface MarketTableItem {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  total_volume: number;
  price_change_percentage_24h: number;
}

interface MarketTableProps {
  items: MarketTableItem[];
  isLoading?: boolean;
  error?: string | null;
  preset?: {
    search?: string;
    sort?: "current_price" | "price_change_percentage_24h" | "market_cap" | "total_volume";
    desc?: boolean;
    direction?: "all" | "gainers" | "losers";
    minMarketCap?: number;
    limit?: number;
  } | null;
}

const SORTS = [
  { value: "current_price", label: "Price" },
  { value: "price_change_percentage_24h", label: "24h %" },
  { value: "market_cap", label: "Market Cap" },
  { value: "total_volume", label: "Volume" },
];

export function MarketTable({ items, isLoading, error, preset }: MarketTableProps) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("market_cap");
  const [desc, setDesc] = useState(true);
  const [direction, setDirection] = useState<"all" | "gainers" | "losers">("all");
  const [minMarketCap, setMinMarketCap] = useState(0);
  const [limit, setLimit] = useState(0);

  useEffect(() => {
    if (!preset) return;
    if (typeof preset.search === "string") setSearch(preset.search);
    if (preset.sort) setSort(preset.sort);
    if (typeof preset.desc === "boolean") setDesc(preset.desc);
    if (preset.direction) setDirection(preset.direction);
    if (typeof preset.minMarketCap === "number") setMinMarketCap(preset.minMarketCap);
    if (typeof preset.limit === "number") setLimit(preset.limit);
  }, [preset]);

  const filtered = useMemo(() => {
    let data = items;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      data = data.filter((c) => c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q));
    }
    if (minMarketCap > 0) {
      data = data.filter((c) => (c.market_cap || 0) >= minMarketCap);
    }
    if (direction === "gainers") {
      data = data.filter((c) => (c.price_change_percentage_24h || 0) >= 0);
    } else if (direction === "losers") {
      data = data.filter((c) => (c.price_change_percentage_24h || 0) < 0);
    }
    data = [...data].sort((a, b) => {
      const av = a[sort as keyof MarketTableItem] as number;
      const bv = b[sort as keyof MarketTableItem] as number;
      return desc ? bv - av : av - bv;
    });
    if (limit > 0) data = data.slice(0, limit);
    return data;
  }, [items, search, sort, desc, direction, minMarketCap, limit]);

  return (
    <div className="rounded-xl border border-border bg-panel p-4 shadow-panel">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <input
          placeholder="Search by name or symbol"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none ring-cyan-200 transition focus:ring-2"
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none ring-cyan-200 transition focus:ring-2"
        >
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <button
          onClick={() => setDesc((d) => !d)}
          title="Toggle sort order"
          className="rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium text-ink transition hover:bg-slate-50"
        >
          {desc ? "Desc" : "Asc"}
        </button>
      </div>
      <div className="mb-4 flex flex-wrap gap-2 text-xs">
        <span className="rounded-md bg-slate-100 px-2 py-1 text-mist">Direction: {direction}</span>
        <span className="rounded-md bg-slate-100 px-2 py-1 text-mist">
          Min Market Cap: {minMarketCap > 0 ? `$${minMarketCap.toLocaleString()}` : "None"}
        </span>
        <span className="rounded-md bg-slate-100 px-2 py-1 text-mist">Limit: {limit > 0 ? limit : "None"}</span>
        <span className="rounded-md bg-slate-100 px-2 py-1 text-mist">Rows: {filtered.length}</span>
      </div>
      {isLoading ? (
        <div className="py-6 text-center text-sm text-mist">Loading market data...</div>
      ) : error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-mist">
                <th className="border-b border-border px-3 py-2 text-left">Coin</th>
                <th className="border-b border-border px-3 py-2 text-right">Price</th>
                <th className="border-b border-border px-3 py-2 text-right">24h %</th>
                <th className="border-b border-border px-3 py-2 text-right">Market Cap</th>
                <th className="border-b border-border px-3 py-2 text-right">Volume</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="text-sm text-ink transition hover:bg-slate-50">
                  <td className="border-b border-glow px-3 py-3">
                    <div className="flex items-center gap-2">
                      <img src={c.image} alt={c.symbol} width={20} height={20} />
                      <span className="font-medium">{c.name}</span>
                      <span className="text-xs text-mist">({c.symbol.toUpperCase()})</span>
                    </div>
                  </td>
                  <td className="border-b border-glow px-3 py-3 text-right">${c.current_price.toLocaleString()}</td>
                  <td
                    className={`border-b border-glow px-3 py-3 text-right font-medium ${c.price_change_percentage_24h >= 0 ? "text-emerald-600" : "text-rose-600"}`}
                  >
                    {c.price_change_percentage_24h?.toFixed(2)}%
                  </td>
                  <td className="border-b border-glow px-3 py-3 text-right">${c.market_cap.toLocaleString()}</td>
                  <td className="border-b border-glow px-3 py-3 text-right">${c.total_volume.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
