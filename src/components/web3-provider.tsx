"use client"

import { type ReactNode } from "react"
import { createAppKit } from "@reown/appkit/react"
import { WagmiProvider } from "wagmi"
import {
  wagmiAdapter,
  wagmiConfig,
  projectId,
  networks,
} from "@/lib/wagmi-config"
import { siweConfig } from "@/lib/siwe-config"

if (projectId) {
  createAppKit({
    adapters: [wagmiAdapter],
    projectId,
    networks: [...networks],
    metadata: {
      name: "Cool Places",
      description: "Pinned places I want to visit",
      url: "",
      icons: [],
    },
    features: {
      analytics: false,
    },
    siweConfig,
  })
}

export function Web3Provider({ children }: { children: ReactNode }) {
  return <WagmiProvider config={wagmiConfig}>{children}</WagmiProvider>
}
