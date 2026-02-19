"use client";
import { useAccount, useConnect, useDisconnect, useNetwork } from 'wagmi';
import { InjectedConnector } from '@wagmi/connectors/injected';
import { useState } from 'react';

function shortAddress(addr: string) {
  return addr.slice(0, 6) + '...' + addr.slice(-4);
}

export function WalletConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect, isLoading, pendingConnector } = useConnect({
    connector: new InjectedConnector(),
  });
  const { disconnect } = useDisconnect();
  const { chain } = useNetwork();
  const [showWarn, setShowWarn] = useState(false);

  // Only Ethereum mainnet supported
  const isWrongNetwork = chain && chain.id !== 1;

  if (isConnected) {
    return (
      <div className="flex items-center gap-2">
        {isWrongNetwork && (
          <span className="rounded-md bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">Wrong network</span>
        )}
        <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs text-slate-700">{shortAddress(address!)}</span>
        <button
          onClick={() => disconnect()}
          className="rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium text-ink transition hover:bg-slate-50"
        >
          Disconnect
        </button>
      </div>
    );
  }
  return (
    <button
      onClick={() => connect()}
      disabled={isLoading}
      className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isLoading ? 'Connecting...' : 'Connect Wallet'}
    </button>
  );
}
