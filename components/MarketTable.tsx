"use client";
import { useMemo, useState } from "react";

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
}

const SORTS = [
  { value: "current_price", label: "Price" },
  { value: "price_change_percentage_24h", label: "24h %" },
  { value: "market_cap", label: "Market Cap" },
  { value: "total_volume", label: "Volume" },
];

export function MarketTable({ items, isLoading, error }: MarketTableProps) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("market_cap");
  const [desc, setDesc] = useState(true);

  const filtered = useMemo(() => {
    let data = items;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      data = data.filter((c) => c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q));
    }
    data = [...data].sort((a, b) => {
      const av = a[sort as keyof MarketTableItem] as number;
      const bv = b[sort as keyof MarketTableItem] as number;
      return desc ? bv - av : av - bv;
    });
    return data;
  }, [items, search, sort, desc]);

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
