"use client";

import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { WalletConnectButton } from "../../../components/WalletConnectButton";
import { PortfolioHoldingsTable } from "../../../components/PortfolioHoldingsTable";

interface PortfolioResponse {
  address: string;
  native: {
    symbol: string;
    balance: string;
    usd_price: number | null;
    usd_value: number | null;
  };
  tokens: {
    contract: string;
    symbol: string;
    name: string;
    decimals: number;
    balance: string;
    usd_price: number | null;
    usd_value: number | null;
  }[];
  total_usd_value: number;
}

export default function PortfolioPage() {
  const { address, isConnected } = useAccount();

  const { data, isLoading, error } = useQuery<PortfolioResponse>({
    queryKey: ["portfolio-balances", address],
    queryFn: async () => {
      const res = await fetch(`/api/portfolio/balances?address=${address}`);
      if (!res.ok) throw new Error("Failed to fetch portfolio balances");
      return res.json();
    },
    enabled: Boolean(isConnected && address),
    staleTime: 30_000,
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 rounded-2xl border border-border bg-panel p-6 shadow-panel">
        <h1 className="text-3xl font-bold tracking-tight text-ink">Portfolio</h1>
        <p className="mt-1 text-xs text-mist">Data sources: Alchemy (balances) + CoinGecko (USD pricing)</p>
      </div>
      <div className="mb-4">
        <WalletConnectButton />
      </div>

      {!isConnected && <div className="text-sm text-mist">Connect your wallet to view holdings.</div>}

      {isConnected && isLoading && <div className="text-sm text-mist">Loading holdings...</div>}

      {isConnected && error && <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error.message}</div>}

      {isConnected && data && (
        <div>
          <div className="mb-4 rounded-xl border border-border bg-panel px-4 py-3 text-xl font-semibold text-ink shadow-panel">
            Total USD Value: $
            {data.total_usd_value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </div>
          <PortfolioHoldingsTable native={data.native} tokens={data.tokens} />
        </div>
      )}
    </main>
  );
}
