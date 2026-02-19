"use client";
import { ReactNode } from "react";
import { createConfig, http, WagmiProvider as WagmiRootProvider } from "wagmi";
import { mainnet } from "viem/chains";
import { coinbaseWallet, injected, walletConnect } from "@wagmi/connectors";

const WALLETCONNECT_PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "";

const config = createConfig({
  chains: [mainnet],
  connectors: [
    injected(),
    walletConnect({
      projectId: WALLETCONNECT_PROJECT_ID,
      showQrModal: true,
    }),
    coinbaseWallet({
      appName: "CryptoTracker",
    }),
  ],
  transports: {
    [mainnet.id]: http(),
  },
});

export function WagmiProvider({ children }: { children: ReactNode }) {
  return <WagmiRootProvider config={config}>{children}</WagmiRootProvider>;
}
