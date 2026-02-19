"use client";

import React from "react";

export interface PortfolioNativeHolding {
  symbol: string;
  balance: string;
  usd_price: number | null;
  usd_value: number | null;
}

export interface PortfolioTokenHolding {
  contract: string;
  symbol: string;
  name: string;
  decimals: number;
  balance: string;
  usd_price: number | null;
  usd_value: number | null;
}

interface PortfolioHoldingsTableProps {
  native: PortfolioNativeHolding;
  tokens: PortfolioTokenHolding[];
}

function formatUnitsHex(hexValue: string, decimals: number, maxFractionDigits = 8): string {
  if (!hexValue || !hexValue.startsWith("0x")) return "0";
  if (!Number.isInteger(decimals) || decimals < 0) return "0";
  try {
    const raw = BigInt(hexValue);
    if (decimals === 0) return raw.toString();
    const base = 10n ** BigInt(decimals);
    const whole = raw / base;
    const fraction = raw % base;
    if (fraction === 0n) return whole.toString();
    const fractionFull = fraction.toString().padStart(decimals, "0");
    const fractionTrimmed = fractionFull.slice(0, maxFractionDigits).replace(/0+$/, "");
    return fractionTrimmed ? `${whole.toString()}.${fractionTrimmed}` : whole.toString();
  } catch {
    return "0";
  }
}

function formatUsd(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "--";
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export function PortfolioHoldingsTable({ native, tokens }: PortfolioHoldingsTableProps) {
  const rows = [
    {
      key: "native",
      name: "Ethereum",
      symbol: native.symbol,
      contract: "-",
      balanceDisplay: formatUnitsHex(native.balance, 18),
      usdPrice: native.usd_price,
      usdValue: native.usd_value,
    },
    ...tokens.map((t) => ({
      key: t.contract,
      name: t.name || t.symbol || "Unknown",
      symbol: t.symbol || "-",
      contract: t.contract,
      balanceDisplay: formatUnitsHex(t.balance, t.decimals),
      usdPrice: t.usd_price,
      usdValue: t.usd_value,
    })),
  ];

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-panel p-4 shadow-panel">
      <table className="min-w-full border-separate border-spacing-0">
        <thead>
          <tr className="text-xs uppercase tracking-wide text-mist">
            <th className="border-b border-border px-3 py-2 text-left">Asset</th>
            <th className="border-b border-border px-3 py-2 text-right">Balance</th>
            <th className="border-b border-border px-3 py-2 text-right">USD Price</th>
            <th className="border-b border-border px-3 py-2 text-right">USD Value</th>
            <th className="border-b border-border px-3 py-2 text-left">Contract</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} className="text-sm text-ink transition hover:bg-slate-50">
              <td className="border-b border-glow px-3 py-3">
                {r.name} <span className="text-xs text-mist">({r.symbol})</span>
              </td>
              <td className="border-b border-glow px-3 py-3 text-right">{r.balanceDisplay}</td>
              <td className="border-b border-glow px-3 py-3 text-right">{formatUsd(r.usdPrice)}</td>
              <td className="border-b border-glow px-3 py-3 text-right">{formatUsd(r.usdValue)}</td>
              <td className="border-b border-glow px-3 py-3 font-mono text-xs text-slate-600">{r.contract}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
